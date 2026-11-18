import httpx
import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None, category: str = "server_error"):
        super().__init__(message)
        self.status_code = status_code
        self.category = category

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.get_gemini_primary_key()
        self.candidate_models = [
            settings.GEMINI_MODEL,
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-flash-latest"
        ]

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        api_key_override: Optional[str] = None,
        temperature: float = 0.7,
        format_json: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes inference via Google Gemini REST API with candidate model fallbacks.
        Classifies errors into specific categories (quota, rate_limit, server_error, etc.).
        """
        active_key = api_key_override or self.api_key or settings.get_gemini_primary_key()
        if not active_key:
            raise GeminiError("GEMINI_API_KEY is not configured", status_code=401, category="auth_error")

        models_to_try = [model] if model else self.candidate_models
        last_error: Optional[Exception] = None

        async with httpx.AsyncClient(timeout=45.0) as client:
            for active_model in models_to_try:
                if not active_model:
                    continue
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{active_model}:generateContent?key={active_key}"
                    
                    contents = []
                    if system:
                        contents.append({"role": "user", "parts": [{"text": f"System Directive: {system}"}]})
                        contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow this directive."}]})
                    
                    contents.append({"role": "user", "parts": [{"text": prompt}]})

                    payload: Dict[str, Any] = {
                        "contents": contents,
                        "generationConfig": {
                            "temperature": temperature,
                        }
                    }
                    if format_json:
                        payload["generationConfig"]["responseMimeType"] = "application/json"
                    if "max_tokens" in kwargs:
                        payload["generationConfig"]["maxOutputTokens"] = kwargs["max_tokens"]

                    res = await client.post(url, json=payload)
                    
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            text = "".join(p.get("text", "") for p in parts)
                            raw_usage = data.get("usageMetadata", {})
                            return {
                                "text": text,
                                "provider": "gemini",
                                "model": active_model,
                                "usage": {
                                    "prompt_tokens": raw_usage.get("promptTokenCount", 0),
                                    "completion_tokens": raw_usage.get("candidatesTokenCount", 0),
                                    "total_tokens": raw_usage.get("totalTokenCount", 0)
                                }
                            }
                    
                    # Error classification
                    status = res.status_code
                    body_text = res.text
                    lower_body = body_text.lower()

                    if status == 429 or "resource_exhausted" in lower_body or "quota exceeded" in lower_body:
                        is_project_level = "project" in lower_body or "per-project" in lower_body
                        category = "project_quota_exhausted" if is_project_level else "quota_exhausted"
                        raise GeminiError(
                            f"Gemini quota exhausted ({active_model}): {body_text[:180]}",
                            status_code=status,
                            category=category
                        )
                    elif status in (401, 403):
                        raise GeminiError(
                            f"Gemini authentication failed ({active_model}): {body_text[:180]}",
                            status_code=status,
                            category="auth_error"
                        )
                    elif status == 400:
                        raise GeminiError(
                            f"Gemini invalid request ({active_model}): {body_text[:180]}",
                            status_code=status,
                            category="invalid_request"
                        )
                    elif status in (500, 502, 503, 504):
                        logger.warning(f"[Gemini] Server error {status} for {active_model}, retrying alternative model if available.")
                        last_error = GeminiError(
                            f"Gemini server error {status}: {body_text[:120]}",
                            status_code=status,
                            category="server_error"
                        )
                    else:
                        logger.warning(f"[Gemini] Model {active_model} returned {status}: {body_text[:120]}")
                        last_error = GeminiError(
                            f"Gemini unexpected error {status}: {body_text[:120]}",
                            status_code=status,
                            category="server_error"
                        )
                except (GeminiError, httpx.TimeoutException, httpx.ConnectError) as exc:
                    last_error = exc
                    # If this is a project quota exhaustion or auth error, don't keep trying candidate models with same key
                    if isinstance(exc, GeminiError) and exc.category in ("project_quota_exhausted", "quota_exhausted", "auth_error", "invalid_request"):
                        raise exc
                except Exception as e:
                    last_error = e
                    logger.warning(f"[Gemini] Unexpected exception with {active_model}: {e}")

        if isinstance(last_error, GeminiError):
            raise last_error
        raise GeminiError(f"All Gemini candidate models failed: {last_error}", category="server_error")

gemini_client = GeminiClient()
