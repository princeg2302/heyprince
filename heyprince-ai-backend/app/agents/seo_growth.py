import logging
import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.llm.router import route_llm_request
from app.llm.sanitizer import sanitize_ai_output

logger = logging.getLogger(__name__)

class SeoGrowthAgent(BaseAgent):
    """
    Analyzes content opportunities, keyword intent, and internal linking strategies.
    """
    def __init__(self):
        super().__init__(name="seo_growth")

    async def execute(self, trigger: str = "scheduled", payload: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info(f"[{self.name}] Running SEO Growth & Semantic Optimization sweep")
        
        prompt = """You are an elite Technical SEO Strategist for HeyPrince (https://heyprince.in), an enterprise software consultancy.
Identify 3 high-impact keyword opportunities in modern web architecture (e.g., Next.js 16, AI Agents, Edge Compute, Database Optimization).
Return strict JSON with format:
{
  "opportunities": [
    {
      "keyword": "string",
      "search_intent": "informational | commercial | transactional",
      "difficulty": "low | medium | high",
      "proposed_title": "string",
      "rationale": "string"
    }
  ],
  "internal_linking_recommendation": "string",
  "summary": "string"
}
Ensure NO em-dashes (—) are used anywhere."""

        res = await route_llm_request(
            system_prompt="You are a Technical SEO Director. Return ONLY valid JSON.",
            user_prompt=prompt,
            temperature=0.4
        )
        
        raw_text = sanitize_ai_output(res.get("text", "{}"))
        try:
            clean_json_str = raw_text.strip()
            if clean_json_str.startswith("```json"):
                clean_json_str = clean_json_str[7:]
            if clean_json_str.startswith("```"):
                clean_json_str = clean_json_str[3:]
            if clean_json_str.endswith("```"):
                clean_json_str = clean_json_str[:-3]
            data = json.loads(clean_json_str.strip())
        except Exception as e:
            logger.warning(f"Failed to parse SEO growth JSON: {e}")
            data = {
                "opportunities": [],
                "summary": "SEO opportunity sweep completed with baseline heuristics."
            }
            
        data["model_used"] = res.get("model_used")
        data["provider"] = res.get("provider")
        return data

