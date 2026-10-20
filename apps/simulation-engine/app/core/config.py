from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    simulation_host: str = "0.0.0.0"
    simulation_port: int = 8000


settings = Settings()
