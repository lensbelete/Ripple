"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiHealthResponse, HealthCheck, HealthCheckName } from "@ripple/shared-types";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHealthUrl } from "@/lib/api";

const labels: Record<HealthCheckName, string> = {
  api: "NestJS API",
  database: "PostgreSQL",
  simulationEngine: "Simulation engine",
};

function statusClasses(status: HealthCheck["status"]) {
  return status === "up"
    ? "border-ok/30 bg-ok/10 text-ok"
    : "border-danger/30 bg-danger/10 text-danger";
}

export function StatusPanel() {
  const [health, setHealth] = useState<ApiHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getHealthUrl(), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Health endpoint returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ApiHealthResponse;
      setHealth(payload);
    } catch (caught) {
      setHealth(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to reach the Ripple API. Confirm the API is running on the configured URL.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  return (
    <div className="mt-10 border border-line bg-paper-raised">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm text-ink-muted">Live report from /api/v1/health</p>
          <p className="mt-1 font-medium">
            {health
              ? health.status === "ok"
                ? "All checked services are reachable"
                : "The API is up, but a dependency is unavailable"
              : "Waiting for the API"}
          </p>
        </div>
        <Button variant="secondary" onClick={() => void loadHealth()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Checking" : "Recheck"}
        </Button>
      </div>

      {error ? (
        <div className="px-5 py-6 text-sm text-danger">
          {error}. Expected API URL: {getHealthUrl()}
        </div>
      ) : null}

      {health ? (
        <div>
          <dl className="grid gap-px bg-line sm:grid-cols-3">
            {(Object.keys(labels) as HealthCheckName[]).map((name) => {
              const check = health.checks[name];
              return (
                <div key={name} className="bg-paper-raised px-5 py-5">
                  <dt className="text-sm text-ink-muted">{labels[name]}</dt>
                  <dd className="mt-3 flex items-center justify-between gap-3">
                    <span
                      className={`border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${statusClasses(check.status)}`}
                    >
                      {check.status}
                    </span>
                    {typeof check.latencyMs === "number" ? (
                      <span className="text-sm text-ink-muted">{check.latencyMs} ms</span>
                    ) : null}
                  </dd>
                  {check.detail ? (
                    <p className="mt-3 text-sm text-ink-muted">{check.detail}</p>
                  ) : null}
                </div>
              );
            })}
          </dl>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">
            Last response at {new Date(health.timestamp).toLocaleString()}
          </p>
        </div>
      ) : null}
    </div>
  );
}
