import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { ModelDependency } from "./model-dependency.entity";
import { ModelNode } from "./model-node.entity";
import { ModelsController } from "./models.controller";
import { ModelsService } from "./models.service";
import { SystemModel } from "./system-model.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemModel, ModelNode, ModelDependency]),
    WorkspacesModule,
    AuditModule,
  ],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
