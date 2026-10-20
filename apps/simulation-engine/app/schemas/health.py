from datetime import datetime, timezone

from pydantic import BaseModel, Field


class SimulationHealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    service: str = Field(default="ripple-simulation-engine")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
