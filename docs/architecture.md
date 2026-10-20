# Architecture

Ripple is split so that user interface, application rules, persistence, and simulation stay in separate services.

## Request flow

```
Next.js frontend
       |
       v
NestJS REST API
       |
       +------> PostgreSQL
       |
       v
Python simulation service
       |
       v
Simulation results returned to NestJS
       |
       v
Next.js displays results
```

The frontend never connects to PostgreSQL. It also never calls the Python service directly. NestJS is the only public application API.

## Services

| Service | Role | Default port |
| --- | --- | --- |
| `apps/web` | Next.js App Router UI | 3000 |
| `apps/api` | NestJS REST API, validation, persistence | 3001 |
| `apps/simulation-engine` | FastAPI simulation calculations | 8000 |
| `postgres` | Authoritative application data | 5432 |
| `packages/shared-types` | Shared TypeScript contracts | — |

## Health checks

`GET /api/v1/health` reports the API process, a PostgreSQL `SELECT 1` probe, and the simulation engine `/health` endpoint. The overall status is:

- `ok` when every check is up
- `degraded` when the API is up but a dependency is down
- `error` only if the API itself cannot serve the request

## Configuration

All services read environment variables. `.env.example` lists the local development values. NestJS and FastAPI validate required settings at startup.

## Data and simulation

PostgreSQL is the source of truth for users, workspaces, models, scenarios, and stored results. The simulation engine is stateless: NestJS sends a model snapshot and receives a structured result. Later model edits must not change a completed run.

## Out of scope for the foundation

Authentication, graph editing, scenario analysis, and the simulation algorithms are built on this service layout rather than inside the Next.js app.
