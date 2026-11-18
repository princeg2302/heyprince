import os
import json
import logging
import httpx
from typing import Optional, Dict, Any, List
from app.core.config import settings
from app.llm.sanitizer import sanitize_em_dashes

logger = logging.getLogger(__name__)

class OpenAIClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        self.base_url = settings.OPENAI_BASE_URL.rstrip('/')

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

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
        Executes inference via OpenAI Chat Completions API.
        Uses AsyncOpenAI if installed, or direct asynchronous HTTP client fallback.
        """
        active_key = self.api_key or settings.OPENAI_API_KEY
        if not active_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        active_model = model or self.model or "gpt-4o-mini"
        messages: List[Dict[str, str]] = []

        if system:
            messages.append({"role": "system", "content": system})

        # When format_json is requested, append explicit directive for JSON object
        user_content = prompt
        if format_json and "json" not in prompt.lower() and (not system or "json" not in system.lower()):
            user_content = f"{prompt}\n\nPlease output valid JSON."

        messages.append({"role": "user", "content": user_content})

        payload: Dict[str, Any] = {
            "model": active_model,
            "messages": messages,
            "temperature": temperature,
        }

        if format_json:
            payload["response_format"] = {"type": "json_object"}

        if "max_tokens" in kwargs:
            payload["max_tokens"] = kwargs["max_tokens"]

        headers = {
            "Authorization": f"Bearer {active_key}",
            "Content-Type": "application/json"
        }

        # Try official SDK first if available
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=active_key, base_url=self.base_url)
            sdk_kwargs: Dict[str, Any] = {
                "model": active_model,
                "messages": messages,
                "temperature": temperature,
            }
            if format_json:
                sdk_kwargs["response_format"] = {"type": "json_object"}
            if "max_tokens" in kwargs:
                sdk_kwargs["max_tokens"] = kwargs["max_tokens"]

            response = await client.chat.completions.create(**sdk_kwargs)
            choice = response.choices[0]
            text = choice.message.content or ""
            text = sanitize_em_dashes(text)

            usage = {
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0,
            }

            return {
                "text": text,
                "provider": "openai",
                "model": active_model,
                "finish_reason": choice.finish_reason,
                "usage": usage
            }
        except ImportError:
            # Fallback to direct HTTP request using httpx
            pass
        except Exception as sdk_err:
            # If SDK raised a rate limit or auth error, re-raise to router
            raise sdk_err

        # Direct HTTP execution fallback
        url = f"{self.base_url}/chat/completions"
        async with httpx.AsyncClient(timeout=45.0) as http_client:
            res = await http_client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices:
                    raw_text = choices[0].get("message", {}).get("content", "")
                    clean_text = sanitize_em_dashes(raw_text)
                    raw_usage = data.get("usage", {})
                    return {
                        "text": clean_text,
                        "provider": "openai",
                        "model": active_model,
                        "finish_reason": choices[0].get("finish_reason"),
                        "usage": {
                            "prompt_tokens": raw_usage.get("prompt_tokens", 0),
                            "completion_tokens": raw_usage.get("completion_tokens", 0),
                            "total_tokens": raw_usage.get("total_tokens", 0),
                        }
                    }
                raise RuntimeError("OpenAI returned empty choices array.")
            else:
                error_msg = f"OpenAI HTTP {res.status_code}: {res.text[:200]}"
                logger.warning(f"[OpenAIClient] {error_msg}")
                raise RuntimeError(error_msg)

openai_client = OpenAIClient()
