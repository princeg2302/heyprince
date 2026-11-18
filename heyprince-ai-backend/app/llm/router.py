import time
import json
import re
import random
import asyncio
import logging
from typing import Optional, Dict, Any, List

from app.core.config import settings
from app.llm.ollama_client import ollama_client
from app.llm.gemini_client import gemini_client, GeminiError
from app.llm.openai_client import openai_client
from app.llm.sanitizer import sanitize_em_dashes, NO_EM_DASH_INSTRUCTION
from app.llm.telemetry import telemetry_tracker, TelemetryEvent

logger = logging.getLogger(__name__)

# Task-based model profiles organized by quota limits and task requirements
TASK_MODEL_MAPPING: Dict[str, List[str]] = {
    "high_reasoning": [
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-3.5-flash-lite",
    ],
    "balanced": [
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
    ],
    "high_volume_chat": [
        # 500 RPD models first to protect standard 20 RPD limits during high-frequency chat
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-lite",
        "gemini-3.8-flash",
    ],
    "memory_learning": [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-2.0-flash-lite",
    ],
}

class LLMRouter:
    def __init__(self):
        self.telemetry = telemetry_tracker

    def _extract_json_payload(self, text: str) -> Optional[Any]:
        """Extracts and validates JSON from raw text or markdown code fences."""
        cleaned = text.strip()
        fenced_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if fenced_match:
            cleaned = fenced_match.group(1).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return None

    async def _execute_with_backoff(
        self,
        call_fn,
        provider_name: str,
        model_name: str,
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """
        Executes a provider call with bounded exponential backoff and jitter.
        Records telemetry for every attempt.
        """
        last_error = None
        for attempt in range(1, max_retries + 1):
            start_time = time.time()
            try:
                result = await call_fn()
                duration_ms = (time.time() - start_time) * 1000

                usage = result.get("usage", {})
                tokens_in = usage.get("prompt_tokens", 0)
                tokens_out = usage.get("completion_tokens", 0)

                self.telemetry.record(TelemetryEvent(
                    provider=provider_name,
                    model=model_name,
                    attempt=attempt,
                    duration_ms=duration_ms,
                    success=True,
                    tokens_in=tokens_in,
                    tokens_out=tokens_out
                ))
                return result

            except GeminiError as ge:
                duration_ms = (time.time() - start_time) * 1000
                last_error = ge
                self.telemetry.record(TelemetryEvent(
                    provider=provider_name,
                    model=model_name,
                    attempt=attempt,
                    duration_ms=duration_ms,
                    success=False,
                    error_category=ge.category
                ))

                # Do not retry non-transient errors (invalid input, auth failure, quota exhaustion)
                if ge.category in ("invalid_request", "auth_error", "quota_exhausted", "project_quota_exhausted"):
                    raise ge

                # Transient server error or rate limit: perform backoff if attempts remain
                if attempt < max_retries:
                    delay = min(0.4 * (2 ** attempt) + random.uniform(0.1, 0.3), 3.0)
                    logger.warning(f"[{provider_name}] Transient failure ({ge}). Retrying in {delay:.2f}s...")
                    await asyncio.sleep(delay)

            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                last_error = e
                err_str = str(e).lower()
                category = "timeout" if "timeout" in err_str else "connection_error" if "connect" in err_str else "server_error"

                self.telemetry.record(TelemetryEvent(
                    provider=provider_name,
                    model=model_name,
                    attempt=attempt,
                    duration_ms=duration_ms,
                    success=False,
                    error_category=category
                ))

                if attempt < max_retries:
                    delay = min(0.4 * (2 ** attempt) + random.uniform(0.1, 0.3), 3.0)
                    logger.warning(f"[{provider_name}] Exception ({e}). Retrying in {delay:.2f}s...")
                    await asyncio.sleep(delay)

        raise last_error or RuntimeError(f"Execution failed for {provider_name}")

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        preferred_provider: Optional[str] = None,
        model: Optional[str] = None,
        task_type: str = "balanced",
        temperature: float = 0.7,
        format_json: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Centrally routes inference across configured AI providers with dynamic task-based model selection:
          0. Local PC Ollama (if online and explicitly requested or available)
          1. Gemini Primary (GEMINI_API_KEY_1 or GEMINI_API_KEY) with model auto-shifting
          2. Gemini Backup (GEMINI_API_KEY_2) with model auto-shifting
          3. OpenAI Fallback (OPENAI_API_KEY)
        Applies automated no-em-dash rule, structured output consistency, and telemetry tracking.
        """
        effective_system = f"{system}\n\n{NO_EM_DASH_INSTRUCTION}" if system else NO_EM_DASH_INSTRUCTION
        provider_errors: List[str] = []

        # Determine task-appropriate candidate Gemini models
        base_models = TASK_MODEL_MAPPING.get(task_type, TASK_MODEL_MAPPING["balanced"])
        candidate_models: List[str] = []
        if model:
            candidate_models.append(model)
        for m in base_models:
            if m not in candidate_models:
                candidate_models.append(m)

        # ----------------------------------------------------------------------
        # PRIORITY 0: Local PC Ollama (Optional GPU acceleration)
        # ----------------------------------------------------------------------
        if preferred_provider == "ollama":
            try:
                if await ollama_client.is_available():
                    logger.info("[LLMRouter] Dispatching inference to Local PC Ollama GPU.")
                    res = await ollama_client.generate(
                        prompt=prompt,
                        system=effective_system,
                        model=model,
                        temperature=temperature,
                        format_json=format_json,
                        **kwargs
                    )
                    res["text"] = sanitize_em_dashes(res["text"])
                    if format_json:
                        res["json"] = self._extract_json_payload(res["text"])
                    return res
            except Exception as e:
                logger.warning(f"[LLMRouter] Local Ollama failed: {e}. Advancing to cloud providers.")
                provider_errors.append(f"Ollama: {e}")

        # ----------------------------------------------------------------------
        # PRIORITY 1: Gemini Primary (GEMINI_API_KEY_1 or GEMINI_API_KEY)
        # ----------------------------------------------------------------------
        primary_key = settings.get_gemini_primary_key()
        project_quota_exhausted = False

        if primary_key:
            # Try task-appropriate candidate models on Primary Key
            for active_model in candidate_models:
                try:
                    logger.info(f"[LLMRouter] Priority 1: Dispatching to Gemini Primary ({active_model}).")
                    res = await self._execute_with_backoff(
                        call_fn=lambda m=active_model: gemini_client.generate(
                            prompt=prompt,
                            system=effective_system,
                            model=m,
                            api_key_override=primary_key,
                            temperature=temperature,
                            format_json=format_json,
                            **kwargs
                        ),
                        provider_name="gemini_primary",
                        model_name=active_model,
                        max_retries=2
                    )
                    res["text"] = sanitize_em_dashes(res["text"])
                    if format_json:
                        res["json"] = self._extract_json_payload(res["text"])
                    return res

                except GeminiError as ge:
                    logger.warning(f"[LLMRouter] Gemini Primary ({active_model}) error: {ge}")
                    provider_errors.append(f"Gemini Primary ({active_model}): {ge}")
                    if ge.category == "project_quota_exhausted":
                        project_quota_exhausted = True
                        break  # Project-level quota exhausted: no other model on this project will work
                    elif ge.category == "invalid_request":
                        raise ValueError(f"Malformed request rejected by provider: {ge}")
                    elif ge.category == "quota_exhausted":
                        # Per-model quota reached: advance to next candidate model in list
                        continue
                    else:
                        break  # Auth or fatal error: advance to Backup Key
                except Exception as e:
                    logger.warning(f"[LLMRouter] Gemini Primary ({active_model}) exception: {e}")
                    provider_errors.append(f"Gemini Primary: {e}")
                    break

        # ----------------------------------------------------------------------
        # PRIORITY 2: Gemini Backup (GEMINI_API_KEY_2)
        # ----------------------------------------------------------------------
        backup_key = settings.get_gemini_backup_key()
        same_project = (
            settings.GEMINI_PROJECT_ID_1 and
            settings.GEMINI_PROJECT_ID_2 and
            settings.GEMINI_PROJECT_ID_1 == settings.GEMINI_PROJECT_ID_2
        )

        if backup_key and not project_quota_exhausted and not (same_project and "quota" in str(provider_errors).lower()):
            for active_model in candidate_models:
                try:
                    logger.info(f"[LLMRouter] Priority 2: Dispatching to Gemini Backup ({active_model}).")
                    res = await self._execute_with_backoff(
                        call_fn=lambda m=active_model: gemini_client.generate(
                            prompt=prompt,
                            system=effective_system,
                            model=m,
                            api_key_override=backup_key,
                            temperature=temperature,
                            format_json=format_json,
                            **kwargs
                        ),
                        provider_name="gemini_backup",
                        model_name=active_model,
                        max_retries=2
                    )
                    res["text"] = sanitize_em_dashes(res["text"])
                    if format_json:
                        res["json"] = self._extract_json_payload(res["text"])
                    return res

                except GeminiError as ge:
                    logger.warning(f"[LLMRouter] Gemini Backup ({active_model}) error: {ge}")
                    provider_errors.append(f"Gemini Backup ({active_model}): {ge}")
                    if ge.category == "invalid_request":
                        raise ValueError(f"Malformed request rejected by provider: {ge}")
                    elif ge.category == "quota_exhausted":
                        continue
                    else:
                        break
                except Exception as e:
                    logger.warning(f"[LLMRouter] Gemini Backup ({active_model}) exception: {e}")
                    provider_errors.append(f"Gemini Backup: {e}")
                    break
        elif project_quota_exhausted:
            logger.info("[LLMRouter] Skipping Gemini Backup because project-level quota was exhausted on Primary.")

        # ----------------------------------------------------------------------
        # PRIORITY 3: OpenAI Fallback (OPENAI_API_KEY)
        # ----------------------------------------------------------------------
        if settings.OPENAI_API_KEY:
            try:
                openai_model = settings.OPENAI_MODEL or ("gpt-4o" if task_type == "high_reasoning" else "gpt-4o-mini")
                logger.info(f"[LLMRouter] Priority 3: Dispatching to OpenAI Fallback ({openai_model}).")
                res = await self._execute_with_backoff(
                    call_fn=lambda: openai_client.generate(
                        prompt=prompt,
                        system=effective_system,
                        model=openai_model,
                        temperature=temperature,
                        format_json=format_json,
                        **kwargs
                    ),
                    provider_name="openai_fallback",
                    model_name=openai_model,
                    max_retries=2
                )
                res["text"] = sanitize_em_dashes(res["text"])
                if format_json:
                    res["json"] = self._extract_json_payload(res["text"])
                return res

            except Exception as e:
                logger.error(f"[LLMRouter] OpenAI Fallback failed: {e}")
                provider_errors.append(f"OpenAI: {e}")

        # If all providers failed or are unconfigured
        error_summary = " | ".join(provider_errors) if provider_errors else "No valid API keys configured."
        raise RuntimeError(f"All configured LLM providers failed. Summary: {error_summary}")

# Singleton instance
llm_router = LLMRouter()
