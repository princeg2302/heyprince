from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.database import db_pool

router = APIRouter()


@router.get("/health")
async def health_check():
    """Return a minimal readiness response without exposing internal configuration."""
    database_connected = False

    if db_pool:
        try:
            async with db_pool.acquire() as connection:
                await connection.fetchval("SELECT 1;")
                database_connected = True
        except Exception:
            database_connected = False

    payload = {
        "status": "ok" if database_connected else "degraded",
        "service": "heyprince-ai-backend",
        "database": "connected" if database_connected else "unavailable",
    }
    return JSONResponse(
        content=payload,
        status_code=200 if database_connected else 503,
    )
