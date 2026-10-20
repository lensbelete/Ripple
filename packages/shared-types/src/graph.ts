export const NODE_TYPES = [
  "supplier",
  "resource",
  "inventory",
  "production_process",
  "customer_order",
  "delivery",
  "financial_constraint",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const DEPENDENCY_TYPES = [
  "material_supply",
  "resource_consumption",
  "production_input",
  "order_fulfillment",
  "timing_constraint",
  "capacity_restriction",
] as const;

export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  supplier: "Supplier",
  resource: "Resource",
  inventory: "Inventory",
  production_process: "Production process",
  customer_order: "Customer order",
  delivery: "Delivery",
  financial_constraint: "Financial constraint",
};

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
  material_supply: "Material supply",
  resource_consumption: "Resource consumption",
  production_input: "Production input",
  order_fulfillment: "Order fulfillment",
  timing_constraint: "Timing constraint",
  capacity_restriction: "Capacity restriction",
};

export interface SupplierConfig {
  leadTimeDays: number;
  reliability: number;
  capacityPerDay: number;
  unitCost: number;
}

export interface ResourceConfig {
  capacityPerDay: number;
  unitCost: number;
}

export interface InventoryConfig {
  onHandQuantity: number;
  reservedQuantity: number;
  reorderThreshold: number;
  unitCost: number;
}

export interface ProductionProcessConfig {
  durationDays: number;
  outputQuantity: number;
  capacityPerPeriod: number;
}

export interface CustomerOrderConfig {
  requiredQuantity: number;
  dueDay: number;
  revenue: number;
  priority: number;
}

export interface DeliveryConfig {
  transitDays: number;
  capacity: number;
}

export interface FinancialConstraintConfig {
  budgetLimit: number;
  availableCash: number;
}

export type NodeConfigMap = {
  supplier: SupplierConfig;
  resource: ResourceConfig;
  inventory: InventoryConfig;
  production_process: ProductionProcessConfig;
  customer_order: CustomerOrderConfig;
  delivery: DeliveryConfig;
  financial_constraint: FinancialConstraintConfig;
};

export type NodeConfig = NodeConfigMap[NodeType];

export interface GraphNodeInput {
  id: string;
  type: string;
  name: string;
  positionX: number;
  positionY: number;
  config: unknown;
}

export interface GraphDependencyInput {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: string;
  quantity: number | null;
  unit: string | null;
  leadTimeDays: number | null;
}

export type GraphIssueSeverity = "error" | "warning";

export interface GraphIssue {
  severity: GraphIssueSeverity;
  code: string;
  message: string;
  nodeIds?: string[];
  dependencyIds?: string[];
}

export interface GraphValidationResult {
  valid: boolean;
  errors: GraphIssue[];
  warnings: GraphIssue[];
}

export interface ModelNodeDto {
  id: string;
  modelId: string;
  type: NodeType;
  name: string;
  positionX: number;
  positionY: number;
  config: NodeConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ModelDependencyDto {
  id: string;
  modelId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: DependencyType;
  quantity: number | null;
  unit: string | null;
  leadTimeDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SystemModelDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  timeUnit: "days";
  createdAt: string;
  updatedAt: string;
}

export interface SystemModelGraphDto extends SystemModelDto {
  nodes: ModelNodeDto[];
  dependencies: ModelDependencyDto[];
}

export interface WorkspaceDto {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
