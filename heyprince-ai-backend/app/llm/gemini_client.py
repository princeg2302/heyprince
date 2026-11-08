import httpx
import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.candidate_models = [
            settings.GEMINI_MODEL,
            "gemini-2.5-flash",
            "gemini-3.8-flash",
            "gemini-2.5-pro",
            "gemini-flash-latest"
        ]

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        format_json: bool = False
    ) -> Dict[str, Any]:
        """
        Executes inference via Google Gemini REST API with candidate model fallbacks.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        models_to_try = [model] if model else self.candidate_models

        last_error = None
        async with httpx.AsyncClient(timeout=45.0) as client:
            for active_model in models_to_try:
                if not active_model:
                    continue
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{active_model}:generateContent?key={self.api_key}"
                    
                    contents = []
                    if system:
                        contents.append({"role": "user", "parts": [{"text": f"System Directive: {system}"}]})
                        contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow this directive."}]})
                    
                    contents.append({"role": "user", "parts": [{"text": prompt}]})

                    payload = {
                        "contents": contents,
                        "generationConfig": {
                            "temperature": temperature,
                        }
                    }
                    if format_json:
                        payload["generationConfig"]["responseMimeType"] = "application/json"

                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            text = "".join(p.get("text", "") for p in parts)
                            return {
                                "text": text,
                                "provider": "gemini",
                                "model": active_model
                            }
                    else:
                        logger.warning(f"[Gemini] Model {active_model} returned {res.status_code}: {res.text[:120]}")
                except Exception as e:
                    last_error = e
                    logger.warning(f"[Gemini] Error with {active_model}: {e}")

        raise RuntimeError(f"All Gemini candidate models failed. Last error: {last_error}")

gemini_client = GeminiClient()

