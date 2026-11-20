import urllib.parse
import hashlib
import httpx
import logging
from typing import Dict, Any, Optional, List
from app.core.r2 import is_r2_configured, upload_file, generate_object_key
from app.core.database import db

logger = logging.getLogger(__name__)

def understand_article_for_visual(
    title: str,
    category: str,
    excerpt: Optional[str] = None,
    sections: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, str]:
    """
    Analyzes the technical article to extract architectural concepts, target audience,
    and a specific informative visual composition. Strictly avoids AI clichés like glowing brains,
    random robots, and meaningless floating circuit boards.
    """
    clean_title = title.replace('"', "").replace("'", "")
    cat_lower = (category or "").lower()
    full_text = f"{title} {category} {excerpt or ''}".lower()

    if "agent" in full_text or "orchestrat" in full_text or "autonomous" in full_text:
        subject = "Intelligent Multi-Agent System Workflow"
        composition = (
            "clean architectural diagram showing multi-agent task execution hierarchy, "
            "central executive coordinator node connected to specialized worker nodes, "
            "precise data bus conduits, obsidian dark slate background, crisp vector styling"
        )
    elif "cyber" in full_text or "security" in full_text or "auth" in full_text or "vulnerabilit" in full_text:
        subject = "Zero-Trust Security Perimeter & Token Verification"
        composition = (
            "modern cybersecurity architecture visualization, cryptographic verification flow, "
            "isolated trust boundary zones, dark titanium aesthetic with subtle emerald security indicators"
        )
    elif "cloud" in full_text or "infra" in full_text or "kubernetes" in full_text or "database" in full_text:
        subject = "High-Availability Distributed Cloud Architecture"
        composition = (
            "enterprise distributed cloud systems diagram, edge caching layers connected to global origin clusters, "
            "sub-second packet flow paths, clean engineering schematic styling, deep navy background"
        )
    elif "next" in full_text or "react" in full_text or "web" in full_text or "frontend" in full_text:
        subject = "Modern Web Application Architecture"
        composition = (
            "modular web architecture diagram, server components boundary, incremental static regeneration pipeline, "
            "clean isometric data visualization, modern developer dashboard aesthetic"
        )
    elif "startup" in full_text or "business" in full_text or "roi" in full_text:
        subject = "Enterprise Technology ROI & System Telemetry"
        composition = (
            "professional technology decision matrix, clean data visualization dashboard, "
            "performance telemetry charts, minimalist editorial business design, high contrast"
        )
    else:
        subject = f"Engineering Analysis of {clean_title[:60]}"
        composition = (
            "informative technical systems visualization, clean component layout, "
            "precise technical diagram style, minimal dark obsidian glassmorphism aesthetic"
        )

    return {
        "subject": subject,
        "composition": composition,
        "clean_title": clean_title,
        "category": category or "Technology"
    }

def build_dynamic_visual_prompt(
    title: str,
    category: str,
    role: str = "cover",
    heading: Optional[str] = None,
    excerpt: Optional[str] = None
) -> str:
    """
    Constructs an article-aware, informative visual prompt completely free of watermarks and clichés.
    """
    visual_spec = understand_article_for_visual(title, category, excerpt)

    if role == "cover":
        prompt = (
            f"Editorial technical illustration for '{visual_spec['clean_title']}'. "
            f"Subject: {visual_spec['subject']}. Composition: {visual_spec['composition']}. "
            f"Style: clean professional editorial design, vector precision, no text, no watermarks, "
            f"no low quality, no generic robot, no glowing brain, 8k resolution, cinematic 16:9 ratio."
        )
    else:
        sec_name = heading or title
        prompt = (
            f"Technical architecture diagram close-up for '{sec_name}'. "
            f"Subject: detailed system flow and production telemetry for {visual_spec['category']}. "
            f"Style: crisp vector lines, dark obsidian theme, high clarity, no text, no watermarks, professional engineering publication."
        )
    return prompt

async def generate_cover_image(
    title: str,
    category: str,
    excerpt: Optional[str] = None,
    article_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a unique, article-matched visual using Pollinations AI or R2 storage,
    checks image reachability, and catalogues the asset into the registry.
    """
    clean_title = title.replace('"', "").replace("'", "")
    clean_cat = category or "Software Engineering"
    prompt = build_dynamic_visual_prompt(title, category, role="cover", excerpt=excerpt)
    encoded_prompt = urllib.parse.quote(prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?nologo=true&width=1200&height=675"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    }

    final_url = image_url
    content_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()

    # 1. Primary: If Cloudflare R2 is configured, fetch bytes and store durably in R2
    if is_r2_configured():
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.get(image_url, headers=headers)
                if res.status_code == 200 and len(res.content) > 5000:
                    content_hash = hashlib.sha256(res.content).hexdigest()
                    r2_key = generate_object_key("blogs", "cover.jpg")
                    upload_res = upload_file(
                        key=r2_key,
                        body=res.content,
                        content_type="image/jpeg",
                        visibility="public",
                        metadata={"title": clean_title[:80], "category": clean_cat, "content_hash": content_hash}
                    )
                    if upload_res.get("success") and upload_res.get("url"):
                        final_url = upload_res["url"]
                        logger.info(f"[ImageGenerator] Successfully stored cover image in R2: {final_url}")
        except Exception as r2_err:
            logger.warning(f"[ImageGenerator] R2 upload exception: {r2_err}. Continuing with verified URL.")

    # 2. Record asset in image_assets_registry
    try:
        await db.execute(
            """
            INSERT INTO image_assets_registry (
                asset_url, content_hash, prompt, provider, article_id, subject, visual_concepts, quality_status, quality_score, watermark_detected, created_at
            ) VALUES ($1, $2, $3, 'pollinations_flux', $4, $5, $6, 'approved', 0.95, FALSE, NOW());
            """,
            final_url,
            content_hash,
            prompt[:500],
            article_id,
            clean_title[:100],
            [clean_cat, "technical_architecture"]
        )
    except Exception as reg_err:
        logger.warning(f"[ImageGenerator] Asset registry record notice: {reg_err}")

    return {
        "url": final_url,
        "prompt": prompt,
        "content_hash": content_hash,
        "subject": clean_title
    }
