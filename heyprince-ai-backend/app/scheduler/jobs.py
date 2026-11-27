import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.agents.website_guardian import WebsiteGuardianAgent
from app.agents.seo_growth import SeoGrowthAgent
from app.core.config import settings

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def scheduled_guardian_sweep():
    logger.info("[Scheduler] Running automated Website Guardian health check")
    await WebsiteGuardianAgent().execute(trigger="scheduled")

async def scheduled_seo_analysis():
    logger.info("[Scheduler] Running automated SEO Growth analysis")
    await SeoGrowthAgent().execute(trigger="scheduled")

def start_scheduler():
    """Start optional local jobs only when both explicit opt-in flags are enabled.

    Vercel is the canonical production scheduler. This local APScheduler is
    disabled by default to prevent duplicate autonomous runs.
    """
    if not (settings.ENABLE_SCHEDULER and settings.ENABLE_AUTONOMOUS_CRON):
        logger.info(
            "[Scheduler] Disabled. Set ENABLE_SCHEDULER=true and "
            "ENABLE_AUTONOMOUS_CRON=true only when this backend is the chosen scheduler."
        )
        return

    if scheduler.running:
        logger.info("[Scheduler] Already running; skipping duplicate startup.")
        return

    scheduler.add_job(
        scheduled_guardian_sweep,
        'interval',
        hours=6,
        id='guardian_sweep',
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    scheduler.add_job(
        scheduled_seo_analysis,
        'interval',
        hours=24,
        id='seo_analysis',
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    scheduler.start()
    logger.info("[Scheduler] APScheduler started with single-instance recurring jobs.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] APScheduler stopped.")
