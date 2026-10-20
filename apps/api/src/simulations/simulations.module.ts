import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { ModelsModule } from "../models/models.module";
import { SimulationEngineClient } from "./simulation-engine.client";
import { SimulationRun } from "./simulation-run.entity";
import { SimulationsController } from "./simulations.controller";
import { SimulationsService } from "./simulations.service";

@Module({
  imports: [TypeOrmModule.forFeature([SimulationRun]), ModelsModule, AuditModule],
  controllers: [SimulationsController],
  providers: [SimulationsService, SimulationEngineClient],
})
export class SimulationsModule {}
