from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.simulate import router as simulate_router
from app.core.config import settings

app = FastAPI(
    title="Ripple Simulation Engine",
    description="Deterministic simulation and optimization calculations for Ripple.",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(simulate_router)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "service": "ripple-simulation-engine",
        "docs": "/docs",
        "health": "/health",
        "host": settings.simulation_host,
    }
