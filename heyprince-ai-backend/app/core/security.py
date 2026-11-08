import hmac
import hashlib
import time
from fastapi import Request, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from app.core.config import settings

X_SIGNATURE = APIKeyHeader(name="X-Signature", auto_error=False)
X_TIMESTAMP = APIKeyHeader(name="X-Timestamp", auto_error=False)

def compute_hmac(secret: str, message: str) -> str:
    return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()

async def verify_internal_auth(request: Request):
    """
    Validates machine-to-machine HMAC signature from Next.js backend.
    """
    if settings.DEBUG and not settings.AI_SERVICE_SECRET:
        return True

    signature = request.headers.get("X-Signature")
    timestamp = request.headers.get("X-Timestamp")
    
    # Optional Bearer Token fallback
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "").strip()
        if token == settings.AI_SERVICE_SECRET:
            return True

    if not signature or not timestamp:
        raise HTTPException(status_code=401, detail="Missing authentication signature or timestamp headers")

    try:
        req_time = int(timestamp)
        now = int(time.time() * 1000)
        # 5 minute window for clock drift & replay protection
        if abs(now - req_time) > 300_000:
            raise HTTPException(status_code=401, detail="Request expired or clock drift exceeded 300s")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp header format")

    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8") if body_bytes else ""
    path = request.url.path
    method = request.method

    message = f"{method}:{path}:{timestamp}:{body_str}"
    expected_sig = compute_hmac(settings.AI_SERVICE_SECRET, message)

    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=403, detail="Invalid request signature verification failed")

    return True

