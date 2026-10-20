from app.schemas.simulation import GraphDependency, GraphNode, ModelPayload, SimulateRequest


def node(node_id: str, node_type: str, name: str, config: dict, x: float = 0, y: float = 0) -> GraphNode:
    return GraphNode(id=node_id, type=node_type, name=name, positionX=x, positionY=y, config=config)


def edge(
    edge_id: str,
    source: str,
    target: str,
    quantity: float,
    edge_type: str = "production_input",
) -> GraphDependency:
    return GraphDependency(
        id=edge_id,
        sourceNodeId=source,
        targetNodeId=target,
        type=edge_type,
        quantity=quantity,
        unit="units",
        leadTimeDays=None,
    )


def chain(on_hand: float, output_quantity: float = 40, capacity: float = 40, due_day: float = 10) -> ModelPayload:
    return ModelPayload(
        id="model-chain",
        name="Chain",
        nodes=[
            node(
                "s",
                "supplier",
                "Supplier A",
                {"leadTimeDays": 5, "reliability": 1, "capacityPerDay": 100, "unitCost": 10},
            ),
            node(
                "i",
                "inventory",
                "Raw inventory",
                {"onHandQuantity": on_hand, "reservedQuantity": 0, "reorderThreshold": 0, "unitCost": 10},
            ),
            node(
                "p",
                "production_process",
                "Line 1",
                {"durationDays": 2, "outputQuantity": output_quantity, "capacityPerPeriod": capacity},
            ),
            node(
                "o",
                "customer_order",
                "Order 42",
                {"requiredQuantity": 40, "dueDay": due_day, "revenue": 8000, "priority": 1},
            ),
        ],
        dependencies=[
            edge("d1", "s", "i", 40, "material_supply"),
            edge("d2", "i", "p", 40, "production_input"),
            edge("d3", "p", "o", 40, "order_fulfillment"),
        ],
    )


def two_branches() -> ModelPayload:
    return ModelPayload(
        id="model-branches",
        name="Branches",
        nodes=[
            node("s1", "supplier", "Supplier A", {"leadTimeDays": 5, "reliability": 1, "capacityPerDay": 100, "unitCost": 1}),
            node("s2", "supplier", "Supplier B", {"leadTimeDays": 5, "reliability": 1, "capacityPerDay": 100, "unitCost": 1}),
            node("i1", "inventory", "Inv A", {"onHandQuantity": 0, "reservedQuantity": 0, "reorderThreshold": 0, "unitCost": 1}),
            node("i2", "inventory", "Inv B", {"onHandQuantity": 0, "reservedQuantity": 0, "reorderThreshold": 0, "unitCost": 1}),
            node("p1", "production_process", "Line A", {"durationDays": 1, "outputQuantity": 10, "capacityPerPeriod": 10}),
            node("p2", "production_process", "Line B", {"durationDays": 1, "outputQuantity": 10, "capacityPerPeriod": 10}),
            node("o1", "customer_order", "Order A", {"requiredQuantity": 10, "dueDay": 20, "revenue": 100, "priority": 1}),
            node("o2", "customer_order", "Order B", {"requiredQuantity": 10, "dueDay": 20, "revenue": 100, "priority": 1}),
        ],
        dependencies=[
            edge("a1", "s1", "i1", 10, "material_supply"),
            edge("a2", "i1", "p1", 10),
            edge("a3", "p1", "o1", 10, "order_fulfillment"),
            edge("b1", "s2", "i2", 10, "material_supply"),
            edge("b2", "i2", "p2", 10),
            edge("b3", "p2", "o2", 10, "order_fulfillment"),
        ],
    )


def request_for(model: ModelPayload, lead_time: float | None = None, horizon: int = 90) -> SimulateRequest:
    modifications = []
    if lead_time is not None:
        modifications = [{"nodeId": "s", "field": "leadTimeDays", "value": lead_time}]
    return SimulateRequest.model_validate(
        {"model": model, "modifications": modifications, "horizonDays": horizon},
    )
