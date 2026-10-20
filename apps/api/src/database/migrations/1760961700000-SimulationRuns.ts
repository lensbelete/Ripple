import { MigrationInterface, QueryRunner } from "typeorm";

export class SimulationRuns1760961700000 implements MigrationInterface {
  name = "SimulationRuns1760961700000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE simulation_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id uuid NOT NULL REFERENCES system_models(id) ON DELETE CASCADE,
        user_id uuid NOT NULL,
        name varchar(160) NOT NULL,
        status varchar(32) NOT NULL,
        horizon_days integer NOT NULL,
        modifications jsonb NOT NULL,
        model_snapshot jsonb NOT NULL,
        result jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_simulation_runs_model_id ON simulation_runs(model_id)`);
    await queryRunner.query(`CREATE INDEX idx_simulation_runs_user_id ON simulation_runs(user_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS simulation_runs`);
  }
}
