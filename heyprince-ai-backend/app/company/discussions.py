import json
import logging
import uuid
from typing import Dict, Any, List, Optional
from app.core.database import db
from app.llm.router import llm_router
from app.llm.sanitizer import sanitize_em_dashes, NO_EM_DASH_INSTRUCTION

logger = logging.getLogger(__name__)

MODERATOR_ID = "alex_vance"

async def get_all_employees() -> List[Dict[str, Any]]:
    return await db.query(
        """
        SELECT id, name, display_title, department, avatar_url, bio, 
               personality_archetype, system_prompt_overlay, model_preference, 
               status, current_activity, tool_permissions, performance_metrics
        FROM company_employees
        ORDER BY department ASC, name ASC;
        """
    )

async def get_employee_by_id(employee_id: str) -> Optional[Dict[str, Any]]:
    rows = await db.query("SELECT * FROM company_employees WHERE id = $1 LIMIT 1;", employee_id)
    return rows[0] if rows else None

async def get_virtual_rooms() -> List[Dict[str, Any]]:
    return await db.query("SELECT * FROM company_rooms ORDER BY name ASC;")

async def start_company_discussion(
    room_id: str,
    title: str,
    objective: str,
    participant_ids: Optional[List[str]] = None,
    token_budget: int = 4000,
    max_turns: int = 8
) -> Dict[str, Any]:
    """
    Initializes a structured corporate meeting in a virtual room.
    Alex Vance opens the meeting with an executive agenda and summons participants.
    """
    logger.info(f"[CompanyEngine] Initializing discussion '{title}' in room '{room_id}'")
    
    # 1. Resolve participants
    all_emps = await get_all_employees()
    emp_map = {e["id"]: e for e in all_emps}
    
    if not participant_ids:
        # Default participants based on room
        if room_id in ("war_room", "daily_standup"):
            participant_ids = [e["id"] for e in all_emps]
        elif room_id == "growth_sales":
            participant_ids = ["alex_vance", "elena_rostova", "liam_thorne", "sophia_reynolds"]
        elif room_id == "innovation_lab":
            participant_ids = ["alex_vance", "marcus_sterling", "elena_rostova"]
        elif room_id == "dev_room":
            participant_ids = ["alex_vance", "david_chen", "elena_rostova"]
        else:
            participant_ids = list(emp_map.keys())

    # Ensure moderator is in participants
    if MODERATOR_ID not in participant_ids:
        participant_ids.insert(0, MODERATOR_ID)

    # 2. Update employee statuses to 'in_meeting'
    for pid in participant_ids:
        await db.execute(
            """
            UPDATE company_employees 
            SET status = 'in_meeting', current_activity = $1, updated_at = NOW()
            WHERE id = $2;
            """,
            f"Attending '{title}' in {room_id}",
            pid
        )

    # 3. Create discussion record
    disc_rows = await db.query(
        """
        INSERT INTO company_discussions (
            room_id, title, objective, moderator_id, participant_ids, 
            status, token_budget, max_turns, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'in_progress', $6, $7, NOW(), NOW())
        RETURNING *;
        """,
        room_id,
        title,
        objective,
        MODERATOR_ID,
        participant_ids,
        token_budget,
        max_turns
    )
    discussion = disc_rows[0]
    discussion_id = str(discussion["id"])

    # 4. Generate Alex Vance's opening statement
    names = [emp_map[p]["name"] for p in participant_ids if p in emp_map and p != MODERATOR_ID]
    opening_prompt = f"""
You are Alex Vance, Chief of Staff for HeyPrince.
You are opening a corporate meeting in the '{room_id}' room.
TITLE: {title}
OBJECTIVE: {objective}
PARTICIPANTS PRESENT: {', '.join(names)}

Provide a sharp, professional 2-sentence opening stating the objective and directly asking the first specialist to present their findings.
STRICT RULE: No em-dashes (—). No filler small talk.
"""
    res = await llm_router.generate(prompt=opening_prompt, temperature=0.3)
    opening_text = sanitize_em_dashes(res["text"].strip())

    # Insert message
    msg_rows = await db.query(
        """
        INSERT INTO company_messages (
            discussion_id, sender_id, message_type, content, evidence, tokens_used, created_at
        ) VALUES ($1, $2, 'statement', $3, '{}'::jsonb, 50, NOW())
        RETURNING *;
        """,
        uuid.UUID(discussion_id),
        MODERATOR_ID,
        opening_text
    )

    return {
        "discussion": discussion,
        "opening_message": msg_rows[0],
        "participants": [emp_map[p] for p in participant_ids if p in emp_map]
    }

