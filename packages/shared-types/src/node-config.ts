import {
  NODE_TYPES,
  type NodeConfig,
  type NodeConfigMap,
  type NodeType,
} from "./graph";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(config: Record<string, unknown>, key: string, errors: string[], min = 0): number {
  const value = config[key];
  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push(`${key} must be a number`);
    return 0;
  }
  if (value < min) {
    errors.push(`${key} must be at least ${min}`);
  }
  return value;
}

export function isNodeType(value: string): value is NodeType {
  return (NODE_TYPES as readonly string[]).includes(value);
}

export function defaultNodeConfig(type: NodeType): NodeConfig {
  switch (type) {
    case "supplier":
      return { leadTimeDays: 5, reliability: 1, capacityPerDay: 100, unitCost: 10 };
    case "resource":
      return { capacityPerDay: 40, unitCost: 25 };
    case "inventory":
      return { onHandQuantity: 100, reservedQuantity: 0, reorderThreshold: 20, unitCost: 8 };
    case "production_process":
      return { durationDays: 3, outputQuantity: 50, capacityPerPeriod: 50 };
    case "customer_order":
      return { requiredQuantity: 40, dueDay: 14, revenue: 8000, priority: 1 };
    case "delivery":
      return { transitDays: 2, capacity: 80 };
    case "financial_constraint":
      return { budgetLimit: 50000, availableCash: 50000 };
  }
}

export function validateNodeConfig(type: NodeType, config: unknown): string[] {
  if (!isRecord(config)) {
    return ["Configuration must be an object"];
  }

  const errors: string[] = [];

  switch (type) {
    case "supplier":
      readNumber(config, "leadTimeDays", errors);
      readNumber(config, "reliability", errors);
      if (typeof config.reliability === "number" && (config.reliability < 0 || config.reliability > 1)) {
        errors.push("reliability must be between 0 and 1");
      }
      readNumber(config, "capacityPerDay", errors);
      readNumber(config, "unitCost", errors);
      break;
    case "resource":
      readNumber(config, "capacityPerDay", errors);
      readNumber(config, "unitCost", errors);
      break;
    case "inventory":
      readNumber(config, "onHandQuantity", errors);
      readNumber(config, "reservedQuantity", errors);
      readNumber(config, "reorderThreshold", errors);
      readNumber(config, "unitCost", errors);
      break;
    case "production_process":
      readNumber(config, "durationDays", errors, 0);
      readNumber(config, "outputQuantity", errors);
      readNumber(config, "capacityPerPeriod", errors);
      break;
    case "customer_order":
      readNumber(config, "requiredQuantity", errors);
      readNumber(config, "dueDay", errors);
      readNumber(config, "revenue", errors);
      readNumber(config, "priority", errors, 1);
      break;
    case "delivery":
      readNumber(config, "transitDays", errors);
      readNumber(config, "capacity", errors);
      break;
    case "financial_constraint":
      readNumber(config, "budgetLimit", errors);
      readNumber(config, "availableCash", errors);
      break;
  }

  return errors;
}

export function parseNodeConfig<T extends NodeType>(type: T, config: unknown): NodeConfigMap[T] | null {
  if (validateNodeConfig(type, config).length > 0) {
    return null;
  }
  return config as NodeConfigMap[T];
}
