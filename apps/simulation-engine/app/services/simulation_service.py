from app.algorithms.simulate import simulate
from app.schemas.simulation import SimulateRequest, SimulateResponse


def run_simulation(request: SimulateRequest) -> SimulateResponse:
    return simulate(request)
