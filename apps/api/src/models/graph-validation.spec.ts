import { defaultNodeConfig, validateModelGraph, type GraphNodeInput } from "@ripple/shared-types";

function node(
  id: string,
  type: GraphNodeInput["type"],
  name: string,
  config: GraphNodeInput["config"] = defaultNodeConfig(type as never),
): GraphNodeInput {
  return { id, type, name, positionX: 0, positionY: 0, config };
}

describe("validateModelGraph", () => {
  it("accepts a valid supply-chain DAG", () => {
    const nodes = [
      node("s", "supplier", "Supplier A"),
      node("i", "inventory", "Raw inventory"),
      node("p", "production_process", "Line 1"),
      node("o", "customer_order", "Order 42"),
    ];
    const dependencies = [
      {
        id: "d1",
        sourceNodeId: "s",
        targetNodeId: "i",
        type: "material_supply",
        quantity: 40,
        unit: "kg",
        leadTimeDays: null,
      },
      {
        id: "d2",
        sourceNodeId: "i",
        targetNodeId: "p",
        type: "production_input",
        quantity: 40,
        unit: "kg",
        leadTimeDays: null,
      },
      {
        id: "d3",
        sourceNodeId: "p",
        targetNodeId: "o",
        type: "order_fulfillment",
        quantity: 40,
        unit: "units",
        leadTimeDays: null,
      },
    ];

    const result = validateModelGraph(nodes, dependencies);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects an unsupported cycle and names the path", () => {
    const nodes = [
      node("a", "inventory", "Inventory"),
      node("b", "production_process", "Line 1"),
    ];
    const dependencies = [
      {
        id: "d1",
        sourceNodeId: "a",
        targetNodeId: "b",
        type: "production_input",
        quantity: 1,
        unit: null,
        leadTimeDays: null,
      },
      {
        id: "d2",
        sourceNodeId: "b",
        targetNodeId: "a",
        type: "production_input",
        quantity: 1,
        unit: null,
        leadTimeDays: null,
      },
    ];

    const result = validateModelGraph(nodes, dependencies);
    expect(result.valid).toBe(false);
    expect(result.errors.some((issue) => issue.code === "cycle")).toBe(true);
    expect(result.errors.find((issue) => issue.code === "cycle")?.message).toContain("Inventory");
  });

  it("rejects a self-loop", () => {
    const result = validateModelGraph(
      [node("a", "inventory", "Inventory")],
      [
        {
          id: "d1",
          sourceNodeId: "a",
          targetNodeId: "a",
          type: "production_input",
          quantity: null,
          unit: null,
          leadTimeDays: null,
        },
      ],
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((issue) => issue.code === "self_loop")).toBe(true);
  });

  it("rejects invalid node configuration instead of guessing values", () => {
    const result = validateModelGraph(
      [
        {
          id: "s",
          type: "supplier",
          name: "Supplier A",
          positionX: 0,
          positionY: 0,
          config: { leadTimeDays: "soon" },
        },
      ],
      [],
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((issue) => issue.code === "invalid_node_config")).toBe(true);
  });
});
