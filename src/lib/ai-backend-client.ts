import crypto from 'crypto';

export interface AiBackendResponse<T = any> {
  success: boolean;
  ok?: boolean;
  data?: T;
  error?: string;
  source?: 'python' | 'local_fallback';
}

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || '';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || '';

export function isAiBackendEnabled(): boolean {
  return Boolean(AI_BACKEND_URL && AI_SERVICE_SECRET);
}

/** Sign the exact method, URL path, millisecond timestamp and serialized body
 * expected by heyprince-ai-backend/app/core/security.py.
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
  const targetPath = new URL(targetUrl).pathname;
  const method = 'POST';
  const bodyStr = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', AI_SERVICE_SECRET)
    .update(`${method}:${targetPath}:${timestamp}:${bodyStr}`)
    .digest('hex');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'User-Agent': 'HeyPrince-NextJS-Client/1.0',
      },
      body: bodyStr,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        ok: false,
        error: `Python AI backend HTTP ${res.status}: ${errText}`,
        source: 'python',
      };
    }

    return {
      success: true,
      ok: true,
      data: await res.json(),
      source: 'python',
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error reaching Python AI backend: ${err?.message || String(err)}`,
      source: 'local_fallback',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
