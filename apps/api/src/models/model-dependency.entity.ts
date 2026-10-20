import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { ModelNode } from "./model-node.entity";
import { SystemModel } from "./system-model.entity";

@Entity({ name: "model_dependencies" })
@Unique("uq_model_dependencies_endpoints", ["modelId", "sourceNodeId", "targetNodeId"])
export class ModelDependency {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "model_id" })
  modelId!: string;

  @ManyToOne(() => SystemModel, (model) => model.dependencies, { onDelete: "CASCADE" })
  @JoinColumn({ name: "model_id" })
  model!: SystemModel;

  @Column({ name: "source_node_id" })
  sourceNodeId!: string;

  @ManyToOne(() => ModelNode, (node) => node.outgoing, { onDelete: "CASCADE" })
  @JoinColumn({ name: "source_node_id" })
  sourceNode!: ModelNode;

  @Column({ name: "target_node_id" })
  targetNodeId!: string;

  @ManyToOne(() => ModelNode, (node) => node.incoming, { onDelete: "CASCADE" })
  @JoinColumn({ name: "target_node_id" })
  targetNode!: ModelNode;

  @Column()
  type!: string;

  @Column({ type: "decimal", precision: 20, scale: 4, nullable: true })
  quantity!: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  unit!: string | null;

  @Column({ name: "lead_time_days", type: "decimal", precision: 12, scale: 4, nullable: true })
  leadTimeDays!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
