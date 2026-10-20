from fastapi import APIRouter, HTTPException

from app.core.exceptions import SimulationError
from app.schemas.simulation import SimulateRequest, SimulateResponse
from app.services.simulation_service import run_simulation

router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulateResponse)
def post_simulate(request: SimulateRequest) -> SimulateResponse:
    try:
        return run_simulation(request)
    except SimulationError as error:
        raise HTTPException(status_code=400, detail={"code": error.code, "message": error.message}) from error
