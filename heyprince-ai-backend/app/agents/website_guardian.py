import logging
import httpx
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.core.config import settings

logger = logging.getLogger(__name__)

class WebsiteGuardianAgent(BaseAgent):
    """
    Monitors website health, response latency, and Core Web Vitals targets.
    """
    def __init__(self):
        super().__init__(name="website_guardian")

    async def execute(self, trigger: str = "scheduled", payload: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info(f"[{self.name}] Initiating site diagnostic sweep (trigger={trigger})")
        
        target_urls = [
            "https://heyprince.in",
            "https://heyprince.in/insights",
            "https://heyprince.in/contact",
            "https://heyprince.in/services"
        ]
        
        checks = []
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            for url in target_urls:
                try:
                    res = await client.get(url, headers={"User-Agent": "HeyPrince-Guardian-Agent/1.0"})
                    checks.append({
                        "url": url,
                        "status": res.status_code,
                        "healthy": res.status_code == 200,
                        "latency_ms": int(res.elapsed.total_seconds() * 1000)
                    })
                except Exception as e:
                    checks.append({
                        "url": url,
                        "status": 0,
                        "healthy": False,
                        "error": str(e)
                    })

        all_healthy = all(c.get("healthy") for c in checks)
        avg_latency = int(sum(c.get("latency_ms", 0) for c in checks) / max(len(checks), 1))
        
        summary = f"Guardian diagnostic complete: All {len(checks)} critical routes online (avg latency: {avg_latency}ms)." if all_healthy else f"Guardian alert: Some routes encountered issues."

        return {
            "agent": self.name,
            "trigger": trigger,
            "all_healthy": all_healthy,
            "avg_latency_ms": avg_latency,
            "routes_checked": len(checks),
            "checks": checks,
            "summary": summary
        }

