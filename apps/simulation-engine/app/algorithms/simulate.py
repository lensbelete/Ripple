from __future__ import annotations

import copy
from dataclasses import dataclass, field

import networkx as nx

from app.core.exceptions import SimulationError
from app.schemas.simulation import (
    AffectedNode,
    CausalPath,
    ConstraintViolation,
    CostDifference,
    DelayedOrder,
    EngineRunResult,
    GraphDependency,
    GraphNode,
    Modification,
    NodeRunResult,
    Shortage,
    SimulateRequest,
    SimulateResponse,
)

MAX_NODES = 500
MAX_EDGES = 2000
MATERIAL_TYPES = {
    "material_supply",
    "resource_consumption",
    "production_input",
    "order_fulfillment",
    "timing_constraint",
}
CONFIG_FIELDS: dict[str, tuple[str, ...]] = {
    "supplier": ("leadTimeDays", "reliability", "capacityPerDay", "unitCost"),
    "resource": ("capacityPerDay", "unitCost"),
    "inventory": ("onHandQuantity", "reservedQuantity", "reorderThreshold", "unitCost"),
    "production_process": ("durationDays", "outputQuantity", "capacityPerPeriod"),
    "customer_order": ("requiredQuantity", "dueDay", "revenue", "priority"),
    "delivery": ("transitDays", "capacity"),
    "financial_constraint": ("budgetLimit", "availableCash"),
}

ASSUMPTIONS = [
    "Time is measured in days from a model origin of day 0.",
    "Supplier reliability is stored but not treated as a probability of further delay.",
    "Inventory available stock is on-hand quantity minus reserved quantity.",
    "Production starts only after each required inbound quantity has arrived.",
    "A missing edge quantity is treated as no modeled flow for that dependency.",
    "Direct cost uses explicit unitCost fields only. Unmodeled downstream losses are not invented.",
    "Financial nodes report budget and cash pressure; they do not halt production in this version.",
]


@dataclass
class Batch:
    day: float
    quantity: float


@dataclass
class EdgeFlow:
    quantity: float
    ready_day: float | None


@dataclass
class NodeRuntime:
    node: GraphNode
    result: NodeRunResult
    batches: list[Batch] = field(default_factory=list)


