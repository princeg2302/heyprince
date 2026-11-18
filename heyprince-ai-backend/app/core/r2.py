import os
import time
import uuid
import logging
from typing import Optional, Dict, Any, Union
from app.core.config import settings

logger = logging.getLogger(__name__)

# Permitted folder organization
R2_FOLDERS = [
    "blogs",
    "ai-generated",
    "company/avatars",
    "company/assets",
    "documents/proposals",
    "documents/reports",
    "clients",
    "media-vault",
    "projects"
]

def is_r2_configured() -> bool:
    """Checks whether all necessary Cloudflare R2 credentials are set."""
    return bool(
        settings.R2_ACCOUNT_ID and
        settings.R2_ACCESS_KEY_ID and
        settings.R2_SECRET_ACCESS_KEY and
        settings.R2_BUCKET_NAME
    )

def get_r2_endpoint() -> str:
    """Returns the S3 API endpoint for the configured Cloudflare R2 bucket."""
    if settings.R2_S3_ENDPOINT and settings.R2_S3_ENDPOINT.strip():
        return settings.R2_S3_ENDPOINT.rstrip('/')
    account_id = settings.R2_ACCOUNT_ID or ""
    return f"https://{account_id}.r2.cloudflarestorage.com"

def get_r2_public_base_url() -> str:
    """Returns the public base URL for accessing uploaded assets."""
    custom = (settings.R2_PUBLIC_BASE_URL or "").strip()
    if custom and ".r2.cloudflarestorage.com" not in custom:
        return custom.rstrip('/')
    return "https://heyprince.in/api/media"

def get_public_url(key: str) -> str:
    """Constructs the public URL for an object key."""
    clean_key = key.lstrip('/')
    base_url = get_r2_public_base_url()
    return f"{base_url}/{clean_key}"

def generate_object_key(folder: str, filename: str) -> str:
    """Generates a collision-resistant, sanitized object key."""
    clean_folder = folder.strip('/')
    clean_name = "".join(c for c in filename if c.isalnum() or c in "._-")
    timestamp = int(time.time() * 1000)
    rand_id = uuid.uuid4().hex[:8]
    return f"{clean_folder}/{timestamp}-{rand_id}-{clean_name}"

def _get_s3_client():
    """Returns a boto3 S3 client for Cloudflare R2."""
    try:
        import boto3
        from botocore.config import Config

        endpoint = get_r2_endpoint()
        client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"}
            )
        )
        return client
    except ImportError:
        logger.warning("[R2] boto3 library not installed in Python environment.")
        return None

def upload_file(
    key: str,
    body: Union[bytes, str],
    content_type: str = "image/jpeg",
    visibility: str = "public",
    metadata: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Uploads file bytes to Cloudflare R2."""
    if not is_r2_configured():
        return {
            "success": False,
            "error": "Cloudflare R2 is not configured in settings."
        }

    client = _get_s3_client()
    if client is None:
        return {
            "success": False,
            "error": "boto3 is not available in Python environment."
        }

    data_bytes = body.encode("utf-8") if isinstance(body, str) else body
    bucket = settings.R2_BUCKET_NAME

    s3_metadata = {
        "visibility": visibility,
        "uploaded_at": str(int(time.time()))
    }
    if metadata:
        s3_metadata.update(metadata)

    try:
        response = client.put_object(
            Bucket=bucket,
            Key=key,
            Body=data_bytes,
            ContentType=content_type,
            Metadata=s3_metadata
        )

        public_url = get_public_url(key) if visibility == "public" else None

        return {
            "success": True,
            "key": key,
            "url": public_url,
            "bucket": bucket,
            "etag": response.get("ETag"),
            "visibility": visibility,
            "size_bytes": len(data_bytes)
        }
    except Exception as e:
        logger.error(f"[R2] Failed to upload object {key}: {e}")
        return {
            "success": False,
            "key": key,
            "error": str(e)
        }

def download_file(key: str) -> Dict[str, Any]:
    """Downloads an object from Cloudflare R2."""
    if not is_r2_configured():
        return {"success": False, "error": "Cloudflare R2 is not configured."}

    client = _get_s3_client()
    if client is None:
        return {"success": False, "error": "boto3 is not available."}

    try:
        response = client.get_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
        body_bytes = response["Body"].read()
        return {
            "success": True,
            "body": body_bytes,
            "content_type": response.get("ContentType"),
            "metadata": response.get("Metadata")
        }
    except Exception as e:
        logger.error(f"[R2] Failed to download object {key}: {e}")
        return {"success": False, "error": str(e)}

def delete_file(key: str) -> bool:
    """Deletes an object from Cloudflare R2."""
    if not is_r2_configured():
        return False

    client = _get_s3_client()
    if client is None:
        return False

    try:
        client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
        return True
    except Exception as e:
        logger.error(f"[R2] Failed to delete object {key}: {e}")
        return False

def file_exists(key: str) -> bool:
    """Checks whether an object exists in Cloudflare R2."""
    if not is_r2_configured():
        return False

    client = _get_s3_client()
    if client is None:
        return False

    try:
        client.head_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
        return True
    except Exception:
        return False

def generate_presigned_download_url(key: str, expires_in: int = 3600) -> Optional[str]:
    """Generates a presigned GET URL for downloading private assets."""
    if not is_r2_configured():
        return None

    client = _get_s3_client()
    if client is None:
        return None

    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
            ExpiresIn=expires_in
        )
        return url
    except Exception as e:
        logger.error(f"[R2] Failed to generate presigned download URL for {key}: {e}")
        return None
