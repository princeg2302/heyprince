import json
import logging
from typing import List, Dict, Any, Optional
from app.core.database import db

logger = logging.getLogger(__name__)

class LongTermMemory:
    """
    Manages long-term conversational memory, brand facts, and past discussions in Supabase.
    """
    async def get_recent_context(self, category: str = "general", limit: int = 10) -> List[Dict[str, Any]]:
        try:
            records = await db.query(
                """
                SELECT id, category, key_insight, metadata, created_at
                FROM chief_activity_logs
                WHERE details->>'mode' = $1 OR agent_id = 'jarvis'
                ORDER BY created_at DESC
                LIMIT $2;
                """,
                category,
                limit
            )
            return records
        except Exception as e:
            logger.warning(f"[Memory] Could not retrieve long term memory: {e}")
            return []

    async def store_insight(self, key_insight: str, category: str = "general", metadata: Optional[Dict[str, Any]] = None):
        try:
            await db.execute(
                """
                INSERT INTO chief_activity_logs (agent_id, action_type, description, details, created_at)
                VALUES ('jarvis', 'insight', $1, $2, NOW());
                """,
                key_insight,
                json.dumps(metadata or {})
            )
        except Exception as e:
            logger.warning(f"[Memory] Failed to store insight: {e}")

memory = LongTermMemory()

