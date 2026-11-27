import hmac
import hashlib
import time
from fastapi import Request, HTTPException
from app.core.config import settings

def compute_hmac(secret: str, message: str) -> str:
    return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()

async def verify_internal_auth(request: Request):
    """Validate signed machine-to-machine requests from the Next.js backend."""
    secret = settings.AI_SERVICE_SECRET
    if settings.DEBUG and not secret:
        return True
    if not secret:
        raise HTTPException(status_code=503, detail="Internal service authentication is not configured")

    signature = request.headers.get("X-Signature")
    timestamp = request.headers.get("X-Timestamp")

    # Optional exact Bearer secret fallback for controlled internal callers.
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):].strip()
        if hmac.compare_digest(token, secret):
            return True

    if not signature or not timestamp:
        raise HTTPException(status_code=401, detail="Missing authentication signature or timestamp headers")

    try:
        req_time = int(timestamp)
        now = int(time.time() * 1000)
        if abs(now - req_time) > 300_000:
            raise HTTPException(status_code=401, detail="Request expired or clock drift exceeded 300s")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp header format")

    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8") if body_bytes else ""
    message = f"{request.method}:{request.url.path}:{timestamp}:{body_str}"
    expected_sig = compute_hmac(secret, message)

    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=403, detail="Invalid request signature verification failed")

    return True