class SimulationEngine:
    def __init__(self, nodes: list[GraphNode], dependencies: list[GraphDependency], horizon_days: int) -> None:
        self.horizon_days = horizon_days
        self.nodes = {node.id: copy.deepcopy(node) for node in sorted(nodes, key=lambda item: item.id)}
        self.dependencies = sorted(dependencies, key=lambda item: item.id)
        self.warnings: list[str] = []
        self.graph = self._build_graph()
        self.order = list(nx.topological_sort(self.graph))
        self.edge_flow: dict[str, EdgeFlow] = {}
        self.runtime: dict[str, NodeRuntime] = {}

    def _build_graph(self) -> nx.DiGraph:
        if len(self.nodes) > MAX_NODES or len(self.dependencies) > MAX_EDGES:
            raise SimulationError("Graph exceeds the simulation size limit of 500 nodes and 2000 dependencies.")
        graph: nx.DiGraph = nx.DiGraph()
        for node_id in sorted(self.nodes):
            graph.add_node(node_id)
        for dependency in self.dependencies:
            if dependency.sourceNodeId not in self.nodes or dependency.targetNodeId not in self.nodes:
                raise SimulationError("A dependency refers to a node that is not in the model.")
            if dependency.sourceNodeId == dependency.targetNodeId:
                raise SimulationError("A node cannot depend on itself.")
            graph.add_edge(dependency.sourceNodeId, dependency.targetNodeId, id=dependency.id)
        if not nx.is_directed_acyclic_graph(graph):
            cycle = nx.find_cycle(graph, orientation="original")
            names = [self.nodes[source].name for source, target, _orientation in cycle]
            names.append(self.nodes[cycle[0][1]].name)
            raise SimulationError(
                "Unsupported cyclic dependency: " + " → ".join(names) + ". Remove the cycle before simulation.",
                code="cycle",
            )
        return graph

    def run(self) -> EngineRunResult:
        for node_id in self.order:
            self._process(self.nodes[node_id])
        self._apply_financial_constraints()
        return EngineRunResult(nodes=[self.runtime[node_id].result for node_id in self.order])

    def _outgoing(self, node_id: str) -> list[GraphDependency]:
        return [dependency for dependency in self.dependencies if dependency.sourceNodeId == node_id]

    def _incoming(self, node_id: str) -> list[GraphDependency]:
        return [dependency for dependency in self.dependencies if dependency.targetNodeId == node_id]

    def _process(self, node: GraphNode) -> None:
        required_keys = CONFIG_FIELDS.get(node.type)
        if required_keys is None:
            raise SimulationError(f'Unsupported node type "{node.type}".')
        missing = [key for key in required_keys if key not in node.config]
        if missing:
            raise SimulationError(f"{node.name} is missing configuration: {', '.join(missing)}.")

        if node.type == "supplier":
            runtime = self._process_capacity_source(node, ready_day=number(node.config, "leadTimeDays"))
        elif node.type == "resource":
            runtime = self._process_capacity_source(node, ready_day=0)
        elif node.type == "inventory":
            runtime = self._process_inventory(node)
        elif node.type == "production_process":
            runtime = self._process_production(node)
        elif node.type == "delivery":
            runtime = self._process_delivery(node)
        elif node.type == "customer_order":
            runtime = self._process_order(node)
        else:
            runtime = self._process_financial(node)

        self.runtime[node.id] = runtime
        if node.type != "inventory":
            self._allocate_outgoing(runtime)

    def _process_capacity_source(self, node: GraphNode, ready_day: float) -> NodeRuntime:
        capacity_per_day = max(0.0, number(node.config, "capacityPerDay"))
        unit_cost = number(node.config, "unitCost")
        available_days = max(0.0, self.horizon_days - ready_day)
        capacity_total = capacity_per_day * available_days
        outgoing_need = self._outgoing_need(node.id)
        constraints: list[str] = []
        supplied = capacity_total
        shortage = 0.0
        if outgoing_need > 0:
            supplied = min(capacity_total, outgoing_need)
            shortage = max(0.0, outgoing_need - capacity_total)
            if shortage > 0:
                constraints.append("capacity_exceeded")
        result = node_result(
            node,
            ready_day=ready_day,
            start_day=ready_day,
            quantity_available=supplied,
            quantity_required=outgoing_need,
            shortage=shortage,
            delay_days=0,
            direct_cost=round(unit_cost * supplied, 6) if supplied else 0,
            constraints=constraints,
        )
        batches = [Batch(day=ready_day, quantity=supplied)] if supplied > 0 else []
        return NodeRuntime(node=node, result=result, batches=batches)

    def _process_inventory(self, node: GraphNode) -> NodeRuntime:
        on_hand = number(node.config, "onHandQuantity")
        reserved = number(node.config, "reservedQuantity")
        unit_cost = number(node.config, "unitCost")
        available = max(0.0, on_hand - reserved)
        if reserved > on_hand:
            self.warnings.append(f"{node.name}: reserved quantity exceeds on-hand stock. Available stock is 0.")
        batches = [Batch(day=0, quantity=available)] if available > 0 else []
        constraints: list[str] = []
        for dependency in self._incoming(node.id):
            flow = self.edge_flow.get(dependency.id)
            if flow is None:
                continue
            if flow.quantity > 0 and flow.ready_day is not None:
                batches.append(Batch(day=flow.ready_day, quantity=flow.quantity))
        runtime = NodeRuntime(
            node=node,
            result=node_result(
                node,
                ready_day=0,
                start_day=0,
                quantity_available=available,
                quantity_required=0,
                shortage=0,
                delay_days=0,
                direct_cost=0,
                constraints=[],
            ),
            batches=batches,
        )
        self._allocate_outgoing(runtime)
        outgoing_need = self._outgoing_need(node.id)
        taken = 0.0
        ready_day: float | None = 0 if available > 0 and outgoing_need == 0 else None
        for dependency in self._outgoing(node.id):
            flow = self.edge_flow[dependency.id]
            taken += flow.quantity
            if flow.quantity > 0 and flow.ready_day is not None:
                ready_day = flow.ready_day if ready_day is None else max(ready_day, flow.ready_day)
        shortage = max(0.0, outgoing_need - taken)
        if shortage > 0:
            constraints.append("inventory_shortage")
        runtime.result = node_result(
            node,
            ready_day=ready_day,
            start_day=0,
            quantity_available=taken if outgoing_need > 0 else available,
            quantity_required=outgoing_need,
            shortage=shortage,
            delay_days=0,
            direct_cost=round(unit_cost * taken, 6),
            constraints=constraints,
        )
        return runtime

    def _process_production(self, node: GraphNode) -> NodeRuntime:
        duration = max(0.0, number(node.config, "durationDays"))
        output_quantity = max(0.0, number(node.config, "outputQuantity"))
        capacity = max(0.0, number(node.config, "capacityPerPeriod"))
        constraints: list[str] = []
        fill_ratios: list[float] = []
        start_day = 0.0
        has_required_input = False
        can_start = True
        for dependency in self._incoming(node.id):
            if dependency.type not in MATERIAL_TYPES:
                continue
            required = dependency.quantity if dependency.quantity is not None else 0.0
            if required <= 0:
                self.warnings.append(
                    f"Dependency {dependency.id} into {node.name} has no quantity, so it does not constrain production.",
                )
                continue
            has_required_input = True
            flow = self.edge_flow.get(dependency.id, EdgeFlow(quantity=0, ready_day=None))
            fill_ratios.append(min(1.0, flow.quantity / required))
            if flow.quantity <= 0 or flow.ready_day is None:
                can_start = False
            else:
                start_day = max(start_day, flow.ready_day)
            if flow.quantity + 1e-9 < required:
                constraints.append("input_shortage")
        intended = output_quantity
        if intended > capacity + 1e-9:
            constraints.append("production_capacity")
            intended = capacity
        fill = min(fill_ratios) if fill_ratios else 1.0
        produced = intended * fill if can_start else 0.0
        ready_day = start_day + duration if can_start else None
        if has_required_input and not can_start:
            ready_day = None
            produced = 0.0
        outgoing_need = self._outgoing_need(node.id)
        required = outgoing_need if outgoing_need > 0 else output_quantity
        shortage = max(0.0, required - produced)
        result = node_result(
            node,
            ready_day=ready_day,
            start_day=start_day if can_start else None,
            quantity_available=produced,
            quantity_required=required,
            shortage=shortage,
            delay_days=0,
            direct_cost=None,
            constraints=unique(constraints),
        )
        batches = [Batch(day=ready_day, quantity=produced)] if produced > 0 and ready_day is not None else []
        return NodeRuntime(node=node, result=result, batches=batches)

    def _process_delivery(self, node: GraphNode) -> NodeRuntime:
        transit = max(0.0, number(node.config, "transitDays"))
        capacity = max(0.0, number(node.config, "capacity"))
        inbound_qty = 0.0
        start_day: float | None = None
        constraints: list[str] = []
        for dependency in self._incoming(node.id):
            flow = self.edge_flow.get(dependency.id)
            if flow is None or flow.quantity <= 0 or flow.ready_day is None:
                continue
            inbound_qty += flow.quantity
            start_day = flow.ready_day if start_day is None else max(start_day, flow.ready_day)
        shipped = inbound_qty
        if inbound_qty > capacity + 1e-9:
            constraints.append("delivery_capacity")
            shipped = capacity
        ready_day = None if start_day is None else start_day + transit
        outgoing_need = self._outgoing_need(node.id)
        required = outgoing_need if outgoing_need > 0 else inbound_qty
        result = node_result(
            node,
            ready_day=ready_day,
            start_day=start_day,
            quantity_available=shipped,
            quantity_required=required,
            shortage=max(0.0, required - shipped),
            delay_days=0,
            direct_cost=None,
            constraints=constraints,
        )
        batches = [Batch(day=ready_day, quantity=shipped)] if shipped > 0 and ready_day is not None else []
        return NodeRuntime(node=node, result=result, batches=batches)

    def _process_order(self, node: GraphNode) -> NodeRuntime:
        required = max(0.0, number(node.config, "requiredQuantity"))
        due_day = number(node.config, "dueDay")
        inbound_qty = 0.0
        fulfillment_day: float | None = None
        constraints: list[str] = []
        for dependency in self._incoming(node.id):
            flow = self.edge_flow.get(dependency.id)
            if flow is None or flow.quantity <= 0 or flow.ready_day is None:
                continue
            inbound_qty += flow.quantity
            fulfillment_day = flow.ready_day if fulfillment_day is None else max(fulfillment_day, flow.ready_day)
        fulfilled = min(required, inbound_qty)
        shortage = max(0.0, required - fulfilled)
        delay = 0.0
        if shortage > 0:
            constraints.append("order_unfulfilled")
        if fulfillment_day is not None and fulfillment_day > due_day + 1e-9:
            delay = round(fulfillment_day - due_day, 6)
            constraints.append("deadline_violated")
        result = node_result(
            node,
            ready_day=fulfillment_day,
            start_day=fulfillment_day,
            quantity_available=fulfilled,
            quantity_required=required,
            shortage=shortage,
            delay_days=delay,
            direct_cost=None,
            constraints=unique(constraints),
        )
        return NodeRuntime(node=node, result=result, batches=[])

    def _process_financial(self, node: GraphNode) -> NodeRuntime:
        result = node_result(
            node,
            ready_day=0,
            start_day=0,
            quantity_available=0,
            quantity_required=0,
            shortage=0,
            delay_days=0,
            direct_cost=None,
            constraints=[],
        )
        return NodeRuntime(node=node, result=result, batches=[])

    def _apply_financial_constraints(self) -> None:
        modeled_cost = sum(item.result.directCost or 0 for item in self.runtime.values() if item.result.directCost is not None)
        for runtime in self.runtime.values():
            if runtime.node.type != "financial_constraint":
                continue
            budget = number(runtime.node.config, "budgetLimit")
            cash = number(runtime.node.config, "availableCash")
            constraints = list(runtime.result.constraints)
            if modeled_cost > cash + 1e-9:
                constraints.append("cash_exceeded")
            if modeled_cost > budget + 1e-9:
                constraints.append("budget_exceeded")
            runtime.result.constraints = unique(constraints)

    def _outgoing_need(self, node_id: str) -> float:
        total = 0.0
        for dependency in self._outgoing(node_id):
            if dependency.quantity is None:
                self.warnings.append(
                    f"Dependency from {self.nodes[node_id].name} has no quantity and does not create demand.",
                )
                continue
            total += dependency.quantity
        return total

    def _allocate_outgoing(self, runtime: NodeRuntime) -> None:
        outgoing = self._outgoing(runtime.node.id)
        remaining = list(runtime.batches)
        for dependency in outgoing:
            need = dependency.quantity if dependency.quantity is not None else 0.0
            if need <= 0:
                self.edge_flow[dependency.id] = EdgeFlow(quantity=0, ready_day=None)
                continue
            taken, ready_day, remaining = take_batches(remaining, need)
            self.edge_flow[dependency.id] = EdgeFlow(quantity=taken, ready_day=ready_day)
        runtime.batches = remaining