async def advance_discussion_turn(discussion_id: str) -> Dict[str, Any]:
    """
    Executes the next speaker turn in the meeting.
    Alex Vance analyzes discourse, summons the appropriate specialist,
    generates their response in-character, and inserts the message.
    """
    disc_rows = await db.query("SELECT * FROM company_discussions WHERE id = $1 LIMIT 1;", uuid.UUID(discussion_id))
    if not disc_rows:
        raise ValueError(f"Discussion {discussion_id} not found")
    discussion = disc_rows[0]

    if discussion["status"] != "in_progress":
        return {"status": discussion["status"], "message": "Discussion is already concluded or converted."}

    # Check limits
    if discussion["turn_count"] >= discussion["max_turns"] or discussion["tokens_consumed"] >= discussion["token_budget"]:
        logger.info(f"[CompanyEngine] Discussion {discussion_id} reached limits. Concluding meeting.")
        return await conclude_company_discussion(discussion_id)

    # Fetch recent messages
    messages = await db.query(
        """
        SELECT m.*, e.name as sender_name, e.display_title as sender_role
        FROM company_messages m
        JOIN company_employees e ON m.sender_id = e.id
        WHERE m.discussion_id = $1
        ORDER BY m.created_at ASC;
        """,
        uuid.UUID(discussion_id)
    )

    all_emps = await get_all_employees()
    emp_map = {e["id"]: e for e in all_emps}
    participants = [p for p in discussion["participant_ids"] if p in emp_map]

    # Last speaker
    last_speaker_id = messages[-1]["sender_id"] if messages else MODERATOR_ID

    # Determine next speaker: alternate between specialist and moderator/other specialist
    available_candidates = [p for p in participants if p != last_speaker_id and p != MODERATOR_ID]
    if not available_candidates or last_speaker_id != MODERATOR_ID:
        next_speaker_id = MODERATOR_ID
    else:
        # Round robin or select specialist
        turn_index = (discussion["turn_count"]) % len(available_candidates)
        next_speaker_id = available_candidates[turn_index]

    speaker = emp_map[next_speaker_id]

    # Format transcript
    transcript = "\n".join([f"{m['sender_name']} ({m['message_type'].upper()}): {m['content']}" for m in messages[-6:]])

    # System instruction for speaker
    system_prompt = f"""
You are {speaker['name']}, {speaker['display_title']} at HeyPrince.
PERSONALITY: {speaker['personality_archetype']}
DIRECTIVE: {speaker['system_prompt_overlay']}
{NO_EM_DASH_INSTRUCTION}

You are in a formal meeting titled '{discussion['title']}'.
MEETING OBJECTIVE: {discussion['objective']}
"""

    if next_speaker_id == MODERATOR_ID:
        user_prompt = f"""
RECENT MEETING DISCOURSE:
{transcript}

As Alex Vance (Chief of Staff), analyze the latest point.
If a decision or consensus is emerging, synthesize the agreement and state the actionable next step.
If a point needs clarification, challenge the specialist with a direct technical question.
Keep response to 2 concise sentences. Do not use em-dashes.
"""
        msg_type = "consensus" if discussion["turn_count"] >= discussion["max_turns"] - 2 else "statement"
    else:
        user_prompt = f"""
RECENT MEETING DISCOURSE:
{transcript}

Respond in your exact professional capacity as {speaker['name']}.
Cite concrete metrics, technical trade-offs, or direct evidence relevant to '{discussion['objective']}'.
Keep response to 2 to 3 concise, impactful sentences. Do not use em-dashes.
"""
        msg_type = "challenge" if "risk" in transcript.lower() or "latency" in transcript.lower() else "evidence"

    # Generate response
    res = await llm_router.generate(
        prompt=user_prompt,
        system=system_prompt,
        temperature=0.4
    )
    clean_text = sanitize_em_dashes(res["text"].strip())

    # Insert message
    new_msg_rows = await db.query(
        """
        INSERT INTO company_messages (
            discussion_id, sender_id, message_type, content, evidence, tokens_used, created_at
        ) VALUES ($1, $2, $3, $4, '{}'::jsonb, 60, NOW())
        RETURNING *;
        """,
        uuid.UUID(discussion_id),
        next_speaker_id,
        msg_type,
        clean_text
    )
    new_msg = new_msg_rows[0]
    new_msg["sender_name"] = speaker["name"]
    new_msg["sender_role"] = speaker["display_title"]

    # Increment discussion turns
    await db.execute(
        """
        UPDATE company_discussions
        SET turn_count = turn_count + 1,
            tokens_consumed = tokens_consumed + 60,
            updated_at = NOW()
        WHERE id = $1;
        """,
        uuid.UUID(discussion_id)
    )

    # Check if this was final turn
    if discussion["turn_count"] + 1 >= discussion["max_turns"]:
        return await conclude_company_discussion(discussion_id)

    return {
        "status": "in_progress",
        "turn": discussion["turn_count"] + 1,
        "max_turns": discussion["max_turns"],
        "message": new_msg
    }

