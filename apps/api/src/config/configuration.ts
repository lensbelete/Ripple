export interface AppConfig {
  nodeEnv: string;
  apiHost: string;
  apiPort: number;
  corsOrigin: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  simulationEngineUrl: string;
  healthTimeoutMs: number;
}

export function configuration(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    apiHost: process.env.API_HOST ?? "0.0.0.0",
    apiPort: Number(process.env.API_PORT ?? 3001),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    database: {
      host: process.env.DATABASE_HOST ?? "localhost",
      port: Number(process.env.DATABASE_PORT ?? 5432),
      user: process.env.DATABASE_USER ?? "ripple",
      password: process.env.DATABASE_PASSWORD ?? "ripple",
      name: process.env.DATABASE_NAME ?? "ripple",
    },
    simulationEngineUrl: process.env.SIMULATION_ENGINE_URL ?? "http://localhost:8000",
    healthTimeoutMs: Number(process.env.HEALTH_TIMEOUT_MS ?? 2000),
  };
}
