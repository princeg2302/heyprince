import logging
from typing import Optional, Dict, Any
from app.llm.ollama_client import ollama_client
from app.llm.gemini_client import gemini_client
from app.llm.sanitizer import sanitize_em_dashes, NO_EM_DASH_INSTRUCTION

logger = logging.getLogger(__name__)

class LLMRouter:
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        preferred_provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        format_json: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Routes inference between local PC Ollama and cloud Gemini.
        Applies automated no-em-dash rule and sanitization.
        """
        effective_system = f"{system}\n\n{NO_EM_DASH_INSTRUCTION}" if system else NO_EM_DASH_INSTRUCTION

        # 1. Attempt Local Ollama on PC if preferred or available
        if preferred_provider != "gemini":
            try:
                is_pc_online = await ollama_client.is_available()
                if is_pc_online:
                    logger.info("[LLMRouter] Local PC Ollama is online. Dispatching inference to local GPU.")
                    result = await ollama_client.generate(
                        prompt=prompt,
                        system=effective_system,
                        model=model,
                        temperature=temperature,
                        format_json=format_json,
                        **kwargs
                    )
                    result["text"] = sanitize_em_dashes(result["text"])
                    return result
                else:
                    logger.info("[LLMRouter] Local PC Ollama is unreachable. Falling back to Cloud Gemini.")
            except Exception as e:
                logger.warning(f"[LLMRouter] Ollama attempt failed: {e}. Falling back to Cloud Gemini.")

        # 2. Cloud Gemini Fallback
        logger.info("[LLMRouter] Dispatching inference to Cloud Gemini API.")
        result = await gemini_client.generate(
            prompt=prompt,
            system=effective_system,
            model=model if preferred_provider == "gemini" else None,
            temperature=temperature,
            format_json=format_json,
            **kwargs
        )
        result["text"] = sanitize_em_dashes(result["text"])
        return result

llm_router = LLMRouter()

# Export alias function for agent compatibility
async def route_llm_request(
    user_prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    **kwargs
) -> Dict[str, Any]:
    return await llm_router.generate(
        prompt=user_prompt,
        system=system_prompt,
        temperature=temperature,
        **kwargs
    )
