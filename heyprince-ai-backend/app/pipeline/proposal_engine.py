import json
import logging
from typing import Dict, Any
from app.llm.router import llm_router

logger = logging.getLogger(__name__)

async def generate_lead_proposal(business_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates tailored, high-converting technical proposals and outreach pitches for a discovered business.
    """
    company_name = business_data.get("company_name") or business_data.get("name") or "Business"
    domain = business_data.get("domain", "")
    cms = business_data.get("cms", "WordPress")
    page_speed = business_data.get("page_speed", "sluggish mobile TTFB")

    system_prompt = (
        "You are Prince, a Senior Full-Stack Engineer & IT Consultant specializing in high-performance React/Next.js web architectures.\n"
        "Your task is to write personalized, non-generic, high-converting B2B outreach messages for an executive/founder.\n"
        "STRICT RULE: Never use em dashes (—) or en dashes (–). Use commas, colons, or standard hyphens.\n"
        "Return strictly valid JSON."
    )

    user_prompt = f"""
TARGET BUSINESS AUDIT:
Company: {company_name}
Domain: {domain}
Current Stack: {cms}
Observed Bottlenecks: {page_speed}

Generate a concise, professional cold proposal in JSON:
{{
  "emailSubject": "Quick observation regarding {company_name}'s web performance",
  "emailBody": "Hi [Name],\n\nI was looking into {domain} and noticed...",
  "whatsAppPitch": "Hi [Name], Prince here. Quick technical note on {company_name}'s site...",
  "recommendedService": "Next.js Frontend Architecture & Speed Optimization",
  "painPointsIdentified": ["High mobile checkout latency", "Monolithic CMS overhead"],
  "estimatedRoi": "40%+ reduction in TTFB and improved Google Core Web Vitals rankings"
}}
"""

    res = await llm_router.generate(prompt=user_prompt, system=system_prompt, format_json=True)
    try:
        data = json.loads(res["text"])
        return data
    except Exception:
        return {
            "emailSubject": f"Ideas to accelerate {company_name}'s digital experience",
            "emailBody": f"Hi,\n\nI analyzed {domain} and identified several frontend bottlenecks that can be accelerated with Next.js edge caching.",
            "recommendedService": "Headless Next.js Architecture"
        }

# Export alias for lead_scout and outreach router compatibility
async def generate_tailored_proposal(
    company_name: str,
    domain: str = "target-domain.com",
    notes: str = ""
) -> Dict[str, Any]:
    return await generate_lead_proposal({
        "company_name": company_name,
        "domain": domain,
        "notes": notes
    })

