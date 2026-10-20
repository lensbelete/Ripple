import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Workspace } from "../workspaces/workspace.entity";
import { ModelDependency } from "./model-dependency.entity";
import { ModelNode } from "./model-node.entity";

@Entity({ name: "system_models" })
export class SystemModel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "workspace_id" })
  workspaceId!: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.models, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace!: Workspace;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "time_unit", default: "days" })
  timeUnit!: "days";

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => ModelNode, (node) => node.model)
  nodes!: ModelNode[];

  @OneToMany(() => ModelDependency, (dependency) => dependency.model)
  dependencies!: ModelDependency[];
}
