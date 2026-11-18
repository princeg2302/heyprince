import urllib.parse
import hashlib
import httpx
import logging
from typing import Dict, Any, Optional
from app.core.r2 import is_r2_configured, upload_file, generate_object_key

logger = logging.getLogger(__name__)

def build_dynamic_visual_prompt(title: str, category: str, role: str = "cover", heading: Optional[str] = None) -> str:
    """
    Constructs a sophisticated, non-repetitive prompt for Pollinations AI.
    """
    clean_title = title.replace('"', "").replace("'", "")
    clean_cat = category or "Software Engineering"
    
    if role == "cover":
        concept = f"Editorial cinematic wide shot for technology publication about '{clean_title}'. {clean_cat} ecosystem, futuristic glassmorphism interface, deep navy and cyan ambient glow, 8k resolution, minimalist architectural render, volumetric lighting, unreal engine 5 style, octane render."
    else:
        sec_heading = heading or clean_title
        concept = f"Technical close-up visualization illustrating '{sec_heading}'. Abstract data flow, glowing microcircuits, clean telemetry, dark graphite aesthetic, sharp focal depth, high dynamic range."
        
    return concept

async def generate_cover_image(title: str, category: str) -> Dict[str, str]:
    """
    Generates a unique image URL using Pollinations AI and uploads to Cloudflare R2 if configured.
    """
    clean_title = title.replace('"', "").replace("'", "")
    clean_cat = category or "Software Engineering"
    prompt = build_dynamic_visual_prompt(title, category, role="cover")
    encoded_prompt = urllib.parse.quote(prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?nologo=true"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    }

    # 1. Primary: If Cloudflare R2 is configured, fetch bytes and store durably in R2
    if is_r2_configured():
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.get(image_url, headers=headers)
                if res.status_code == 200 and len(res.content) > 1000:
                    r2_key = generate_object_key("blogs", "cover.jpg")
                    upload_res = upload_file(
                        key=r2_key,
                        body=res.content,
                        content_type="image/jpeg",
                        visibility="public",
                        metadata={"title": clean_title[:80], "category": clean_cat}
                    )
                    if upload_res.get("success") and upload_res.get("url"):
                        logger.info(f"[ImageGenerator] Successfully stored cover image in R2: {upload_res['url']}")
                        return {"url": upload_res["url"], "prompt": prompt, "storage": "r2"}
        except Exception as r2_err:
            logger.warning(f"[ImageGenerator] R2 upload exception: {r2_err}. Falling back to verified dynamic URL.")

    # 2. Secondary verification of image reachability
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.head(image_url, headers=headers)
            if res.status_code == 200:
                logger.info("[ImageGenerator] Pollinations AI image verified: 200 OK")
                return {"url": image_url, "prompt": prompt}
    except Exception as e:
        logger.warning(f"[ImageGenerator] Head verification notice: {e}")
        
    return {"url": image_url, "prompt": prompt}
