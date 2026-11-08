import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    ENVIRONMENT: str = "production"
    PORT: int = 8000
    DEBUG: bool = False
    
    # Security
    AI_SERVICE_SECRET: str = "default_dev_secret_replace_in_production_32chars"
    ALLOWED_ORIGINS: list[str] = ["https://heyprince.in", "http://localhost:3000"]
    
    # Database
    DATABASE_URI: str = ""
    
    # Ollama on Local PC
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "llama3.3:70b"
    OLLAMA_TIMEOUT_SECONDS: int = 25
    
    # Gemini Cloud Fallback
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Image Generation
    POLLINATIONS_BASE_URL: str = "https://image.pollinations.ai/prompt"
    
    # Background Scheduler
    ENABLE_SCHEDULER: bool = True
    DAILY_NEWS_CRON: str = "30 3 * * *"
    CHIEF_OF_STAFF_CRON: str = "0 4 * * *"
    LEAD_SCOUT_CRON: str = "0 5 * * *"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

