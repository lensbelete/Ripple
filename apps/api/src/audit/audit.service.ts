import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditEvent } from "./audit-event.entity";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly events: Repository<AuditEvent>,
  ) {}

  record(input: {
    userId: string;
    action: string;
    workspaceId?: string | null;
    modelId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    const event = this.events.create({
      userId: input.userId,
      action: input.action,
      workspaceId: input.workspaceId ?? null,
      modelId: input.modelId ?? null,
      metadata: input.metadata ?? null,
    });
    return this.events.save(event);
  }
}
