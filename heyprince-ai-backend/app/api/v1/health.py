from fastapi import APIRouter
from app.llm.ollama_client import check_ollama_health
from app.core.database import db_pool
from app.core.config import settings
import time

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Comprehensive health check of Python AI service, Local Ollama, Gemini API, and Database.
    """
    start_time = time.time()
    
    # 1. Ollama status
    ollama_ok = await check_ollama_health()
    
    # 2. Database status
    db_ok = False
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.fetchval("SELECT 1;")
                db_ok = True
        except Exception:
            db_ok = False

    return {
        "status": "online",
        "service": "heyprince-ai-backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "ollama": {
            "status": "connected" if ollama_ok else "offline",
            "host": settings.OLLAMA_HOST,
            "default_model": settings.OLLAMA_MODEL
        },
        "gemini": {
            "configured": bool(settings.GEMINI_API_KEY),
            "fallback_model": settings.GEMINI_FALLBACK_MODEL
        },
        "database": {
            "connected": db_ok
        },
        "latency_ms": int((time.time() - start_time) * 1000)
    }

