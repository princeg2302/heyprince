import logging
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.pipeline.proposal_engine import generate_tailored_proposal

logger = logging.getLogger(__name__)

class LeadScoutAgent(BaseAgent):
    """
    Audits prospect domains, analyzes performance gaps, and synthesizes cold proposals.
    """
    def __init__(self):
        super().__init__(name="lead_scout")

    async def execute(self, trigger: str = "manual", payload: Dict[str, Any] = None) -> Dict[str, Any]:
        payload = payload or {}
        company = payload.get("company", "Prospective Enterprise Client")
        domain = payload.get("domain", "target-domain.com")
        notes = payload.get("notes", "Web performance and mobile UX upgrade needed.")
        
        logger.info(f"[{self.name}] Synthesizing lead intelligence for company='{company}', domain='{domain}'")
        proposal_data = await generate_tailored_proposal(
            company_name=company,
            domain=domain,
            notes=notes
        )
        return proposal_data

