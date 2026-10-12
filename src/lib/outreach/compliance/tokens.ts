import crypto from 'crypto';

const SECRET = process.env.PAYLOAD_SECRET || 'heyprince-outreach-hmac-secret-token-key-2026';

export interface UnsubscribePayload {
  email: string;
  businessId: string;
  timestamp: number;
}

/**
 * Creates a cryptographically signed, URL-safe HMAC-SHA256 unsubscribe token
 */
export function generateUnsubscribeToken(email: string, businessId: string): string {
  const normEmail = email.toLowerCase().trim();
  const payload: UnsubscribePayload = {
    email: normEmail,
    businessId,
    timestamp: Date.now(),
  };

  const json = JSON.stringify(payload);
  const dataB64 = Buffer.from(json).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET).update(dataB64).digest('base64url');

  return `${dataB64}.${hmac}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed unsubscribe token
 */
export function verifyUnsubscribeToken(token: string): { valid: boolean; payload?: UnsubscribePayload; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Malformed token format' };
    }

    const [dataB64, providedHmac] = parts;
    const expectedHmac = crypto.createHmac('sha256', SECRET).update(dataB64).digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const providedBuf = Buffer.from(providedHmac);
    const expectedBuf = Buffer.from(expectedHmac);

    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return { valid: false, error: 'Invalid token cryptographic signature' };
    }

    const decodedStr = Buffer.from(dataB64, 'base64url').toString('utf8');
    const payload = JSON.parse(decodedStr) as UnsubscribePayload;

    if (!payload.email || !payload.businessId) {
      return { valid: false, error: 'Missing required payload claims' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Token verification exception' };
  }
}

