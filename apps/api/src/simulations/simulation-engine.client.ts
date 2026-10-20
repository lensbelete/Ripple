import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EngineSimulationResult } from "@ripple/shared-types";
import { AppConfig } from "../config/configuration";

@Injectable()
export class SimulationEngineClient {
  private readonly logger = new Logger(SimulationEngineClient.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async simulate(payload: unknown): Promise<EngineSimulationResult> {
    const baseUrl = this.config.get("simulationEngineUrl", { infer: true });
    const timeoutMs = this.config.get("simulationTimeoutMs", { infer: true });

    try {
      const response = await fetch(`${baseUrl}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });

      const body = (await response.json().catch(() => null)) as
        | EngineSimulationResult
        | { detail?: { message?: string } | string }
        | null;

      if (response.status === 400) {
        const detail = body && "detail" in body ? body.detail : undefined;
        const message =
          typeof detail === "string"
            ? detail
            : detail && typeof detail === "object" && "message" in detail
              ? String(detail.message)
              : "The simulation engine rejected this model.";
        throw new BadRequestException(message);
      }

      if (!response.ok || !body || !("status" in body)) {
        throw new ServiceUnavailableException("The simulation engine could not complete the calculation.");
      }

      return body;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.warn(`Simulation engine request failed: ${error instanceof Error ? error.message : "unknown error"}`);
      throw new ServiceUnavailableException("The simulation engine is unreachable.");
    }
  }
}
