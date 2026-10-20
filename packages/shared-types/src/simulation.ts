export interface SimulationModification {
  nodeId: string;
  field: string;
  value: number;
}

export interface NodeRunResult {
  nodeId: string;
  name: string;
  type: string;
  readyDay: number | null;
  startDay: number | null;
  quantityAvailable: number;
  quantityRequired: number;
  shortageQuantity: number;
  delayDays: number;
  directCost: number | null;
  constraints: string[];
}

export interface AffectedNode {
  nodeId: string;
  name: string;
  type: string;
  impact: "direct" | "indirect";
  baseline: NodeRunResult;
  scenario: NodeRunResult;
  explanation: string;
}

export interface DelayedOrder {
  nodeId: string;
  name: string;
  dueDay: number;
  fulfillmentDay: number | null;
  delayDays: number;
  shortageQuantity: number;
}

export interface Shortage {
  nodeId: string;
  name: string;
  type: string;
  shortageQuantity: number;
  quantityRequired: number;
}

export interface ConstraintViolation {
  nodeId: string;
  name: string;
  code: string;
  message: string;
}

export interface CostDifference {
  baselineDirectCost: number | null;
  scenarioDirectCost: number | null;
  difference: number | null;
  estimatedRevenueAtRisk: number | null;
  note: string;
}

export interface CausalPath {
  nodeId: string;
  path: string[];
  pathNames: string[];
}

export interface EngineRunResult {
  nodes: NodeRunResult[];
}

export interface EngineSimulationResult {
  status: "completed";
  horizonDays: number;
  baseline: EngineRunResult;
  scenario: EngineRunResult;
  affectedNodes: AffectedNode[];
  delayedOrders: DelayedOrder[];
  shortages: Shortage[];
  constraintViolations: ConstraintViolation[];
  costDifference: CostDifference;
  causalPaths: CausalPath[];
  assumptions: string[];
  warnings: string[];
}

export interface SimulationRunDto {
  id: string;
  modelId: string;
  name: string;
  status: "completed";
  horizonDays: number;
  modifications: SimulationModification[];
  result: EngineSimulationResult;
  createdAt: string;
}

export interface SimulationRunDetailDto extends SimulationRunDto {
  modelSnapshot: {
    id: string;
    name: string;
    timeUnit: "days";
    nodes: Array<{
      id: string;
      type: string;
      name: string;
      positionX: number;
      positionY: number;
      config: unknown;
    }>;
    dependencies: Array<{
      id: string;
      sourceNodeId: string;
      targetNodeId: string;
      type: string;
      quantity: number | null;
      unit: string | null;
      leadTimeDays: number | null;
    }>;
  };
}
