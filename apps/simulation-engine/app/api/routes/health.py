from fastapi import APIRouter

from app.schemas.health import SimulationHealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=SimulationHealthResponse)
def get_health() -> SimulationHealthResponse:
    return SimulationHealthResponse(status="ok")
