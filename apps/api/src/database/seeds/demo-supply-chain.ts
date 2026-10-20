import { hash } from "bcryptjs";
import { defaultNodeConfig } from "@ripple/shared-types";
import { AppDataSource } from "../data-source";
import { ModelDependency } from "../../models/model-dependency.entity";
import { ModelNode } from "../../models/model-node.entity";
import { SystemModel } from "../../models/system-model.entity";
import { User } from "../../users/user.entity";
import { Workspace } from "../../workspaces/workspace.entity";

const DEMO_EMAIL = "demo@ripple.local";
const DEMO_PASSWORD = "demo-ripple-2026";

async function seed() {
  await AppDataSource.initialize();
  const users = AppDataSource.getRepository(User);
  const workspaces = AppDataSource.getRepository(Workspace);
  const models = AppDataSource.getRepository(SystemModel);
  const nodes = AppDataSource.getRepository(ModelNode);
  const dependencies = AppDataSource.getRepository(ModelDependency);

  let user = await users.findOne({ where: { email: DEMO_EMAIL } });
  if (!user) {
    user = await users.save(
      users.create({
        email: DEMO_EMAIL,
        name: "Demo Analyst",
        passwordHash: await hash(DEMO_PASSWORD, 12),
      }),
    );
  }

  let workspace = await workspaces.findOne({
    where: { ownerId: user.id, name: "Northwind Manufacturing (sample)" },
  });
  if (!workspace) {
    workspace = await workspaces.save(
      workspaces.create({
        ownerId: user.id,
        name: "Northwind Manufacturing (sample)",
        description:
          "Sample workspace for local development. This is labeled demonstration data, not a real company.",
      }),
    );
  }

  let model = await models.findOne({
    where: { workspaceId: workspace.id, name: "Finished-goods supply chain (sample)" },
  });
  if (!model) {
    model = await models.save(
      models.create({
        workspaceId: workspace.id,
        name: "Finished-goods supply chain (sample)",
        description:
          "A labeled sample model: Supplier A feeds raw inventory, two production lines, and customer orders.",
        timeUnit: "days",
      }),
    );
  }

  await dependencies.delete({ modelId: model.id });
  await nodes.delete({ modelId: model.id });

  const ids = {
    supplierA: "11111111-1111-4111-8111-111111111111",
    supplierB: "11111111-1111-4111-8111-111111111112",
    rawInventory: "22222222-2222-4222-8222-222222222221",
    packInventory: "22222222-2222-4222-8222-222222222222",
    line1: "33333333-3333-4333-8333-333333333331",
    line2: "33333333-3333-4333-8333-333333333332",
    order42: "44444444-4444-4444-8444-444444444442",
    order18: "44444444-4444-4444-8444-444444444418",
    delivery: "55555555-5555-4555-8555-555555555555",
    cash: "66666666-6666-4666-8666-666666666666",
  };

  await nodes.insert([
    {
      id: ids.supplierA,
      modelId: model.id,
      type: "supplier",
      name: "Supplier A",
      positionX: 40,
      positionY: 80,
      config: { ...defaultNodeConfig("supplier"), leadTimeDays: 5, capacityPerDay: 80, unitCost: 12 },
    },
    {
      id: ids.supplierB,
      modelId: model.id,
      type: "supplier",
      name: "Supplier B (packaging)",
      positionX: 40,
      positionY: 280,
      config: { ...defaultNodeConfig("supplier"), leadTimeDays: 3, capacityPerDay: 200, unitCost: 2 },
    },
    {
      id: ids.rawInventory,
      modelId: model.id,
      type: "inventory",
      name: "Raw material inventory",
      positionX: 320,
      positionY: 80,
      config: { ...defaultNodeConfig("inventory"), onHandQuantity: 40, reorderThreshold: 20, unitCost: 12 },
    },
    {
      id: ids.packInventory,
      modelId: model.id,
      type: "inventory",
      name: "Packaging inventory",
      positionX: 320,
      positionY: 280,
      config: { ...defaultNodeConfig("inventory"), onHandQuantity: 400, reorderThreshold: 80, unitCost: 2 },
    },
    {
      id: ids.line1,
      modelId: model.id,
      type: "production_process",
      name: "Production line 1",
      positionX: 600,
      positionY: 40,
      config: { ...defaultNodeConfig("production_process"), durationDays: 4, outputQuantity: 40, capacityPerPeriod: 40 },
    },
    {
      id: ids.line2,
      modelId: model.id,
      type: "production_process",
      name: "Production line 2",
      positionX: 600,
      positionY: 220,
      config: { ...defaultNodeConfig("production_process"), durationDays: 2, outputQuantity: 20, capacityPerPeriod: 20 },
    },
    {
      id: ids.order42,
      modelId: model.id,
      type: "customer_order",
      name: "Customer order 42",
      positionX: 1100,
      positionY: 40,
      config: { ...defaultNodeConfig("customer_order"), requiredQuantity: 40, dueDay: 12, revenue: 18000, priority: 1 },
    },
    {
      id: ids.order18,
      modelId: model.id,
      type: "customer_order",
      name: "Customer order 18",
      positionX: 880,
      positionY: 220,
      config: { ...defaultNodeConfig("customer_order"), requiredQuantity: 20, dueDay: 18, revenue: 6000, priority: 2 },
    },
    {
      id: ids.delivery,
      modelId: model.id,
      type: "delivery",
      name: "Outbound delivery",
      positionX: 880,
      positionY: 40,
      config: { ...defaultNodeConfig("delivery"), transitDays: 2, capacity: 80 },
    },
    {
      id: ids.cash,
      modelId: model.id,
      type: "financial_constraint",
      name: "Operating cash (sample)",
      positionX: 600,
      positionY: 400,
      config: { ...defaultNodeConfig("financial_constraint"), budgetLimit: 50000, availableCash: 42000 },
    },
  ]);

  await dependencies.insert([
    edge(model.id, ids.supplierA, ids.rawInventory, "material_supply", 80, "kg"),
    edge(model.id, ids.supplierB, ids.packInventory, "material_supply", 200, "units"),
    edge(model.id, ids.rawInventory, ids.line1, "production_input", 40, "kg"),
    edge(model.id, ids.packInventory, ids.line1, "production_input", 40, "units"),
    edge(model.id, ids.rawInventory, ids.line2, "production_input", 20, "kg"),
    edge(model.id, ids.line1, ids.delivery, "order_fulfillment", 40, "units"),
    edge(model.id, ids.delivery, ids.order42, "timing_constraint", 40, "units", 2),
    edge(model.id, ids.line2, ids.order18, "order_fulfillment", 20, "units"),
    edge(model.id, ids.cash, ids.line1, "capacity_restriction", 50000, "USD"),
  ]);

  console.log("Seeded sample workspace for demo@ripple.local");
  await AppDataSource.destroy();
}

function edge(
  modelId: string,
  sourceNodeId: string,
  targetNodeId: string,
  type: string,
  quantity: number,
  unit: string,
  leadTimeDays?: number,
) {
  return {
    modelId,
    sourceNodeId,
    targetNodeId,
    type,
    quantity: String(quantity),
    unit,
    leadTimeDays: leadTimeDays === undefined ? null : String(leadTimeDays),
  };
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