def simulate(request: SimulateRequest) -> SimulateResponse:
    original_nodes = copy.deepcopy(request.model.nodes)
    baseline_engine = SimulationEngine(request.model.nodes, request.model.dependencies, request.horizonDays)
    baseline = baseline_engine.run()
    warnings = list(dict.fromkeys(baseline_engine.warnings))

    scenario_nodes = apply_modifications(copy.deepcopy(request.model.nodes), request.modifications)
    if original_nodes != request.model.nodes:
        raise SimulationError("Scenario application mutated the baseline model.")

    scenario_engine = SimulationEngine(scenario_nodes, request.model.dependencies, request.horizonDays)
    scenario = scenario_engine.run()
    warnings.extend(warning for warning in scenario_engine.warnings if warning not in warnings)

    origins = {item.nodeId for item in request.modifications}
    baseline_by_id = {item.nodeId: item for item in baseline.nodes}
    scenario_by_id = {item.nodeId: item for item in scenario.nodes}
    names = {node.id: node.name for node in request.model.nodes}

    affected: list[AffectedNode] = []
    for node in request.model.nodes:
        before = baseline_by_id[node.id]
        after = scenario_by_id[node.id]
        if not changed(before, after):
            continue
        impact: str = "direct" if node.id in origins else "indirect"
        affected.append(
            AffectedNode(
                nodeId=node.id,
                name=node.name,
                type=node.type,
                impact=impact,  # type: ignore[arg-type]
                baseline=before,
                scenario=after,
                explanation=explain(node, before, after, node.id in origins),
            ),
        )
    affected.sort(key=lambda item: item.nodeId)

    delayed_orders = [
        DelayedOrder(
            nodeId=item.nodeId,
            name=item.name,
            dueDay=number(next(node.config for node in scenario_nodes if node.id == item.nodeId), "dueDay"),
            fulfillmentDay=item.readyDay,
            delayDays=item.delayDays,
            shortageQuantity=item.shortageQuantity,
        )
        for item in scenario.nodes
        if item.type == "customer_order" and (item.delayDays > 0 or item.shortageQuantity > 0)
    ]
    shortages = [
        Shortage(
            nodeId=item.nodeId,
            name=item.name,
            type=item.type,
            shortageQuantity=item.shortageQuantity,
            quantityRequired=item.quantityRequired,
        )
        for item in scenario.nodes
        if item.shortageQuantity > 0
    ]
    violations: list[ConstraintViolation] = []
    for item in scenario.nodes:
        for code in item.constraints:
            violations.append(
                ConstraintViolation(
                    nodeId=item.nodeId,
                    name=item.name,
                    code=code,
                    message=constraint_message(item.name, code),
                ),
            )

    graph = nx.DiGraph()
    graph.add_nodes_from(sorted(names))
    for dependency in sorted(request.model.dependencies, key=lambda item: item.id):
        graph.add_edge(dependency.sourceNodeId, dependency.targetNodeId)
    causal_paths = [
        path
        for node_id in sorted(item.nodeId for item in affected)
        for path in paths_from_origins(graph, origins, node_id, names)
    ]

    baseline_cost = total_cost(baseline.nodes)
    scenario_cost = total_cost(scenario.nodes)
    revenue_at_risk = 0.0
    for node in scenario_nodes:
        if node.type != "customer_order":
            continue
        after = scenario_by_id[node.id]
        if after.delayDays > 0 or after.shortageQuantity > 0:
            revenue_at_risk += number(node.config, "revenue")

    return SimulateResponse(
        horizonDays=request.horizonDays,
        baseline=baseline,
        scenario=scenario,
        affectedNodes=affected,
        delayedOrders=delayed_orders,
        shortages=shortages,
        constraintViolations=violations,
        costDifference=CostDifference(
            baselineDirectCost=baseline_cost,
            scenarioDirectCost=scenario_cost,
            difference=None if baseline_cost is None or scenario_cost is None else round(scenario_cost - baseline_cost, 6),
            estimatedRevenueAtRisk=round(revenue_at_risk, 6) if revenue_at_risk else 0,
            note="Direct cost uses unitCost × fulfilled supply. Revenue at risk is the modeled revenue of delayed or short orders, not a guaranteed loss.",
        ),
        causalPaths=causal_paths,
        assumptions=list(ASSUMPTIONS),
        warnings=warnings,
    )


