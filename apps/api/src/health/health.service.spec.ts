import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration";
import { HealthService } from "./health.service";

describe("HealthService", () => {
  const dataSource = {
    isInitialized: true,
    query: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === "simulationEngineUrl") {
        return "http://simulation.test";
      }
      if (key === "healthTimeoutMs") {
        return 500;
      }
      return undefined;
    }),
  };

  let service: HealthService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockImplementation((key: string) => {
      if (key === "simulationEngineUrl") {
        return "http://simulation.test";
      }
      if (key === "healthTimeoutMs") {
        return 500;
      }
      return undefined;
    });
    dataSource.isInitialized = true;
    dataSource.query.mockResolvedValue([{ "?column?": 1 }]);
    service = new HealthService(
      dataSource as never,
      config as unknown as ConfigService<AppConfig, true>,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("reports ok when the database and simulation engine are reachable", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        service: "ripple-simulation-engine",
        timestamp: "2026-10-20T00:00:00.000Z",
      }),
    }) as typeof fetch;

    const result = await service.getHealth();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("ripple-api");
    expect(result.checks.api.status).toBe("up");
    expect(result.checks.database.status).toBe("up");
    expect(result.checks.simulationEngine.status).toBe("up");
    expect(dataSource.query).toHaveBeenCalledWith("SELECT 1");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://simulation.test/health",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reports degraded when PostgreSQL cannot be queried", async () => {
    dataSource.query.mockRejectedValue(new Error("connection refused"));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    }) as typeof fetch;

    const result = await service.getHealth();

    expect(result.status).toBe("degraded");
    expect(result.checks.database.status).toBe("down");
    expect(result.checks.simulationEngine.status).toBe("up");
    expect(result.checks.database.detail).toBe("Unable to query PostgreSQL");
  });

  it("reports degraded when the simulation engine is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("fetch failed")) as typeof fetch;

    const result = await service.getHealth();

    expect(result.status).toBe("degraded");
    expect(result.checks.database.status).toBe("up");
    expect(result.checks.simulationEngine.status).toBe("down");
    expect(result.checks.simulationEngine.detail).toBe("Simulation engine is unreachable");
  });
});
