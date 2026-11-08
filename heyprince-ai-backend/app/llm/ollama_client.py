import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self, base_url: Optional[str] = None, default_model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.default_model = default_model or settings.OLLAMA_MODEL
        self.timeout = float(settings.OLLAMA_TIMEOUT_SECONDS)

    async def is_available(self) -> bool:
        """Pings the Ollama instance on local PC to verify connectivity."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        format_json: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes inference on local PC Ollama instance.
        """
        active_model = model or self.default_model
        payload = {
            "model": active_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }
        if system:
            payload["system"] = system
        if format_json:
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(f"{self.base_url}/api/generate", json=payload)
            res.raise_for_status()
            data = res.json()
            return {
                "text": data.get("response", ""),
                "provider": "ollama",
                "model": active_model,
                "prompt_tokens": data.get("prompt_eval_count", 0),
                "completion_tokens": data.get("eval_count", 0)
            }

ollama_client = OllamaClient()

# Export alias function for health endpoint
async def check_ollama_health() -> bool:
    return await ollama_client.is_available()