def apply_modifications(nodes: list[GraphNode], modifications: list[Modification]) -> list[GraphNode]:
    by_id = {node.id: node for node in nodes}
    for modification in modifications:
        node = by_id.get(modification.nodeId)
        if node is None:
            raise SimulationError(f"Modification refers to unknown node {modification.nodeId}.")
        allowed = CONFIG_FIELDS.get(node.type, ())
        if modification.field not in allowed:
            raise SimulationError(f"{modification.field} is not a modeled field on {node.name}.")
        node.config[modification.field] = modification.value
    return nodes


def take_batches(batches: list[Batch], need: float) -> tuple[float, float | None, list[Batch]]:
    remaining: list[Batch] = []
    taken = 0.0
    ready: float | None = None
    for batch in sorted(batches, key=lambda item: (item.day, item.quantity)):
        if taken >= need - 1e-12 or batch.quantity <= 0:
            if batch.quantity > 0:
                remaining.append(batch)
            continue
        take = min(need - taken, batch.quantity)
        taken += take
        ready = batch.day if ready is None else max(ready, batch.day)
        leftover = batch.quantity - take
        if leftover > 1e-12:
            remaining.append(Batch(day=batch.day, quantity=leftover))
    return round(taken, 6), ready, remaining


def number(config: dict[str, object], key: str) -> float:
    value = config.get(key)
    if value is None or isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SimulationError(f"Configuration field {key} must be a number.")
    return float(value)


