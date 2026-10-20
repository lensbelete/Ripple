import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialModelingSchema1760961600000 implements MigrationInterface {
  name = "InitialModelingSchema1760961600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(320) NOT NULL UNIQUE,
        password_hash varchar(255) NOT NULL,
        name varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE workspaces (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(160) NOT NULL,
        description text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id)`);

    await queryRunner.query(`
      CREATE TABLE system_models (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name varchar(160) NOT NULL,
        description text,
        time_unit varchar(16) NOT NULL DEFAULT 'days',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_system_models_workspace_id ON system_models(workspace_id)`);

    await queryRunner.query(`
      CREATE TABLE model_nodes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id uuid NOT NULL REFERENCES system_models(id) ON DELETE CASCADE,
        type varchar(64) NOT NULL,
        name varchar(160) NOT NULL,
        position_x double precision NOT NULL DEFAULT 0,
        position_y double precision NOT NULL DEFAULT 0,
        config jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_model_nodes_model_id ON model_nodes(model_id)`);

    await queryRunner.query(`
      CREATE TABLE model_dependencies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id uuid NOT NULL REFERENCES system_models(id) ON DELETE CASCADE,
        source_node_id uuid NOT NULL REFERENCES model_nodes(id) ON DELETE CASCADE,
        target_node_id uuid NOT NULL REFERENCES model_nodes(id) ON DELETE CASCADE,
        type varchar(64) NOT NULL,
        quantity numeric(20, 4),
        unit varchar(64),
        lead_time_days numeric(12, 4),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_model_dependencies_endpoints UNIQUE (model_id, source_node_id, target_node_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_model_dependencies_model_id ON model_dependencies(model_id)`);

    await queryRunner.query(`
      CREATE TABLE audit_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        workspace_id uuid,
        model_id uuid,
        action varchar(80) NOT NULL,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_audit_events_user_id ON audit_events(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_audit_events_model_id ON audit_events(model_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS model_dependencies`);
    await queryRunner.query(`DROP TABLE IF EXISTS model_nodes`);
    await queryRunner.query(`DROP TABLE IF EXISTS system_models`);
    await queryRunner.query(`DROP TABLE IF EXISTS workspaces`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
