import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "audit_events" })
export class AuditEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "user_id" })
  userId!: string;

  @Column({ name: "workspace_id", type: "uuid", nullable: true })
  workspaceId!: string | null;

  @Column({ name: "model_id", type: "uuid", nullable: true })
  modelId!: string | null;

  @Column()
  action!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
