from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class GraphNode(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: str
    name: str
    positionX: float = 0
    positionY: float = 0
    config: dict[str, Any] = Field(default_factory=dict)


class GraphDependency(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    sourceNodeId: str
    targetNodeId: str
    type: str
    quantity: float | None = None
    unit: str | None = None
    leadTimeDays: float | None = None


class ModelPayload(BaseModel):
    id: str
    name: str
    timeUnit: Literal["days"] = "days"
    nodes: list[GraphNode]
    dependencies: list[GraphDependency]


class Modification(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodeId: str
    field: str
    value: float


class SimulateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    model: ModelPayload
    modifications: list[Modification] = Field(default_factory=list)
    horizonDays: int = Field(default=90, ge=1, le=3650)


class NodeRunResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodeId: str
    name: str
    type: str
    readyDay: float | None
    startDay: float | None
    quantityAvailable: float
    quantityRequired: float
    shortageQuantity: float
    delayDays: float
    directCost: float | None
    constraints: list[str]


class EngineRunResult(BaseModel):
    nodes: list[NodeRunResult]


class AffectedNode(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodeId: str
    name: str
    type: str
    impact: Literal["direct", "indirect"]
    baseline: NodeRunResult
    scenario: NodeRunResult
    explanation: str


class DelayedOrder(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodeId: str
    name: str
    dueDay: float
    fulfillmentDay: float | None
    delayDays: float
    shortageQuantity: float


class Shortage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodeId: str
    name: str
    type: str
    shortageQuantity: float
    quantityRequired: float


class ConstraintViolation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodeId: str
    name: str
    code: str
    message: str


class CostDifference(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    baselineDirectCost: float | None
    scenarioDirectCost: float | None
    difference: float | None
    estimatedRevenueAtRisk: float | None
    note: str


class CausalPath(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodeId: str
    path: list[str]
    pathNames: list[str]


class SimulateResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: Literal["completed"] = "completed"
    horizonDays: int
    baseline: EngineRunResult
    scenario: EngineRunResult
    affectedNodes: list[AffectedNode]
    delayedOrders: list[DelayedOrder]
    shortages: list[Shortage]
    constraintViolations: list[ConstraintViolation]
    costDifference: CostDifference
    causalPaths: list[CausalPath]
    assumptions: list[str]
    warnings: list[str]
