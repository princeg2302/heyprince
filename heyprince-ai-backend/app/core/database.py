import asyncpg
import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabasePool:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        if not settings.DATABASE_URI:
            logger.warning("[Database] DATABASE_URI not configured. Database operations will be mocked or offline.")
            return

        try:
            clean_uri = settings.DATABASE_URI
            ssl_context = "require" if "sslmode=require" in clean_uri or "supabase" in clean_uri else None
            
            if "?" in clean_uri:
                clean_uri = clean_uri.split("?")[0]

            self.pool = await asyncpg.create_pool(
                clean_uri,
                min_size=2,
                max_size=10,
                ssl=ssl_context,
                command_timeout=30.0
            )
            logger.info("[Database] Connected to Supabase PostgreSQL pool successfully.")
        except Exception as e:
            logger.error(f"[Database] Failed to connect to PostgreSQL: {e}")

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            logger.info("[Database] Closed PostgreSQL connection pool.")

    async def query(self, sql: str, *args) -> List[Dict[str, Any]]:
        if not self.pool:
            raise RuntimeError("Database connection pool is not initialized")
        async with self.pool.acquire() as conn:
            records = await conn.fetch(sql, *args)
            return [dict(r) for r in records]

    async def execute(self, sql: str, *args) -> str:
        if not self.pool:
            raise RuntimeError("Database connection pool is not initialized")
        async with self.pool.acquire() as conn:
            return await conn.execute(sql, *args)

db = DatabasePool()

# Expose aliases for compatibility across all modules
async def init_db_pool():
    await db.connect()

async def close_db_pool():
    await db.disconnect()

class DBPoolProxy:
    def __getattr__(self, name):
        if db.pool:
            return getattr(db.pool, name)
        raise RuntimeError("Database pool not yet initialized. Call init_db_pool() first.")
    
    def __bool__(self):
        return db.pool is not None

db_pool = DBPoolProxy()
