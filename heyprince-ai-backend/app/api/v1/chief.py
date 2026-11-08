import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.core.security import verify_internal_auth
from app.agents.content_researcher import ContentResearcherAgent
from app.agents.website_guardian import WebsiteGuardianAgent
from app.agents.seo_growth import SeoGrowthAgent
from app.agents.lead_scout import LeadScoutAgent

logger = logging.getLogger(__name__)
router = APIRouter()

class RunAgentRequest(BaseModel):
    agent: str
    trigger: Optional[str] = "manual"
    payload: Optional[Dict[str, Any]] = None

AGENT_REGISTRY = {
    "content_researcher": ContentResearcherAgent,
    "website_guardian": WebsiteGuardianAgent,
    "seo_growth": SeoGrowthAgent,
    "lead_scout": LeadScoutAgent
}

@router.post("/run-agent")
async def run_chief_agent(
    req: RunAgentRequest,
    auth_data: Dict[str, Any] = Depends(verify_internal_auth)
):
    """
    Executes a Chief of Staff autonomous agent workflow and returns execution telemetry.
    """
    agent_cls = AGENT_REGISTRY.get(req.agent.lower())
    if not agent_cls:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown agent '{req.agent}'. Available: {list(AGENT_REGISTRY.keys())}"
        )
        
    logger.info(f"[API:Chief] Running agent '{req.agent}' triggered by {req.trigger}")
    instance = agent_cls()
    result = await instance.execute(trigger=req.trigger or "manual", payload=req.payload or {})
    
    return {
        "success": True,
        "agent": req.agent,
        "trigger": req.trigger,
        "result": result
    }

