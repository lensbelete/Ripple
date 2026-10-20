import type { NodeType } from "@ripple/shared-types";

export const NODE_FIELD_LABELS: Record<NodeType, Record<string, string>> = {
  supplier: {
    leadTimeDays: "Lead time (days)",
    reliability: "Modeled reliability (0–1)",
    capacityPerDay: "Capacity per day",
    unitCost: "Unit cost",
  },
  resource: {
    capacityPerDay: "Capacity per day",
    unitCost: "Unit cost",
  },
  inventory: {
    onHandQuantity: "On-hand quantity",
    reservedQuantity: "Reserved quantity",
    reorderThreshold: "Reorder threshold",
    unitCost: "Unit cost",
  },
  production_process: {
    durationDays: "Duration (days)",
    outputQuantity: "Output quantity",
    capacityPerPeriod: "Capacity per period",
  },
  customer_order: {
    requiredQuantity: "Required quantity",
    dueDay: "Due day (from model origin)",
    revenue: "Revenue",
    priority: "Priority (1 is highest)",
  },
  delivery: {
    transitDays: "Transit time (days)",
    capacity: "Capacity",
  },
  financial_constraint: {
    budgetLimit: "Budget limit",
    availableCash: "Available cash",
  },
};
