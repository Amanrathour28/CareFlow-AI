import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CareFlow AI"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "dev_secret_key_placeholder_must_be_changed_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/careflow_ai"

    # AI Layer
    GROQ_API_KEY: str | None = None

    # CORS — set this to your Vercel deployment URL in production
    # e.g. https://careflow-ai.vercel.app
    FRONTEND_URL: str | None = None

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
