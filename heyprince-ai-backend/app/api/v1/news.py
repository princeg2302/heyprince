import logging
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.security import verify_internal_auth
from app.pipeline.content_generator import generate_daily_post
from app.pipeline.image_generator import generate_cover_image
from app.core.database import db_pool

logger = logging.getLogger(__name__)
router = APIRouter()


class NewsGenerateRequest(BaseModel):
    title: str = Field(min_length=8, max_length=240)
    category: Optional[str] = "Artificial Intelligence"
    source_url: Optional[str] = ""
    source_summary: Optional[str] = ""
    trigger_type: Optional[str] = "manual"
    save_draft: bool = True


@router.post("/generate")
async def generate_news_article(
    req: NewsGenerateRequest,
    auth_data: Dict[str, Any] = Depends(verify_internal_auth),
):
    """Generate an article and a topic-specific cover; never return placeholder media."""
    logger.info("[API:News] Generating article for %r", req.title)
    article = await generate_daily_post(
        [{"title": req.title, "source": req.source_url or "Provided research", "summary": req.source_summary or ""}],
        custom_topic=req.title,
    )
    if not article.get("title") or not article.get("sections"):
        raise HTTPException(status_code=502, detail="Content provider returned an incomplete article")

    image = await generate_cover_image(
        title=article["title"],
        category=article.get("categoryName") or req.category or "Technology",
        excerpt=article.get("excerpt"),
        article_id=str(article.get("slug") or req.title),
    )
    cover_url = image.get("url")
    if not cover_url or not str(cover_url).startswith(("https://", "http://")):
        raise HTTPException(status_code=502, detail="No valid generated cover image; placeholder fallback is disabled")

    article["coverImage"] = cover_url
    run_id = None
    if req.save_draft:
        if not db_pool:
            raise HTTPException(status_code=503, detail="Database is unavailable; draft was not persisted")
        try:
            import json
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    INSERT INTO daily_news_runs
                    (topic_title, category, raw_content, status, cover_image, trigger_type, created_at, updated_at)
                    VALUES ($1, $2, $3, 'draft', $4, $5, NOW(), NOW())
                    RETURNING id
                    """,
                    article["title"],
                    article.get("categoryName") or req.category,
                    json.dumps(article),
                    cover_url,
                    req.trigger_type or "manual",
                )
                run_id = row["id"] if row else None
            if run_id is None:
                raise RuntimeError("Draft insert returned no id")
        except Exception as exc:
            logger.exception("[API:News] Draft persistence failed")
            raise HTTPException(status_code=503, detail="Article generated but draft persistence failed") from exc

    return {
        "success": True,
        "run_id": run_id,
        "article": article,
        "cover_image": cover_url,
        "image_content_hash": image.get("content_hash"),
        "meta": {
            "title": article["title"],
            "category": article.get("categoryName") or req.category,
            "model_used": article.get("model_used"),
            "provider": article.get("provider"),
        },
    }


@router.post("/preview")
async def preview_news_article(
    req: NewsGenerateRequest,
    auth_data: Dict[str, Any] = Depends(verify_internal_auth),
):
    req.save_draft = False
    return await generate_news_article(req, auth_data)