def node_result(
    node: GraphNode,
    ready_day: float | None,
    start_day: float | None,
    quantity_available: float,
    quantity_required: float,
    shortage: float,
    delay_days: float,
    direct_cost: float | None,
    constraints: list[str],
) -> NodeRunResult:
    return NodeRunResult(
        nodeId=node.id,
        name=node.name,
        type=node.type,
        readyDay=None if ready_day is None else round(ready_day, 6),
        startDay=None if start_day is None else round(start_day, 6),
        quantityAvailable=round(quantity_available, 6),
        quantityRequired=round(quantity_required, 6),
        shortageQuantity=round(shortage, 6),
        delayDays=round(delay_days, 6),
        directCost=None if direct_cost is None else round(direct_cost, 6),
        constraints=constraints,
    )


def changed(before: NodeRunResult, after: NodeRunResult) -> bool:
    return (
        before.readyDay != after.readyDay
        or before.startDay != after.startDay
        or before.quantityAvailable != after.quantityAvailable
        or before.shortageQuantity != after.shortageQuantity
        or before.delayDays != after.delayDays
        or before.directCost != after.directCost
        or before.constraints != after.constraints
    )


def explain(node: GraphNode, before: NodeRunResult, after: NodeRunResult, direct: bool) -> str:
    if direct:
        return f"{node.name} was changed by the scenario."
    parts: list[str] = []
    if before.readyDay != after.readyDay:
        parts.append(f"ready day {fmt(before.readyDay)} → {fmt(after.readyDay)}")
    if before.delayDays != after.delayDays:
        parts.append(f"delay {before.delayDays} → {after.delayDays} days")
    if before.shortageQuantity != after.shortageQuantity:
        parts.append(f"shortage {before.shortageQuantity} → {after.shortageQuantity}")
    if before.quantityAvailable != after.quantityAvailable:
        parts.append(f"available quantity {before.quantityAvailable} → {after.quantityAvailable}")
    detail = "; ".join(parts) if parts else "downstream values changed"
    return f"{node.name} changed because an upstream input changed ({detail})."


