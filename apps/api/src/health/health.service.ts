import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import {
  ApiHealthResponse,
  HealthCheck,
  SimulationHealthResponse,
} from "@ripple/shared-types";
import { DataSource } from "typeorm";
import { AppConfig } from "../config/configuration";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getHealth(): Promise<ApiHealthResponse> {
    const [database, simulationEngine] = await Promise.all([
      this.checkDatabase(),
      this.checkSimulationEngine(),
    ]);

    const checks = {
      api: { status: "up" as const },
      database,
      simulationEngine,
    };

    const dependenciesUp = database.status === "up" && simulationEngine.status === "up";

    return {
      status: dependenciesUp ? "ok" : "degraded",
      service: "ripple-api",
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  async checkDatabase(): Promise<HealthCheck> {
    const startedAt = Date.now();

    try {
      if (!this.dataSource.isInitialized) {
        return {
          status: "down",
          latencyMs: Date.now() - startedAt,
          detail: "Database connection has not been initialized",
        };
      }

      await this.dataSource.query("SELECT 1");
      return { status: "up", latencyMs: Date.now() - startedAt };
    } catch (error) {
      this.logger.warn(`Database health check failed: ${this.errorMessage(error)}`);
      return {
        status: "down",
        latencyMs: Date.now() - startedAt,
        detail: "Unable to query PostgreSQL",
      };
    }
  }

  async checkSimulationEngine(): Promise<HealthCheck> {
    const startedAt = Date.now();
    const baseUrl = this.config.get("simulationEngineUrl", { infer: true });
    const timeoutMs = this.config.get("healthTimeoutMs", { infer: true });

    try {
      const response = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        return {
          status: "down",
          latencyMs: Date.now() - startedAt,
          detail: `Simulation engine returned HTTP ${response.status}`,
        };
      }

      const payload = (await response.json()) as SimulationHealthResponse;
      if (payload.status !== "ok") {
        return {
          status: "down",
          latencyMs: Date.now() - startedAt,
          detail: "Simulation engine reported an unhealthy status",
        };
      }

      return { status: "up", latencyMs: Date.now() - startedAt };
    } catch (error) {
      this.logger.warn(`Simulation health check failed: ${this.errorMessage(error)}`);
      return {
        status: "down",
        latencyMs: Date.now() - startedAt,
        detail: "Simulation engine is unreachable",
      };
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
  }
}
