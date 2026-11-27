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
    AI_SERVICE_SECRET: str = ""
    ALLOWED_ORIGINS: List[str] = ["https://heyprince.in", "http://localhost:3000"]
    CORS_ORIGINS: List[str] = ["https://heyprince.in", "http://localhost:3000"]
    
    # Database
    DATABASE_URI: str = ""
    
    # Ollama on Local PC
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_HOST: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "llama3.3:70b"
    OLLAMA_TIMEOUT_SECONDS: int = 25
    
    # Multi-Provider AI Credentials & Models
    # Preferred order: 1. Gemini primary, 2. Gemini backup, 3. OpenAI fallback
    GEMINI_API_KEY_1: Optional[str] = None
    GEMINI_API_KEY_2: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None  # Legacy alias
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_FALLBACK_MODEL: str = "gemini-2.5-flash"
    GEMINI_PROJECT_ID_1: Optional[str] = None
    GEMINI_PROJECT_ID_2: Optional[str] = None

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    # Cloudflare R2 Object Storage
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: Optional[str] = None
    R2_S3_ENDPOINT: Optional[str] = None
    R2_PUBLIC_BASE_URL: Optional[str] = None
    
    # Image Generation
    POLLINATIONS_BASE_URL: str = "https://image.pollinations.ai/prompt"
    
    # Background Scheduler
    ENABLE_SCHEDULER: bool = False
    ENABLE_AUTONOMOUS_CRON: bool = False
    DAILY_NEWS_CRON: str = "30 3 * * *"
    CHIEF_OF_STAFF_CRON: str = "0 4 * * *"
    LEAD_SCOUT_CRON: str = "0 5 * * *"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_value(cls, v: Any) -> bool:
        if isinstance(v, str):
            return v.strip().lower() in ("true", "1", "yes", "debug")
        return bool(v)

    def get_gemini_primary_key(self) -> Optional[str]:
        return self.GEMINI_API_KEY_1 or self.GEMINI_API_KEY

    def get_gemini_backup_key(self) -> Optional[str]:
        return self.GEMINI_API_KEY_2

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

settings = Settings()
