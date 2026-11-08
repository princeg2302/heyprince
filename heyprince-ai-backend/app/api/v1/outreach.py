import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.core.security import verify_internal_auth
from app.pipeline.proposal_engine import generate_tailored_proposal

logger = logging.getLogger(__name__)
router = APIRouter()

class OutreachProposalRequest(BaseModel):
    company_name: str
    domain: Optional[str] = "target-domain.com"
    notes: Optional[str] = ""
    contact_name: Optional[str] = ""

@router.post("/generate-proposal")
async def generate_outreach_proposal(
    req: OutreachProposalRequest,
    auth_data: Dict[str, Any] = Depends(verify_internal_auth)
):
    """
    Synthesizes custom technical website audit proposals for cold email & WhatsApp.
    """
    logger.info(f"[API:Outreach] Generating proposal for company='{req.company_name}', domain='{req.domain}'")
    
    proposal = await generate_tailored_proposal(
        company_name=req.company_name,
        domain=req.domain or "target-domain.com",
        notes=req.notes or ""
    )
    
    return {
        "success": True,
        "company_name": req.company_name,
        "domain": req.domain,
        "proposal": proposal
    }

