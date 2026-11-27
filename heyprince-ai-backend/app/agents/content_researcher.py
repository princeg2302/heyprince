import json
import logging
import uuid
from typing import Any, Dict, Optional

from app.agents.base import BaseAgent
from app.core.database import db
from app.pipeline.content_generator import generate_daily_post
from app.pipeline.image_generator import generate_cover_image

logger = logging.getLogger(__name__)


class ContentResearcherAgent(BaseAgent):
    def __init__(self):
        super().__init__("content_researcher", "Content & Market Intelligence Agent")

    async def execute(
        self,
        trigger: str = "manual",
        payload: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        payload = payload or {}
        content_type = payload.get("contentType", "service_page")
        custom_topic = payload.get("customTopic")

        logger.info(
            "[ContentResearcher] Executing for contentType=%s trigger=%s",
            content_type,
            trigger,
        )

        if content_type == "service_page":
            service_proposals = [
                {
                    "title": "Headless Shopify & Next.js Storefront Engineering",
                    "tagline": "Accelerate eCommerce conversion rates with sub-300ms mobile product and collection page speeds.",
                    "category": "Headless eCommerce",
                    "slug": "headless-shopify-nextjs",
                    "deliverables": [
                        "Next.js 15 App Router Frontend",
                        "Storefront API GraphQL Cache Bridge",
                        "100% Core Web Vitals Assurance",
                    ],
                },
                {
                    "title": "Enterprise AI Agent & LLM Workflow Automation",
                    "tagline": "Custom sovereign AI pipelines, private RAG architectures, and autonomous agent systems deployed on private VPS.",
                    "category": "AI Systems & Automation",
                    "slug": "enterprise-ai-agent-automation",
                    "deliverables": [
                        "Local Ollama & Cloud Model Router",
                        "Enterprise Tool Selection & Memory Store",
                        "Strict Data Isolation Guarantee",
                    ],
                },
            ]

            selected = service_proposals[0]
            draft_id = f"draft_{int(uuid.uuid4().int % 100000000)}"

            try:
                await db.execute(
                    """
                    INSERT INTO chief_content_drafts
                    (id, agent_id, draft_type, title, excerpt, content, metadata, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_approval', NOW(), NOW());
                    """,
                    draft_id,
                    self.agent_id,
                    "service_page",
                    f"Service Proposal: {selected['title']}",
                    selected["tagline"],
                    json.dumps(selected),
                    json.dumps(selected),
                )
                logger.info(
                    "[ContentResearcher] Persisted service proposal draft %s",
                    draft_id,
                )
            except Exception:
                logger.exception(
                    "[ContentResearcher] Could not persist service proposal draft %s",
                    draft_id,
                )
                return {
                    "success": False,
                    "draftId": None,
                    "title": selected["title"],
                    "summary": "Service proposal was generated but could not be saved for approval.",
                }

            return {
                "success": True,
                "draftId": draft_id,
                "title": selected["title"],
                "summary": f"Prepared strategic service expansion blueprint for '{selected['title']}'.",
            }

        article = await generate_daily_post([], custom_topic=custom_topic)
        cover = await generate_cover_image(
            article["title"],
            article.get("categoryName", "Tech"),
        )
        article["coverImage"] = cover.get("url", "")

        draft_id = f"draft_{int(uuid.uuid4().int % 100000000)}"
        try:
            await db.execute(
                """
                INSERT INTO chief_content_drafts
                (id, agent_id, draft_type, title, excerpt, content, metadata, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_approval', NOW(), NOW());
                """,
                draft_id,
                self.agent_id,
                "article",
                article["title"],
                article.get("excerpt", ""),
                json.dumps(article.get("sections", [])),
                json.dumps(article),
            )
        except Exception:
            logger.exception(
                "[ContentResearcher] Could not persist article draft %s",
                draft_id,
            )
            return {
                "success": False,
                "draftId": None,
                "title": article["title"],
                "summary": "Article was generated but could not be saved for approval.",
            }

        return {
            "success": True,
            "draftId": draft_id,
            "title": article["title"],
            "summary": f"Drafted custom research article '{article['title']}'.",
        }


content_researcher = ContentResearcherAgent()
