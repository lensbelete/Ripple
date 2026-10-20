import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SystemModel } from "../models/system-model.entity";

@Entity({ name: "simulation_runs" })
export class SimulationRun {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "model_id" })
  modelId!: string;

  @ManyToOne(() => SystemModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "model_id" })
  model!: SystemModel;

  @Index()
  @Column({ name: "user_id" })
  userId!: string;

  @Column()
  name!: string;

  @Column()
  status!: "completed";

  @Column({ name: "horizon_days", type: "int" })
  horizonDays!: number;

  @Column({ type: "jsonb" })
  modifications!: unknown;

  @Column({ name: "model_snapshot", type: "jsonb" })
  modelSnapshot!: unknown;

  @Column({ type: "jsonb" })
  result!: unknown;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
