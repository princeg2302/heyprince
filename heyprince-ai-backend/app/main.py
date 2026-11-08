import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db_pool, close_db_pool
from app.scheduler.jobs import start_scheduler, shutdown_scheduler
from app.api.v1.health import router as health_router
from app.api.v1.news import router as news_router
from app.api.v1.chief import router as chief_router
from app.api.v1.outreach import router as outreach_router
from app.api.v1.company import router as company_router

# Configure root logger
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("heyprince-ai-backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing HeyPrince Python AI Backend...")
    await init_db_pool()
    start_scheduler()
    yield
    logger.info("Shutting down HeyPrince Python AI Backend...")
    shutdown_scheduler()
    await close_db_pool()

app = FastAPI(
    title="HeyPrince AI Dedicated Backend",
    description="Python FastAPI service handling Ollama PC inference, Gemini cloud fallback, autonomous agents, and AI content synthesis.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware allowing secure communication with Next.js frontend/backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(news_router, prefix="/api/v1/news", tags=["Daily AI News"])
app.include_router(chief_router, prefix="/api/v1/chief", tags=["Chief of Staff"])
app.include_router(outreach_router, prefix="/api/v1/outreach", tags=["Lead Intelligence"])
app.include_router(company_router, prefix="/api/v1/company", tags=["AI Company & Workforce"])

@app.get("/")
async def root():
    return {
        "service": "HeyPrince AI Dedicated Backend",
        "status": "operational",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

