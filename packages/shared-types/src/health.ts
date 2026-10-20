export type ServiceStatus = "up" | "down";
export type OverallStatus = "ok" | "degraded" | "error";
export type HealthCheckName = "api" | "database" | "simulationEngine";

export interface HealthCheck {
  status: ServiceStatus;
  latencyMs?: number;
  detail?: string;
}

export interface ApiHealthResponse {
  status: OverallStatus;
  service: "ripple-api";
  timestamp: string;
  checks: Record<HealthCheckName, HealthCheck>;
}

export interface SimulationHealthResponse {
  status: OverallStatus;
  service: "ripple-simulation-engine";
  timestamp: string;
}
