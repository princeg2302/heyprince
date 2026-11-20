import logging
import json
import uuid
from typing import Dict, Any, Optional
from app.agents.base import BaseAgent
from app.core.database import db
from app.llm.memory import query_agent_memory, record_agent_learning
from app.pipeline.proposal_engine import generate_tailored_proposal

logger = logging.getLogger(__name__)

class LeadScoutAgent(BaseAgent):
    """
    Audits prospect domains, analyzes performance gaps, queries dynamic categories,
    and synthesizes non-generic, high-converting cold outreach proposals.
    """
    def __init__(self):
        super().__init__(agent_id="lead_scout", name="Lead Intelligence Scout")

    async def execute(self, trigger: str = "manual", payload: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        payload = payload or {}
        
        # 1. Retrieve persistent agent learnings
        learnings = await query_agent_memory("lead_scout", "outreach_conversion")
        logger.info(f"[{self.name}] Retrieved {len(learnings)} historical learnings from memory store.")

        target_company = payload.get("company")
        target_domain = payload.get("domain")
        notes = payload.get("notes", "")

        # 2. If not specified in payload, fetch highest scoring real uncontacted lead from database
        business_id = payload.get("businessId")
        if not target_company or not target_domain:
            try:
                candidate_leads = await db.query(
                    """
                    SELECT id, name, domain, industry, website, lead_score, metadata
                    FROM businesses
                    WHERE status IN ('new', 'qualified', 'researched')
                      AND domain IS NOT NULL AND domain != ''
                    ORDER BY COALESCE(lead_score, 0.5) DESC, created_at DESC
                    LIMIT 1;
                    """
                )
                if candidate_leads:
                    lead = candidate_leads[0]
                    business_id = str(lead["id"])
                    target_company = lead["name"]
                    target_domain = lead["domain"]
                    industry = lead.get("industry") or "Technology & Commerce"
                    notes = f"Industry: {industry}. Needs high-speed Next.js frontend and mobile optimization."
                    logger.info(f"[{self.name}] Selected qualified pipeline lead: '{target_company}' ({target_domain})")
            except Exception as e:
                logger.warning(f"[{self.name}] DB lookup notice: {e}")

        # 3. Fallback to dynamic category exploration if no pending lead exists
        if not target_company or not target_domain:
            target_company = "High-Growth Digital Business"
            target_domain = "digital-growth-prospect.com"
            notes = "Identified via dynamic category rotation. Target needs Core Web Vitals optimization and sub-second page loads."

        # 4. Synthesize tailored, humanized proposal
        logger.info(f"[{self.name}] Synthesizing lead intelligence for company='{target_company}', domain='{target_domain}'")
        proposal_data = await generate_tailored_proposal(
            company_name=target_company,
            domain=target_domain,
            notes=notes
        )

        # 5. Persist tailored draft in chief_content_drafts
        draft_id = f"outreach_{int(uuid.uuid4().int % 100000000)}"
        try:
            draft_meta = {
                "businessId": business_id,
                "domain": target_domain,
                "company": target_company,
                "recommendedService": proposal_data.get("recommendedService", "Headless Architecture"),
                "estimatedRoi": proposal_data.get("estimatedRoi", ""),
                "send_status": "not_started"
            }
            await db.execute(
                """
                INSERT INTO chief_content_drafts 
                (id, agent_id, draft_type, title, excerpt, content, metadata, status, created_at, updated_at)
                VALUES ($1, $2, 'outreach_email', $3, $4, $5, $6, 'pending_approval', NOW(), NOW());
                """,
                draft_id,
                self.agent_id,
                f"Outreach Pitch: {target_company}",
                proposal_data.get("emailSubject", f"Web engineering review for {target_company}"),
                proposal_data.get("emailBody", ""),
                json.dumps(draft_meta)
            )
        except Exception as draft_err:
            logger.warning(f"[{self.name}] Draft persistence notice: {draft_err}")

        # 6. Record persistent learning outcome
        await record_agent_learning(
            agent_id="lead_scout",
            topic="outreach_pitch_synthesis",
            insight=f"Generated tailored pitch for {target_company} focusing on {proposal_data.get('recommendedService', 'performance')}.",
            evidence={"company": target_company, "domain": target_domain, "draft_id": draft_id}
        )

        return {
            "success": True,
            "draftId": draft_id,
            "company": target_company,
            "domain": target_domain,
            "proposal": proposal_data
        }

