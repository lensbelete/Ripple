import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { join } from "path";
import { DataSource } from "typeorm";
import { AuditEvent } from "../audit/audit-event.entity";
import { ModelDependency } from "../models/model-dependency.entity";
import { ModelNode } from "../models/model-node.entity";
import { SystemModel } from "../models/system-model.entity";
import { User } from "../users/user.entity";
import { Workspace } from "../workspaces/workspace.entity";
import { InitialModelingSchema1760961600000 } from "./migrations/1760961600000-InitialModelingSchema";
import { SimulationRuns1760961700000 } from "./migrations/1760961700000-SimulationRuns";
import { SimulationRun } from "../simulations/simulation-run.entity";

loadEnv({ path: join(process.cwd(), "../../.env") });
loadEnv({ path: join(process.cwd(), ".env") });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? "ripple",
  password: process.env.DATABASE_PASSWORD ?? "ripple",
  database: process.env.DATABASE_NAME ?? "ripple",
  entities: [User, Workspace, SystemModel, ModelNode, ModelDependency, AuditEvent, SimulationRun],
  migrations: [InitialModelingSchema1760961600000, SimulationRuns1760961700000],
  migrationsRun: true,
});
