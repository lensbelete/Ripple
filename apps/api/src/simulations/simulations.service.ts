import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  EngineSimulationResult,
  SimulationRunDetailDto,
  SimulationRunDto,
  validateModelGraph,
} from "@ripple/shared-types";
import { Repository } from "typeorm";
import { AuditService } from "../audit/audit.service";
import { ModelsService } from "../models/models.service";
import { RunSimulationDto } from "./dto/run-simulation.dto";
import { SimulationEngineClient } from "./simulation-engine.client";
import { SimulationRun } from "./simulation-run.entity";

@Injectable()
export class SimulationsService {
  constructor(
    @InjectRepository(SimulationRun)
    private readonly runs: Repository<SimulationRun>,
    private readonly models: ModelsService,
    private readonly engine: SimulationEngineClient,
    private readonly audit: AuditService,
  ) {}

  async run(modelId: string, userId: string, input: RunSimulationDto): Promise<SimulationRunDetailDto> {
    const graph = await this.models.getGraph(modelId, userId);
    const validation = validateModelGraph(graph.nodes, graph.dependencies);
    if (!validation.valid) {
      throw new BadRequestException(validation.errors.map((issue) => issue.message).join(" "));
    }

    const snapshot = {
      id: graph.id,
      name: graph.name,
      timeUnit: graph.timeUnit,
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        name: node.name,
        positionX: node.positionX,
        positionY: node.positionY,
        config: node.config,
      })),
      dependencies: graph.dependencies.map((dependency) => ({
        id: dependency.id,
        sourceNodeId: dependency.sourceNodeId,
        targetNodeId: dependency.targetNodeId,
        type: dependency.type,
        quantity: dependency.quantity,
        unit: dependency.unit,
        leadTimeDays: dependency.leadTimeDays,
      })),
    };

    const result = await this.engine.simulate({
      model: snapshot,
      modifications: input.modifications,
      horizonDays: input.horizonDays ?? 90,
    });

    const saved = await this.runs.save(
      this.runs.create({
        modelId,
        userId,
        name: input.name?.trim() || defaultRunName(input),
        status: "completed",
        horizonDays: input.horizonDays ?? 90,
        modifications: input.modifications,
        modelSnapshot: snapshot,
        result,
      }),
    );

    await this.audit.record({
      userId,
      workspaceId: graph.workspaceId,
      modelId,
      action: "simulation.completed",
      metadata: { simulationId: saved.id, modifications: input.modifications.length },
    });

    return this.toDetail(saved);
  }

  async listForModel(modelId: string, userId: string): Promise<SimulationRunDto[]> {
    await this.models.getOwnedModel(modelId, userId);
    const rows = await this.runs.find({
      where: { modelId },
      order: { createdAt: "DESC" },
    });
    return rows.map((row) => this.toSummary(row));
  }

  async get(id: string, userId: string): Promise<SimulationRunDetailDto> {
    const run = await this.runs.findOne({ where: { id } });
    if (!run) {
      throw new NotFoundException("Simulation not found");
    }
    await this.models.getOwnedModel(run.modelId, userId);
    return this.toDetail(run);
  }

  private toSummary(run: SimulationRun): SimulationRunDto {
    return {
      id: run.id,
      modelId: run.modelId,
      name: run.name,
      status: "completed",
      horizonDays: run.horizonDays,
      modifications: run.modifications as SimulationRunDto["modifications"],
      result: run.result as EngineSimulationResult,
      createdAt: run.createdAt.toISOString(),
    };
  }

  private toDetail(run: SimulationRun): SimulationRunDetailDto {
    return {
      ...this.toSummary(run),
      modelSnapshot: run.modelSnapshot as SimulationRunDetailDto["modelSnapshot"],
    };
  }
}

function defaultRunName(input: RunSimulationDto): string {
  if (input.modifications.length === 0) {
    return "Baseline run";
  }
  const first = input.modifications[0];
  return `${first.field} = ${first.value}`;
}
