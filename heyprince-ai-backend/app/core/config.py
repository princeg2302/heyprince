import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, List, Any

class Settings(BaseSettings):
    ENVIRONMENT: str = "production"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Security
    AI_SERVICE_SECRET: str = "default_dev_secret_replace_in_production_32chars"
    ALLOWED_ORIGINS: List[str] = ["https://heyprince.in", "http://localhost:3000"]
    CORS_ORIGINS: List[str] = ["https://heyprince.in", "http://localhost:3000"]
    
    # Database
    DATABASE_URI: str = ""
    
    # Ollama on Local PC
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_HOST: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "llama3.3:70b"
    OLLAMA_TIMEOUT_SECONDS: int = 25
    
    # Gemini Cloud Fallback
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GEMINI_FALLBACK_MODEL: str = "gemini-3.5-flash"
    
    # Image Generation
    POLLINATIONS_BASE_URL: str = "https://image.pollinations.ai/prompt"
    
    # Background Scheduler
    ENABLE_SCHEDULER: bool = True
    ENABLE_AUTONOMOUS_CRON: bool = True
    DAILY_NEWS_CRON: str = "30 3 * * *"
    CHIEF_OF_STAFF_CRON: str = "0 4 * * *"
    LEAD_SCOUT_CRON: str = "0 5 * * *"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_value(cls, v: Any) -> bool:
        if isinstance(v, str):
            return v.strip().lower() in ("true", "1", "yes", "debug")
        return bool(v)

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

settings = Settings()
