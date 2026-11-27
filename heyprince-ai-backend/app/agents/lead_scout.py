import logging
import json
import uuid
from typing import Dict, Any, Optional
from urllib.parse import urlparse

import httpx

from app.agents.base import BaseAgent
from app.core.database import db
from app.llm.memory import query_agent_memory, record_agent_learning
from app.pipeline.proposal_engine import generate_tailored_proposal

logger = logging.getLogger(__name__)


class LeadScoutAgent(BaseAgent):
    """Researches real, already-discovered businesses; never fabricates prospects."""

    def __init__(self):
        super().__init__(agent_id="lead_scout", name="Lead Intelligence Scout")

    async def execute(
        self,
        trigger: str = "manual",
        payload: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        payload = payload or {}
        await query_agent_memory("lead_scout", "outreach_conversion")

        business_id = payload.get("businessId")
        company = (payload.get("company") or "").strip()
        domain = (payload.get("domain") or "").strip()
        notes = (payload.get("notes") or "").strip()

        # Only process a real prospect supplied by discovery or stored in the CRM.
        if business_id:
            rows = await db.query(
                """
                SELECT id, name, domain, website, website_url, industry, metadata
                FROM businesses
                WHERE id::text = $1
                LIMIT 1
                """,
                str(business_id),
            )
        elif company and domain:
            rows = await db.query(
                """
                SELECT id, name, domain, website, website_url, industry, metadata
                FROM businesses
                WHERE lower(name) = lower($1)
                  AND (lower(domain) = lower($2) OR lower(website) = lower($2)
                       OR lower(website_url) = lower($2))
                LIMIT 1
                """,
                company,
                domain,
            )
        else:
            rows = await db.query(
                """
                SELECT id, name, domain, website, website_url, industry, metadata
                FROM businesses
                WHERE status IN ('DISCOVERED', 'AUDITED', 'ENRICHED', 'new', 'qualified', 'researched')
                  AND COALESCE(domain, website, website_url, '') <> ''
                  AND NOT EXISTS (
                    SELECT 1 FROM chief_content_drafts d
                    WHERE d.metadata->>'businessId' = businesses.id::text
                  )
                ORDER BY COALESCE(lead_score, 0) DESC, created_at DESC
                LIMIT 1
                """
            )

        if not rows:
            return {
                "success": False,
                "status": "no_real_leads",
                "draftId": None,
                "message": "No real, undispatched business exists in the CRM. Run the configured discovery provider first.",
                "leadsFound": 0,
            }

        lead = rows[0]
        business_id = str(lead["id"])
        company = (lead.get("name") or "").strip()
        raw_domain = (lead.get("domain") or lead.get("website") or lead.get("website_url") or "").strip()
        if not company or not raw_domain:
            return {"success": False, "status": "incomplete_lead", "message": "CRM prospect is missing company name or website."}

        parsed = urlparse(raw_domain if "://" in raw_domain else f"https://{raw_domain}")
        host = parsed.netloc or parsed.path
        if not host or "." not in host:
            return {"success": False, "status": "invalid_domain", "company": company}

        website_url = f"https://{host}"
        try:
            async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
                response = await client.get(website_url, headers={"User-Agent": "HeyPrince-LeadResearch/1.0"})
                website_evidence = {
                    "url": str(response.url),
                    "http_status": response.status_code,
                    "reachable": response.status_code < 500,
                    "page_title": "",
                }
                if response.status_code < 500:
                    import re
                    match = re.search(r"<title[^>]*>(.*?)</title>", response.text[:200000], re.I | re.S)
                    if match:
                        website_evidence["page_title"] = re.sub(r"\s+", " ", match.group(1)).strip()[:180]
        except Exception as exc:
            return {
                "success": False,
                "status": "website_unreachable",
                "company": company,
                "domain": host,
                "message": f"Could not verify prospect website: {type(exc).__name__}",
            }

        industry = lead.get("industry") or "Not verified"
        evidence_notes = (
            f"Verified website: {website_evidence['url']}; HTTP status: {website_evidence['http_status']}; "
            f"Page title: {website_evidence['page_title'] or 'not available'}; Industry from CRM: {industry}. "
            f"Do not claim performance problems, CMS, traffic, revenue, or ROI unless independently measured. "
            f"Operator notes: {notes}"
        )
        proposal = await generate_tailored_proposal(
            company_name=company,
            domain=host,
            notes=evidence_notes,
        )

        if not proposal or not proposal.get("emailBody"):
            return {"success": False, "status": "proposal_generation_failed", "company": company, "domain": host}

        draft_id = f"outreach_{uuid.uuid4().hex[:16]}"
        metadata = {
            "businessId": business_id,
            "company": company,
            "domain": host,
            "websiteEvidence": website_evidence,
            "recommendedService": proposal.get("recommendedService"),
            "send_status": "not_started",
            "source": "verified_crm_business",
        }
        await db.execute(
            """
            INSERT INTO chief_content_drafts
            (id, agent_id, draft_type, title, excerpt, content, metadata, status, created_at, updated_at)
            VALUES ($1, $2, 'outreach_email', $3, $4, $5, $6, 'pending_approval', NOW(), NOW())
            """,
            draft_id,
            self.agent_id,
            f"Outreach research: {company}",
            proposal.get("emailSubject", f"Introduction to {company}"),
            json.dumps(proposal),
            json.dumps(metadata),
        )

        await record_agent_learning(
            agent_id=self.agent_id,
            topic="verified_prospect_research",
            insight=f"Prepared an evidence-backed outreach draft for {company} ({host}).",
            evidence={"business_id": business_id, "draft_id": draft_id, "website": website_evidence},
        )
        return {
            "success": True,
            "status": "draft_created",
            "draftId": draft_id,
            "company": company,
            "domain": host,
            "websiteEvidence": website_evidence,
            "proposal": proposal,
            "message": "Verified prospect researched and draft saved for human approval. No message was sent.",
        }


lead_scout = LeadScoutAgent()
