import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WorkspaceDto } from "@ripple/shared-types";
import { Repository } from "typeorm";
import { AuditService } from "../audit/audit.service";
import { Workspace } from "./workspace.entity";

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaces: Repository<Workspace>,
    private readonly audit: AuditService,
  ) {}

  async listForUser(userId: string): Promise<WorkspaceDto[]> {
    const rows = await this.workspaces.find({
      where: { ownerId: userId },
      order: { updatedAt: "DESC" },
    });
    return rows.map((workspace) => this.toDto(workspace));
  }

  async getForUser(id: string, userId: string): Promise<Workspace> {
    const workspace = await this.workspaces.findOne({ where: { id, ownerId: userId } });
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }
    return workspace;
  }

  async create(userId: string, name: string, description?: string): Promise<WorkspaceDto> {
    const workspace = await this.workspaces.save(
      this.workspaces.create({
        ownerId: userId,
        name: name.trim(),
        description: description?.trim() || null,
      }),
    );
    await this.audit.record({
      userId,
      workspaceId: workspace.id,
      action: "workspace.created",
      metadata: { name: workspace.name },
    });
    return this.toDto(workspace);
  }

  async update(id: string, userId: string, patch: { name?: string; description?: string }): Promise<WorkspaceDto> {
    const workspace = await this.getForUser(id, userId);
    if (patch.name !== undefined) {
      workspace.name = patch.name.trim();
    }
    if (patch.description !== undefined) {
      workspace.description = patch.description.trim() || null;
    }
    const saved = await this.workspaces.save(workspace);
    await this.audit.record({
      userId,
      workspaceId: saved.id,
      action: "workspace.updated",
    });
    return this.toDto(saved);
  }

  async remove(id: string, userId: string): Promise<void> {
    const workspace = await this.getForUser(id, userId);
    await this.workspaces.remove(workspace);
    await this.audit.record({
      userId,
      workspaceId: id,
      action: "workspace.deleted",
      metadata: { name: workspace.name },
    });
  }

  toDto(workspace: Workspace): WorkspaceDto {
    return {
      id: workspace.id,
      ownerId: workspace.ownerId,
      name: workspace.name,
      description: workspace.description,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }
}