async def conclude_company_discussion(discussion_id: str) -> Dict[str, Any]:
    """
    Adjourns the meeting, synthesizes findings, and yields a formal CEO Proposal or Task.
    Releases all employees back to 'idle'.
    """
    disc_rows = await db.query("SELECT * FROM company_discussions WHERE id = $1 LIMIT 1;", uuid.UUID(discussion_id))
    if not disc_rows:
        raise ValueError(f"Discussion {discussion_id} not found")
    discussion = disc_rows[0]

    messages = await db.query(
        """
        SELECT m.*, e.name as sender_name 
        FROM company_messages m
        JOIN company_employees e ON m.sender_id = e.id
        WHERE m.discussion_id = $1
        ORDER BY m.created_at ASC;
        """,
        uuid.UUID(discussion_id)
    )

    transcript = "\n".join([f"{m['sender_name']}: {m['content']}" for m in messages])

    # Synthesize formal conclusion
    synthesis_prompt = f"""
You are Alex Vance, Chief of Staff for HeyPrince.
Analyze this completed meeting transcript and synthesize the final outcome:
MEETING TITLE: {discussion['title']}
OBJECTIVE: {discussion['objective']}
TRANSCRIPT:
{transcript}

Return valid JSON with:
{{
  "summary": "2-sentence executive summary of the discussion and consensus reached.",
  "recommendedAction": "publish_content | outreach_campaign | site_modification | internal_task | dismiss",
  "actionTitle": "Clear actionable title for the initiative",
  "businessJustification": "Concrete ROI and rationale for Prince (CEO)",
  "assignedTo": "marcus_sterling | elena_rostova | liam_thorne | david_chen | sophia_reynolds"
}}
NO EM DASHES.
"""
    res = await llm_router.generate(prompt=synthesis_prompt, format_json=True)
    try:
        conclusion_data = json.loads(res["text"])
    except Exception:
        conclusion_data = {
            "summary": f"Discussion on '{discussion['title']}' concluded with cross-departmental alignment.",
            "recommendedAction": "internal_task",
            "actionTitle": f"Execute action on {discussion['title']}",
            "businessJustification": "Maintains operational momentum and aligns with quarterly engineering targets.",
            "assignedTo": "alex_vance"
        }

    # Create CEO proposal if action requires CEO approval
    proposal_id = None
    if conclusion_data.get("recommendedAction") in ("publish_content", "outreach_campaign", "site_modification"):
        prop_rows = await db.query(
            """
            INSERT INTO company_proposals (
                discussion_id, sponsored_by, title, proposal_type, business_justification,
                action_payload, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending_approval', NOW(), NOW())
            RETURNING id;
            """,
            uuid.UUID(discussion_id),
            MODERATOR_ID,
            conclusion_data.get("actionTitle", discussion["title"]),
            conclusion_data.get("recommendedAction"),
            conclusion_data.get("businessJustification", "Strategic initiative emerging from autonomous collaboration."),
            json.dumps({"discussion_id": discussion_id, "summary": conclusion_data.get("summary")})
        )
        if prop_rows:
            proposal_id = str(prop_rows[0]["id"])
            logger.info(f"[CompanyEngine] Created CEO Action Proposal {proposal_id} from discussion {discussion_id}")

    # Index learning into company_memory
    await db.execute(
        """
        INSERT INTO company_memory (
            scope, discussion_id, category, insight, metadata, created_at, updated_at
        ) VALUES ('meeting', $1, 'decision', $2, $3, NOW(), NOW());
        """,
        uuid.UUID(discussion_id),
        conclusion_data.get("summary", "Meeting concluded."),
        json.dumps(conclusion_data)
    )

    # Mark discussion concluded
    await db.execute(
        """
        UPDATE company_discussions
        SET status = 'concluded',
            conclusion = $1,
            concluded_at = NOW(),
            updated_at = NOW()
        WHERE id = $2;
        """,
        json.dumps(conclusion_data),
        uuid.UUID(discussion_id)
    )

    # Release participants back to 'idle'
    for pid in discussion["participant_ids"]:
        await db.execute(
            """
            UPDATE company_employees
            SET status = 'idle', current_activity = 'Available for assignment', updated_at = NOW()
            WHERE id = $1;
            """,
            pid
        )

    # Post final summary message into room
    final_msg_rows = await db.query(
        """
        INSERT INTO company_messages (
            discussion_id, sender_id, message_type, content, evidence, tokens_used, created_at
        ) VALUES ($1, $2, 'summary', $3, '{}'::jsonb, 50, NOW())
        RETURNING *;
        """,
        uuid.UUID(discussion_id),
        MODERATOR_ID,
        f"MEETING ADJOURNED: {conclusion_data.get('summary')}"
    )

    return {
        "status": "concluded",
        "discussion_id": discussion_id,
        "conclusion": conclusion_data,
        "proposal_id": proposal_id,
        "summary_message": final_msg_rows[0]
    }
