import json
import logging
from typing import List, Dict, Any, Optional
from app.core.database import db

logger = logging.getLogger(__name__)

class LongTermMemory:
    """
    Manages persistent multi-tier company memory, employee learnings, and strategic history
    in PostgreSQL (Supabase) across both Next.js and Python agents.
    """
    async def get_recent_context(
        self,
        category: str = "strategy",
        department: Optional[str] = None,
        employee_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieves relevant company memories ordered by recency.
        """
        try:
            conditions = ["scope = 'company'"]
            params: List[Any] = []
            idx = 1

            if category and category != "all":
                conditions.append(f"category = ${idx}")
                params.append(category)
                idx += 1

            if department:
                conditions.append(f"(scope = 'department' AND department = ${idx})")
                params.append(department)
                idx += 1

            if employee_id:
                conditions.append(f"(scope = 'employee' AND employee_id = ${idx})")
                params.append(employee_id)
                idx += 1

            params.append(limit)
            query_sql = f"""
                SELECT id, scope, department, employee_id, category, insight, metadata, confidence_score, created_at
                FROM company_memory
                WHERE ({" OR ".join(conditions)})
                ORDER BY created_at DESC
                LIMIT ${idx};
            """
            return await db.query(query_sql, *params)
        except Exception as e:
            logger.warning(f"[Memory] Could not retrieve long term memory from company_memory: {e}")
            return []

    async def store_insight(
        self,
        key_insight: str,
        category: str = "learning",
        scope: str = "company",
        department: Optional[str] = None,
        employee_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        confidence_score: float = 1.0
    ) -> bool:
        """
        Stores an actionable insight or strategic lesson into company_memory.
        """
        try:
            await db.execute(
                """
                INSERT INTO company_memory (
                    scope, department, employee_id, category, insight, metadata, confidence_score, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());
                """,
                scope,
                department,
                employee_id,
                category,
                key_insight,
                json.dumps(metadata or {}),
                confidence_score
            )
            logger.info(f"[Memory] Successfully stored insight into company_memory ({category})")
            return True
        except Exception as e:
            logger.warning(f"[Memory] Failed to store insight into company_memory: {e}")
            return False

    async def get_agent_learnings(self, agent_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieves specific learnings and directives for an agent.
        """
        try:
            return await db.query(
                """
                SELECT id, agent_id, learning_type, topic_or_entity, lesson, actionable_directive, source_reference, created_at
                FROM company_agent_learnings
                WHERE agent_id = $1
                ORDER BY created_at DESC
                LIMIT $2;
                """,
                agent_id,
                limit
            )
        except Exception as e:
            logger.warning(f"[Memory] Could not retrieve agent learnings: {e}")
            return []

    async def record_learning(
        self,
        agent_id: str,
        learning_type: str,
        topic_or_entity: str,
        lesson: str,
        actionable_directive: str,
        source_reference: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Records a persistent learning from an approval, rejection, or performance outcome.
        """
        try:
            await db.execute(
                """
                INSERT INTO company_agent_learnings (
                    agent_id, learning_type, topic_or_entity, lesson, actionable_directive, source_reference, metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
                """,
                agent_id,
                learning_type,
                topic_or_entity,
                lesson,
                actionable_directive,
                source_reference,
                json.dumps(metadata or {})
            )
            return True
        except Exception as e:
            logger.warning(f"[Memory] Failed to record learning: {e}")
            return False

memory = LongTermMemory()
