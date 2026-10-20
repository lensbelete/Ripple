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
import { SystemModel } from "../models/system-model.entity";
import { User } from "../users/user.entity";

@Entity({ name: "workspaces" })
export class Workspace {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "owner_id" })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.workspaces, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => SystemModel, (model) => model.workspace)
  models!: SystemModel[];
}