def fmt(value: float | None) -> str:
    return "none" if value is None else str(value)


def constraint_message(name: str, code: str) -> str:
    messages = {
        "capacity_exceeded": f"{name} cannot supply the required quantity within modeled capacity.",
        "inventory_shortage": f"{name} does not have enough available stock plus inbound supply.",
        "production_capacity": f"{name} is limited by capacity per period.",
        "input_shortage": f"{name} is missing required inputs.",
        "delivery_capacity": f"{name} exceeds modeled delivery capacity.",
        "order_unfulfilled": f"{name} is short of the required quantity.",
        "deadline_violated": f"{name} is fulfilled after its due day.",
        "cash_exceeded": f"{name}: modeled direct cost exceeds available cash.",
        "budget_exceeded": f"{name}: modeled direct cost exceeds the budget limit.",
    }
    return messages.get(code, f"{name}: {code}")


def paths_from_origins(graph: nx.DiGraph, origins: set[str], target: str, names: dict[str, str]) -> list[CausalPath]:
    if target in origins:
        return [CausalPath(nodeId=target, path=[target], pathNames=[names[target]])]
    found: list[CausalPath] = []
    for origin in sorted(origins):
        if origin not in graph or target not in graph:
            continue
        if nx.has_path(graph, origin, target):
            path = nx.shortest_path(graph, origin, target)
            found.append(CausalPath(nodeId=target, path=path, pathNames=[names[node_id] for node_id in path]))
    return found


def total_cost(nodes: list[NodeRunResult]) -> float | None:
    values = [item.directCost for item in nodes if item.directCost is not None]
    if not values:
        return None
    return round(sum(values), 6)


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(values))
