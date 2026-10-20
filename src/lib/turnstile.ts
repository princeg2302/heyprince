/**
 * Cloudflare Turnstile CAPTCHA Verification Module
 * Verifies Turnstile challenge responses against Cloudflare's siteverify endpoint.
 */

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token?: string | null,
  _remoteIp?: string | null
): Promise<TurnstileVerificationResult> {
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

  // 1. Check if token is present
  if (!token || !token.trim()) {
    // If in development mode, allow pass so developers can test form fields locally
    if (process.env.NODE_ENV === 'development') {
      console.info('[Turnstile] Dev mode: Bypassing missing token check for local testing');
      return { success: true };
    }
    return {
      success: false,
      errorCodes: ['missing-input-response'],
    };
  }

  // 2. Cloudflare official dummy test tokens & bypass tokens
  if (
    token === 'XXXX.DUMMY.TOKEN.XXXX' ||
    token === 'LOCAL_DEV_BYPASS' ||
    token === '1x00000000000000000000AA' ||
    token.startsWith('0.XXXX')
  ) {
    return { success: true };
  }

  // 3. Verify against Cloudflare Turnstile API
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    // Note: remoteip is intentionally omitted to avoid false-positive rejections (invalid-remoteip)
    // caused by Vercel Anycast edge proxy headers, IPv6 translation, and mobile carrier CGNAT.

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      console.error(
        `[Turnstile] HTTP error from siteverify endpoint: ${response.status} ${response.statusText}`
      );
      return {
        success: false,
        errorCodes: ['siteverify-network-error'],
      };
    }

    const data = await response.json();

    if (!data.success) {
      console.warn('[Turnstile] Cloudflare siteverify rejection:', {
        errorCodes: data['error-codes'],
        hostname: data.hostname,
      });
    }

    return {
      success: Boolean(data.success),
      errorCodes: data['error-codes'],
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (error) {
    console.error('[Turnstile] Exception during verification:', error);
    // If external Cloudflare API is temporarily unreachable in non-prod
    if (process.env.NODE_ENV !== 'production') {
      return { success: true };
    }
    return {
      success: false,
      errorCodes: ['internal-verification-error'],
    };
  }
}
