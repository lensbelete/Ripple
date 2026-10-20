# Ripple

Understand the impact before it happens.

Ripple is an interactive decision intelligence platform. It models an operational system as a dependency graph, applies a change, and calculates how that disruption propagates through connected components.

This repository is a TypeScript monorepo with a Next.js client, a NestJS API, a Python simulation service, and PostgreSQL.

## Architecture

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
```

The browser talks only to the NestJS API. The API owns persistence and business rules. The Python service performs simulation calculations. See [docs/architecture.md](docs/architecture.md) for details.

## Requirements

- Node.js 20 or later
- [pnpm](https://pnpm.io/) 10
- Python 3.12
- Docker and Docker Compose

## Local setup

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

3. Install JavaScript dependencies and build shared types:

   ```bash
   pnpm install
   pnpm build:types
   ```

4. Install the simulation service:

   ```bash
   python3 -m venv apps/simulation-engine/.venv
   source apps/simulation-engine/.venv/bin/activate
   pip install -r apps/simulation-engine/requirements.txt -r apps/simulation-engine/requirements-dev.txt
   ```

5. Apply migrations and load the labeled sample model:

   ```bash
   pnpm seed
   ```

   Sample login: `demo@ripple.local` / `demo-ripple-2026`

6. Start the simulation engine, API, and web app in separate terminals:

   ```bash
   source apps/simulation-engine/.venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --app-dir apps/simulation-engine
   ```

   ```bash
   pnpm dev:api
   ```

   ```bash
   pnpm dev:web
   ```

7. Open:

   - Web: [http://localhost:3000](http://localhost:3000)
   - Workspaces: [http://localhost:3000/workspaces](http://localhost:3000/workspaces)
   - API health: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)
   - API docs: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
   - Simulation health: [http://localhost:8000/health](http://localhost:8000/health)

## Run everything with Docker

```bash
cp .env.example .env
docker compose up --build
```

This starts PostgreSQL, the simulation engine, the API, and the web app.

## Tests

```bash
pnpm --filter @ripple/api test
cd apps/simulation-engine && python3 -m pytest
```

```bash
pnpm typecheck
pnpm lint
```

## Current scope

Users can register, create workspaces, build a typed dependency graph, save it, reload it, and validate it. Cycles and invalid node configuration are rejected with explanations.

A saved model can be simulated: the engine compares a baseline against a scenario modification, then stores the snapshot and the calculated delays, shortages, and causal paths.

Scenario comparison across multiple named alternatives, and intervention optimization, are not implemented yet.

Set `JWT_SECRET` in `.env` to a long random string before starting the API.

## Troubleshooting

**API reports the database as down.** Confirm PostgreSQL is healthy (`docker compose ps`) and that `DATABASE_HOST` matches how you are running the API (`localhost` on the host, `postgres` inside Compose).

**API reports the simulation engine as down.** Start the Python service first, or confirm `SIMULATION_ENGINE_URL` (`http://localhost:8000` on the host, `http://simulation-engine:8000` inside Compose).

**Web cannot reach the API.** The Next.js app proxies `/api/v1` to the NestJS origin. Confirm the API is running and `JWT_SECRET` is set.

**Port already in use.** Change `API_PORT`, `WEB_PORT`, `SIMULATION_PORT`, or `DATABASE_PORT` in `.env`. If another PostgreSQL instance already owns 5432, set `DATABASE_PORT=5433` and restart Compose. The API container still talks to PostgreSQL on the internal port 5432.
