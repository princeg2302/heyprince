import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.agents.website_guardian import WebsiteGuardianAgent
from app.agents.seo_growth import SeoGrowthAgent
from app.agents.content_researcher import ContentResearcherAgent
from app.core.config import settings

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def scheduled_guardian_sweep():
    logger.info("[Scheduler] Running automated Website Guardian health check")
    agent = WebsiteGuardianAgent()
    await agent.execute(trigger="scheduled")

async def scheduled_seo_analysis():
    logger.info("[Scheduler] Running automated SEO Growth analysis")
    agent = SeoGrowthAgent()
    await agent.execute(trigger="scheduled")

def start_scheduler():
    """
    Initializes recurring background AI jobs.
    Runs only if ENABLE_AUTONOMOUS_CRON is True in config.
    """
    if not settings.ENABLE_AUTONOMOUS_CRON:
        logger.info("[Scheduler] Autonomous cron is disabled via ENABLE_AUTONOMOUS_CRON=False")
        return

    # Guardian runs every 6 hours
    scheduler.add_job(scheduled_guardian_sweep, 'interval', hours=6, id='guardian_sweep')
    
    # SEO analysis runs once every 24 hours
    scheduler.add_job(scheduled_seo_analysis, 'interval', hours=24, id='seo_analysis')
    
    scheduler.start()
    logger.info("[Scheduler] APScheduler started successfully with recurring agent jobs.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] APScheduler stopped.")

