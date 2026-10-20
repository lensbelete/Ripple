import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  GraphValidationResult,
  ModelDependencyDto,
  ModelNodeDto,
  NodeConfig,
  NodeType,
  SystemModelDto,
  SystemModelGraphDto,
  validateModelGraph,
} from "@ripple/shared-types";
import { DataSource, Repository } from "typeorm";
import { AuditService } from "../audit/audit.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { SaveGraphDto } from "./dto/save-graph.dto";
import { ModelDependency } from "./model-dependency.entity";
import { ModelNode } from "./model-node.entity";
import { SystemModel } from "./system-model.entity";

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(SystemModel)
    private readonly models: Repository<SystemModel>,
    @InjectRepository(ModelNode)
    private readonly nodes: Repository<ModelNode>,
    @InjectRepository(ModelDependency)
    private readonly dependencies: Repository<ModelDependency>,
    private readonly workspaces: WorkspacesService,
    private readonly audit: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async listForWorkspace(workspaceId: string, userId: string): Promise<SystemModelDto[]> {
    await this.workspaces.getForUser(workspaceId, userId);
    const rows = await this.models.find({
      where: { workspaceId },
      order: { updatedAt: "DESC" },
    });
    return rows.map((model) => this.toModelDto(model));
  }

  async create(
    workspaceId: string,
    userId: string,
    name: string,
    description?: string,
  ): Promise<SystemModelDto> {
    const workspace = await this.workspaces.getForUser(workspaceId, userId);
    const model = await this.models.save(
      this.models.create({
        workspaceId: workspace.id,
        name: name.trim(),
        description: description?.trim() || null,
        timeUnit: "days",
      }),
    );
    await this.audit.record({
      userId,
      workspaceId,
      modelId: model.id,
      action: "model.created",
      metadata: { name: model.name },
    });
    return this.toModelDto(model);
  }

  async getOwnedModel(modelId: string, userId: string): Promise<SystemModel> {
    const model = await this.models.findOne({
      where: { id: modelId },
      relations: ["workspace"],
    });
    if (!model || model.workspace.ownerId !== userId) {
      throw new NotFoundException("Model not found");
    }
    return model;
  }

  async getGraph(modelId: string, userId: string): Promise<SystemModelGraphDto> {
    const model = await this.getOwnedModel(modelId, userId);
    const [nodes, dependencies] = await Promise.all([
      this.nodes.find({ where: { modelId }, order: { createdAt: "ASC" } }),
      this.dependencies.find({ where: { modelId }, order: { createdAt: "ASC" } }),
    ]);
    return {
      ...this.toModelDto(model),
      nodes: nodes.map((node) => this.toNodeDto(node)),
      dependencies: dependencies.map((dependency) => this.toDependencyDto(dependency)),
    };
  }

  async update(
    modelId: string,
    userId: string,
    patch: { name?: string; description?: string },
  ): Promise<SystemModelDto> {
    const model = await this.getOwnedModel(modelId, userId);
    if (patch.name !== undefined) {
      model.name = patch.name.trim();
    }
    if (patch.description !== undefined) {
      model.description = patch.description.trim() || null;
    }
    const saved = await this.models.save(model);
    await this.audit.record({
      userId,
      workspaceId: saved.workspaceId,
      modelId: saved.id,
      action: "model.updated",
    });
    return this.toModelDto(saved);
  }

  async remove(modelId: string, userId: string): Promise<void> {
    const model = await this.getOwnedModel(modelId, userId);
    await this.models.remove(model);
    await this.audit.record({
      userId,
      workspaceId: model.workspaceId,
      modelId,
      action: "model.deleted",
      metadata: { name: model.name },
    });
  }

  async saveGraph(modelId: string, userId: string, graph: SaveGraphDto): Promise<SystemModelGraphDto> {
    const model = await this.getOwnedModel(modelId, userId);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(ModelDependency, { modelId });
      await manager.delete(ModelNode, { modelId });

      if (graph.nodes.length > 0) {
        await manager.save(
          ModelNode,
          graph.nodes.map((node) =>
            manager.create(ModelNode, {
              id: node.id,
              modelId,
              type: node.type,
              name: node.name.trim(),
              positionX: node.positionX,
              positionY: node.positionY,
              config: node.config as ModelNode["config"],
            }),
          ),
        );
      }

      if (graph.dependencies.length > 0) {
        await manager.insert(
          ModelDependency,
          graph.dependencies.map((dependency) => ({
            id: dependency.id,
            modelId,
            sourceNodeId: dependency.sourceNodeId,
            targetNodeId: dependency.targetNodeId,
            type: dependency.type,
            quantity: dependency.quantity === null || dependency.quantity === undefined
              ? null
              : String(dependency.quantity),
            unit: dependency.unit?.trim() || null,
            leadTimeDays:
              dependency.leadTimeDays === null || dependency.leadTimeDays === undefined
                ? null
                : String(dependency.leadTimeDays),
          })),
        );
      }

      await manager.update(SystemModel, { id: modelId }, { updatedAt: new Date() });
    });

    await this.audit.record({
      userId,
      workspaceId: model.workspaceId,
      modelId,
      action: "graph.saved",
      metadata: {
        nodeCount: graph.nodes.length,
        dependencyCount: graph.dependencies.length,
      },
    });

    return this.getGraph(modelId, userId);
  }

  async validate(modelId: string, userId: string): Promise<GraphValidationResult> {
    const graph = await this.getGraph(modelId, userId);
    return validateModelGraph(graph.nodes, graph.dependencies);
  }

  toModelDto(model: SystemModel): SystemModelDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      name: model.name,
      description: model.description,
      timeUnit: "days",
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }

  toNodeDto(node: ModelNode): ModelNodeDto {
    return {
      id: node.id,
      modelId: node.modelId,
      type: node.type as NodeType,
      name: node.name,
      positionX: node.positionX,
      positionY: node.positionY,
      config: node.config as unknown as NodeConfig,
      createdAt: node.createdAt.toISOString(),
      updatedAt: node.updatedAt.toISOString(),
    };
  }

  toDependencyDto(dependency: ModelDependency): ModelDependencyDto {
    return {
      id: dependency.id,
      modelId: dependency.modelId,
      sourceNodeId: dependency.sourceNodeId,
      targetNodeId: dependency.targetNodeId,
      type: dependency.type as ModelDependencyDto["type"],
      quantity: dependency.quantity === null ? null : Number(dependency.quantity),
      unit: dependency.unit,
      leadTimeDays: dependency.leadTimeDays === null ? null : Number(dependency.leadTimeDays),
      createdAt: dependency.createdAt.toISOString(),
      updatedAt: dependency.updatedAt.toISOString(),
    };
  }
}
