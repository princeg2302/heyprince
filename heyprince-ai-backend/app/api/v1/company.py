import logging
import json
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.core.security import verify_internal_auth
from app.company.discussions import (
    get_all_employees,
    get_virtual_rooms,
    start_company_discussion,
    advance_discussion_turn,
    conclude_company_discussion,
    get_employee_by_id
)
from app.core.database import db

logger = logging.getLogger(__name__)
router = APIRouter()

class StartDiscussionRequest(BaseModel):
    room_id: str
    title: str
    objective: str
    participant_ids: Optional[List[str]] = None
    token_budget: Optional[int] = 4000
    max_turns: Optional[int] = 8

class TurnRequest(BaseModel):
    speakerId: Optional[str] = None

class ProposeAgentRequest(BaseModel):
    name: str
    display_title: str
    department: str
    capability_gap: str
    business_justification: str

@router.get("/overview")
async def get_overview(auth: Dict[str, Any] = Depends(verify_internal_auth)):
    employees = await get_all_employees()
    rooms = await get_virtual_rooms()
    disc_rows = await db.query("SELECT * FROM company_discussions WHERE status = 'in_progress' ORDER BY created_at DESC;")
    prop_rows = await db.query("SELECT COUNT(*) as count FROM company_proposals WHERE status = 'pending_approval';")
    task_rows = await db.query("SELECT COUNT(*) as count FROM company_tasks WHERE status IN ('pending', 'in_progress', 'review_ready');")
    
    return {
        "success": True,
        "employees": employees,
        "rooms": rooms,
        "activeDiscussions": disc_rows,
        "pendingProposalsCount": int(prop_rows[0]["count"]) if prop_rows else 0,
        "openTasksCount": int(task_rows[0]["count"]) if task_rows else 0,
        "systemHealth": "healthy"
    }

@router.get("/employees")
async def list_employees(auth: Dict[str, Any] = Depends(verify_internal_auth)):
    employees = await get_all_employees()
    return {"success": True, "employees": employees}

@router.get("/rooms")
async def list_rooms(auth: Dict[str, Any] = Depends(verify_internal_auth)):
    rooms = await get_virtual_rooms()
    return {"success": True, "rooms": rooms}

@router.post("/discussions")
async def create_discussion(
    req: StartDiscussionRequest,
    auth: Dict[str, Any] = Depends(verify_internal_auth)
):
    try:
        result = await start_company_discussion(
            room_id=req.room_id,
            title=req.title,
            objective=req.objective,
            participant_ids=req.participant_ids,
            token_budget=req.token_budget or 4000,
            max_turns=req.max_turns or 8
        )
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"[API:Company] Discussion startup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/discussions/{discussion_id}/turn")
async def advance_turn(
    discussion_id: str,
    req: TurnRequest,
    auth: Dict[str, Any] = Depends(verify_internal_auth)
):
    try:
        result = await advance_discussion_turn(discussion_id)
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"[API:Company] Turn advance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/discussions/{discussion_id}/conclude")
async def conclude_discussion(
    discussion_id: str,
    auth: Dict[str, Any] = Depends(verify_internal_auth)
):
    try:
        result = await conclude_company_discussion(discussion_id)
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"[API:Company] Conclude error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
