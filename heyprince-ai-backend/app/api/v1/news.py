import logging
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.core.security import verify_internal_auth
from app.pipeline.content_generator import generate_deep_seo_article
from app.pipeline.image_generator import generate_cover_image
from app.core.database import db_pool

logger = logging.getLogger(__name__)
router = APIRouter()

class NewsGenerateRequest(BaseModel):
    title: str
    category: Optional[str] = "Artificial Intelligence"
    source_url: Optional[str] = ""
    trigger_type: Optional[str] = "manual"
    save_draft: Optional[bool] = True

@router.post("/generate")
async def generate_news_article(
    req: NewsGenerateRequest,
    auth_data: Dict[str, Any] = Depends(verify_internal_auth)
):
    """
    Orchestrates the 1,500+ word SEO article generation pipeline, Pollinations AI visual generation,
    and saves to daily_news_runs / chief_content_drafts in Supabase.
    """
    logger.info(f"[API:News] Received generation request for '{req.title}' (trigger={req.trigger_type})")
    
    # 1. Run LLM deep content generator (Ollama -> Gemini fallback)
    article_res = await generate_deep_seo_article(
        topic_title=req.title,
        category=req.category or "Artificial Intelligence",
        source_url=req.source_url or ""
    )
    
    # 2. Run visual synthesizer
    image_res = await generate_cover_image(
        title=req.title,
        category=req.category or "Artificial Intelligence"
    )
    
    cover_image_url = image_res.get("url", "/assets/blog/photo1.webp")
    
    # 3. If requested and DB connected, save to daily_news_runs
    run_id = None
    if req.save_draft and db_pool:
        try:
            import json
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    INSERT INTO daily_news_runs (
                        topic_title, category, raw_content, status, cover_image, 
                        trigger_type, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, 'draft', $4, $5, NOW(), NOW())
                    RETURNING id;
                    """,
                    req.title,
                    req.category,
                    json.dumps(article_res),
                    cover_image_url,
                    req.trigger_type
                )
                if row:
                    run_id = row["id"]
                    logger.info(f"[API:News] Successfully persisted draft to daily_news_runs id={run_id}")
        except Exception as e:
            logger.warning(f"[API:News] DB draft persistence error: {e}")

    return {
        "success": True,
        "run_id": run_id,
        "article": article_res,
        "cover_image": cover_image_url,
        "meta": {
            "title": req.title,
            "category": req.category,
            "model_used": article_res.get("model_used"),
            "provider": article_res.get("provider")
        }
    }

@router.post("/preview")
async def preview_news_article(
    req: NewsGenerateRequest,
    auth_data: Dict[str, Any] = Depends(verify_internal_auth)
):
    """
    Generates preview content without persisting to the database.
    """
    req.save_draft = False
    return await generate_news_article(req, auth_data)

