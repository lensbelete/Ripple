import {
  DEPENDENCY_TYPES,
  type GraphDependencyInput,
  type GraphIssue,
  type GraphNodeInput,
  type GraphValidationResult,
  type NodeType,
} from "./graph";
import { isNodeType, validateNodeConfig } from "./node-config";

const EXPECTED_CONNECTIONS: Partial<Record<NodeType, NodeType[]>> = {
  supplier: ["inventory", "resource", "production_process"],
  resource: ["production_process", "inventory"],
  inventory: ["production_process", "delivery", "customer_order"],
  production_process: ["inventory", "customer_order", "delivery", "production_process"],
  customer_order: ["delivery", "financial_constraint"],
  delivery: ["customer_order", "inventory"],
  financial_constraint: ["supplier", "inventory", "production_process", "customer_order"],
};

export function validateModelGraph(
  nodes: GraphNodeInput[],
  dependencies: GraphDependencyInput[],
): GraphValidationResult {
  const errors: GraphIssue[] = [];
  const warnings: GraphIssue[] = [];
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  if (new Set(nodes.map((node) => node.id)).size !== nodes.length) {
    errors.push({
      severity: "error",
      code: "duplicate_node_id",
      message: "The graph contains duplicate node IDs.",
    });
  }

  if (new Set(dependencies.map((dependency) => dependency.id)).size !== dependencies.length) {
    errors.push({
      severity: "error",
      code: "duplicate_dependency_id",
      message: "The graph contains duplicate dependency IDs.",
    });
  }

  for (const node of nodes) {
    if (!node.name.trim()) {
      errors.push({
        severity: "error",
        code: "empty_node_name",
        message: "Every node must have a name.",
        nodeIds: [node.id],
      });
    }

    if (!isNodeType(node.type)) {
      errors.push({
        severity: "error",
        code: "unknown_node_type",
        message: `Unsupported node type "${node.type}".`,
        nodeIds: [node.id],
      });
      continue;
    }

    const configErrors = validateNodeConfig(node.type, node.config);
    for (const message of configErrors) {
      errors.push({
        severity: "error",
        code: "invalid_node_config",
        message: `${node.name || node.id}: ${message}`,
        nodeIds: [node.id],
      });
    }
  }

  const edgeKeys = new Set<string>();

  for (const dependency of dependencies) {
    if (!(DEPENDENCY_TYPES as readonly string[]).includes(dependency.type)) {
      errors.push({
        severity: "error",
        code: "unknown_dependency_type",
        message: `Unsupported dependency type "${dependency.type}".`,
        dependencyIds: [dependency.id],
      });
    }

    if (dependency.sourceNodeId === dependency.targetNodeId) {
      errors.push({
        severity: "error",
        code: "self_loop",
        message: "A node cannot depend on itself.",
        nodeIds: [dependency.sourceNodeId],
        dependencyIds: [dependency.id],
      });
    }

    const source = nodesById.get(dependency.sourceNodeId);
    const target = nodesById.get(dependency.targetNodeId);
    if (!source || !target) {
      errors.push({
        severity: "error",
        code: "missing_endpoint",
        message: "A dependency refers to a node that is not in this model.",
        dependencyIds: [dependency.id],
      });
      continue;
    }

    const key = `${dependency.sourceNodeId}->${dependency.targetNodeId}`;
    if (edgeKeys.has(key)) {
      errors.push({
        severity: "error",
        code: "duplicate_edge",
        message: `More than one dependency exists from ${source.name} to ${target.name}.`,
        nodeIds: [source.id, target.id],
        dependencyIds: [dependency.id],
      });
    }
    edgeKeys.add(key);

    if (
      isNodeType(source.type) &&
      isNodeType(target.type) &&
      EXPECTED_CONNECTIONS[source.type] &&
      !EXPECTED_CONNECTIONS[source.type]?.includes(target.type)
    ) {
      warnings.push({
        severity: "warning",
        code: "unusual_connection",
        message: `A ${source.type.replaceAll("_", " ")} usually does not feed a ${target.type.replaceAll("_", " ")}. The connection will still be stored.`,
        nodeIds: [source.id, target.id],
        dependencyIds: [dependency.id],
      });
    }
  }

  const cycle = findCycle(nodes, dependencies);
  if (cycle) {
    const names = cycle.map((id) => nodesById.get(id)?.name ?? id);
    errors.push({
      severity: "error",
      code: "cycle",
      message: `Unsupported cyclic dependency: ${names.join(" → ")}. Remove the cycle before simulation.`,
      nodeIds: cycle,
    });
  }

  const connected = new Set<string>();
  for (const dependency of dependencies) {
    connected.add(dependency.sourceNodeId);
    connected.add(dependency.targetNodeId);
  }
  for (const node of nodes) {
    if (nodes.length > 1 && !connected.has(node.id)) {
      warnings.push({
        severity: "warning",
        code: "disconnected_node",
        message: `${node.name} is not connected to any other node.`,
        nodeIds: [node.id],
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function findCycle(
  nodes: GraphNodeInput[],
  dependencies: GraphDependencyInput[],
): string[] | null {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const dependency of dependencies) {
    adjacency.get(dependency.sourceNodeId)?.push(dependency.targetNodeId);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const parent = new Map<string, string>();

  const dfs = (nodeId: string): string[] | null => {
    visiting.add(nodeId);

    for (const next of adjacency.get(nodeId) ?? []) {
      if (visiting.has(next)) {
        const cycle = [next];
        let current = nodeId;
        while (current !== next) {
          cycle.push(current);
          current = parent.get(current) ?? next;
          if (cycle.length > nodes.length + 1) {
            break;
          }
        }
        cycle.push(next);
        return cycle.reverse();
      }

      if (!visited.has(next)) {
        parent.set(next, nodeId);
        const cycle = dfs(next);
        if (cycle) {
          return cycle;
        }
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return null;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const cycle = dfs(node.id);
      if (cycle) {
        return cycle;
      }
    }
  }

  return null;
}
