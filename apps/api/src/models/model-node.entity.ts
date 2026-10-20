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
import { ModelDependency } from "./model-dependency.entity";
import { SystemModel } from "./system-model.entity";

@Entity({ name: "model_nodes" })
export class ModelNode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "model_id" })
  modelId!: string;

  @ManyToOne(() => SystemModel, (model) => model.nodes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "model_id" })
  model!: SystemModel;

  @Column()
  type!: string;

  @Column()
  name!: string;

  @Column({ name: "position_x", type: "double precision" })
  positionX!: number;

  @Column({ name: "position_y", type: "double precision" })
  positionY!: number;

  @Column({ type: "jsonb" })
  config!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => ModelDependency, (dependency) => dependency.sourceNode)
  outgoing!: ModelDependency[];

  @OneToMany(() => ModelDependency, (dependency) => dependency.targetNode)
  incoming!: ModelDependency[];
}
