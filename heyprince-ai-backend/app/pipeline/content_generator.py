import re
import json
import logging
import datetime
from typing import List, Dict, Any, Optional
from app.llm.router import llm_router
from app.core.database import db

logger = logging.getLogger(__name__)

DYNAMIC_BLOG_CATEGORIES = [
    "Artificial Intelligence",
    "Generative AI",
    "AI Agents and Automation",
    "Software Development",
    "Web Development",
    "Next.js and React",
    "Python and Backend Engineering",
    "Cybersecurity",
    "Cloud Computing",
    "Startups and Entrepreneurship",
    "Business Technology",
    "Digital Marketing",
    "SEO and Search Updates",
    "Productivity",
    "Emerging Technology",
    "Developer Tools",
    "Technology Careers",
    "Global Technology News",
    "Indian Technology Ecosystem",
    "Interesting Science and Innovation",
]

def slugify(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.lower())
    slug = re.sub(r"[-\s]+", "-", cleaned).strip("-")
    return slug[:75].rstrip("-")

def count_words(sections: List[Dict[str, Any]]) -> int:
    total = 0
    for s in sections:
        total += len(s.get("heading", "").split())
        for p in s.get("paragraphs", []):
            total += len(p.split())
        for b in s.get("bulletPoints", []):
            total += len(b.split())
        if s.get("quote"):
            total += len(s["quote"].split())
        if s.get("proTip"):
            total += len(s["proTip"].split())
    return total

def parse_json_from_llm(raw_text: str) -> Dict[str, Any]:
    try:
        return json.loads(raw_text)
    except Exception:
        # Check for fenced code block ```json ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        
        # Check first { and last }
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(raw_text[start : end + 1])
        raise ValueError("Could not extract valid JSON from LLM response")

async def generate_daily_post(
    news_items: List[Dict[str, Any]],
    custom_topic: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates an authoritative, 1,200-1,800+ word technical insight article adhering strictly to SEO standards,
    dynamic editorial category rotation, and anti-template originality rules.
    """
    sources_summary = "\n".join([
        f"- {item.get('title')} ({item.get('source', 'Tech Source')}) - {item.get('summary', '')[:200]}"
        for item in news_items[:8]
    ])

    # Pick dynamic category based on current day
    day_idx = datetime.datetime.now().day % len(DYNAMIC_BLOG_CATEGORIES)
    selected_category = DYNAMIC_BLOG_CATEGORIES[day_idx]

    topic_instruction = (
        f"DEEP-DIVE TOPIC: '{custom_topic}' (Editorial Category: {selected_category})"
        if custom_topic
        else f"LATEST INDUSTRY DISCOVERIES:\n{sources_summary}\n\nEditorial Focus Category: {selected_category}"
    )

    system_prompt = (
        "You are Prince, a Senior Full-Stack Engineer and IT Systems Architect writing for heyprince.in/insights.\n"
        "Your editorial voice is authoritative, deeply technical, practical, and clear.\n"
        "STRICT ORIGINALITY RULE: DO NOT use generic section headings like 'Section 1: The Core Development' or 'Introduction'. Every heading must be descriptive and specific to the exact topic.\n"
        "STRICT SEO LENGTH REQUIREMENT: The generated article MUST contain between 1,200 and 1,800+ total words across 5 to 6 deep sections.\n"
        "STRICT FORMATTING RULE: NEVER use em dashes (—) or en dashes (–) anywhere. Use colons, commas, semicolons, or standard hyphens.\n"
        "Never invent fake quotes or fictitious dates. Frame insights from engineering first principles.\n"
        "Return ONLY a valid JSON object matching the requested schema."
    )

    user_prompt = f"""
Analyze the following industry insights and craft an exhaustive, publication-grade engineering guide:

{topic_instruction}

JSON SCHEMA REQUIRED:
{{
  "title": "Clear, compelling, high-converting title without em dashes (50-70 characters)",
  "slug": "url-friendly-slug",
  "categoryName": "{selected_category}",
  "readMins": "6 min read",
  "excerpt": "Compelling 2-sentence executive summary emphasizing practical software architecture and business ROI.",
  "seoTitle": "SEO Page Title (under 60 chars)",
  "seoDescription": "Meta description optimized for Google CTR (145-155 chars)",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "sections": [
    {{
      "heading": "Original, topic-specific descriptive heading",
      "paragraphs": [
        "In-depth paragraph 1 breaking down the architectural paradigm with concrete technical precision...",
        "In-depth paragraph 2 detailing performance benchmarks, latency numbers, or real-world tradeoffs...",
        "In-depth paragraph 3 exploring concrete enterprise implementation patterns..."
      ],
      "bulletPoints": [
        "Key technical benchmark or production metric",
        "Actionable code or system configuration practice",
        "Edge-case risk and mitigation strategy"
      ],
      "quote": "A sharp, memorable architectural principle or rule of thumb",
      "proTip": "Pro-Tip: Actionable advice for full-stack developers implementing this pattern."
    }}
  ],
  "linkedinPost": "Engaging, high-converting LinkedIn post with hashtags and provocative engineering perspective."
}}
"""

    response = await llm_router.generate(
        prompt=user_prompt,
        system=system_prompt,
        format_json=True
    )

    parsed = parse_json_from_llm(response["text"])
    
    # Ensure word count satisfies SEO guidelines
    word_count = count_words(parsed.get("sections", []))
    logger.info(f"[ContentGenerator] Generated article '{parsed.get('title')}' with {word_count} words across {len(parsed.get('sections', []))} sections.")

    # Register into editorial registry (blog_topics_registry) if available
    try:
        topic_title = parsed.get("title", "")
        norm_title = re.sub(r"[^\w\s]", "", topic_title.lower()).strip()
        await db.execute(
            """
            INSERT INTO blog_topics_registry 
            (topic, normalized_topic, category, angle, target_audience, semantic_keywords, status, proposed_by, discovered_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'drafted', 'marcus_sterling', NOW())
            ON CONFLICT (normalized_topic) DO UPDATE SET updated_at = NOW();
            """,
            topic_title,
            norm_title,
            parsed.get("categoryName", selected_category),
            parsed.get("excerpt", "")[:250],
            "CTOs & Software Engineers",
            parsed.get("tags", []),
        )
        logger.info(f"[ContentGenerator] Registered topic in blog_topics_registry: '{topic_title}'")
    except Exception as reg_err:
        logger.debug(f"[ContentGenerator] Registry insert notice: {reg_err}")

    return parsed

# Export alias for news router compatibility
async def generate_deep_seo_article(
    topic_title: str,
    category: str = "Artificial Intelligence",
    source_url: str = ""
) -> Dict[str, Any]:
    return await generate_daily_post([], custom_topic=topic_title)

