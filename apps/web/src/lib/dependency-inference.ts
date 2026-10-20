import type { DependencyType, NodeType } from "@ripple/shared-types";

export function inferDependencyType(source: NodeType, target: NodeType): DependencyType {
  if (source === "supplier") {
    return "material_supply";
  }
  if (source === "resource") {
    return "resource_consumption";
  }
  if (source === "inventory" && target === "production_process") {
    return "production_input";
  }
  if (source === "production_process" && (target === "customer_order" || target === "delivery")) {
    return "order_fulfillment";
  }
  if (source === "delivery") {
    return "timing_constraint";
  }
  if (source === "financial_constraint") {
    return "capacity_restriction";
  }
  return "production_input";
}
