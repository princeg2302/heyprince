import time
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class TelemetryEvent:
    def __init__(
        self,
        provider: str,
        model: str,
        attempt: int,
        duration_ms: float,
        success: bool,
        error_category: Optional[str] = None,
        tokens_in: int = 0,
        tokens_out: int = 0,
        estimated_cost_usd: float = 0.0
    ):
        self.provider = provider
        self.model = model
        self.attempt = attempt
        self.duration_ms = round(duration_ms, 2)
        self.success = success
        self.error_category = error_category
        self.tokens_in = tokens_in
        self.tokens_out = tokens_out
        self.total_tokens = tokens_in + tokens_out
        self.estimated_cost_usd = round(estimated_cost_usd, 6)
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "model": self.model,
            "attempt": self.attempt,
            "duration_ms": self.duration_ms,
            "success": self.success,
            "error_category": self.error_category,
            "tokens_in": self.tokens_in,
            "tokens_out": self.tokens_out,
            "total_tokens": self.total_tokens,
            "estimated_cost_usd": self.estimated_cost_usd,
            "timestamp": self.timestamp
        }

class TelemetryTracker:
    def __init__(self, max_history: int = 100):
        self.events: List[TelemetryEvent] = []
        self.max_history = max_history

    def record(self, event: TelemetryEvent):
        self.events.append(event)
        if len(self.events) > self.max_history:
            self.events.pop(0)

        status_str = "SUCCESS" if event.success else f"FAILED [{event.error_category}]"
        logger.info(
            f"[AI Telemetry] {event.provider} ({event.model}) attempt={event.attempt} "
            f"duration={event.duration_ms}ms status={status_str} tokens={event.total_tokens}"
        )

    def get_recent_metrics(self) -> Dict[str, Any]:
        total = len(self.events)
        if total == 0:
            return {"total_calls": 0, "success_rate": 1.0}

        successful = sum(1 for e in self.events if e.success)
        total_tokens = sum(e.total_tokens for e in self.events)
        total_cost = sum(e.estimated_cost_usd for e in self.events)
        avg_latency = sum(e.duration_ms for e in self.events) / total

        return {
            "total_calls": total,
            "successful_calls": successful,
            "failed_calls": total - successful,
            "success_rate": round(successful / total, 3),
            "avg_latency_ms": round(avg_latency, 2),
            "total_tokens": total_tokens,
            "total_estimated_cost_usd": round(total_cost, 6),
            "recent_events": [e.to_dict() for e in self.events[-10:]]
        }

telemetry_tracker = TelemetryTracker()
