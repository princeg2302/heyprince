import crypto from 'crypto';

/**
 * Client for delegating AI operations from Next.js to the dedicated Python AI service
 * running on the VPS. Uses HMAC-SHA256 authentication with timestamp replay protection.
 */

export interface AiBackendResponse<T = any> {
  success: boolean;
  ok?: boolean;
  data?: T;
  error?: string;
  source?: 'python' | 'local_fallback';
}

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || '';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || '';

/**
 * Checks whether the Python AI Backend is configured in the environment.
 */
export function isAiBackendEnabled(): boolean {
  return Boolean(AI_BACKEND_URL && AI_SERVICE_SECRET);
}

/**
 * Calls an endpoint on the Python AI Backend with HMAC authentication.
 */
export async function callAiBackend<T = any>(
  endpoint: string,
  payload: Record<string, any>
): Promise<AiBackendResponse<T>> {
  if (!isAiBackendEnabled()) {
    return {
      success: false,
      error: 'AI_BACKEND_URL or AI_SERVICE_SECRET is not configured',
      source: 'local_fallback',
    };
  }

  const cleanBase = AI_BACKEND_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${cleanBase}${cleanEndpoint}`;

  const bodyStr = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', AI_SERVICE_SECRET)
    .update(`${timestamp}:${bodyStr}`)
    .digest('hex');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for deep LLM generation

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Signature': signature,
        'X-AI-Timestamp': timestamp,
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'User-Agent': 'HeyPrince-NextJS-Client/1.0',
      },
      body: bodyStr,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        ok: false,
        error: `Python AI backend HTTP ${res.status}: ${errText}`,
        source: 'python',
      };
    }

    const data = await res.json();
    return {
      success: true,
      ok: true,
      data,
      source: 'python',
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error reaching Python AI backend: ${err?.message || String(err)}`,
      source: 'local_fallback',
    };
  }
}

