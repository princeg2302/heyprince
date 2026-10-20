import crypto from 'crypto';
import { CAPTCHA_CONFIG } from './config';

/**
 * Constant-time string equality check to prevent timing attacks
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Normalizes user answer: trim, lowercase, strip special characters, normalize numbers
 */
export function normalizeAnswer(rawAnswer: string | number): string {
  if (rawAnswer === null || rawAnswer === undefined) return '';
  let str = String(rawAnswer).trim().toLowerCase();

  // Strip leading/trailing punctuation and commas
  str = str.replace(/^[.,;:!?'"]+|[.,;:!?'"]+$/g, '');

  // Map written numbers (zero to twenty) to digits
  const wordToNumMap: Record<string, string> = {
    zero: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
    eleven: '11',
    twelve: '12',
    thirteen: '13',
    fourteen: '14',
    fifteen: '15',
    sixteen: '16',
    seventeen: '17',
    eighteen: '18',
    nineteen: '19',
    twenty: '20',
  };

  if (wordToNumMap[str]) {
    return wordToNumMap[str];
  }

  return str;
}

/**
 * Hash challenge answer with HMAC-SHA256 (Never store plaintext answers)
 */
export function hashAnswer(rawAnswer: string | number, secret = CAPTCHA_CONFIG.signingSecret): string {
  const normalized = normalizeAnswer(rawAnswer);
  return crypto.createHmac('sha256', secret).update(`ans:${normalized}`).digest('hex');
}

/**
 * Hash client IP address with HMAC-SHA256 to protect privacy while enabling rate-limiting
 */
export function hashClientIp(clientIp?: string | null, secret = CAPTCHA_CONFIG.signingSecret): string {
  const ip = clientIp?.trim() || 'unknown-client-ip';
  return crypto.createHmac('sha256', secret).update(`ip:${ip}`).digest('hex').slice(0, 32);
}

/**
 * Hash arbitrary token string (e.g. for storage in database)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Token payload structure for signed challenge tokens
 */
export interface ChallengeTokenPayload {
  cid: string; // Challenge ID
  pur: string; // Purpose (e.g. 'contact-form')
  site: string; // Site key
  ans: string; // Answer hash
  exp: number; // Expiration timestamp in ms
  ip: string; // Client IP hash
  iat: number; // Issued at timestamp in ms
}

/**
 * Signs challenge payload into a tamper-evident string
 */
export function signChallengeToken(
  payload: ChallengeTokenPayload,
  secret = CAPTCHA_CONFIG.signingSecret
): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verifies signed challenge token and returns parsed payload if authentic and not expired
 */
export function verifyChallengeToken(
  token: string,
  secret = CAPTCHA_CONFIG.signingSecret
): { valid: boolean; payload?: ChallengeTokenPayload; reason?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing_token' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'malformed_token' };
  }

  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url');

  if (!safeCompare(signature, expectedSignature)) {
    return { valid: false, reason: 'invalid_signature' };
  }

  try {
    const json = Buffer.from(data, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as ChallengeTokenPayload;

    if (!payload.cid || !payload.exp || !payload.ans) {
      return { valid: false, reason: 'invalid_payload_structure' };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, reason: 'token_expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'token_parse_error' };
  }
}

/**
 * Verification Proof Token payload structure
 */
export interface ProofTokenPayload {
  pid: string; // Proof ID (UUID)
  cid: string; // Original challenge ID
  pur: string; // Purpose
  site: string; // Site key
  ip: string; // Client IP hash
  iat: number; // Issued at (ms)
  exp: number; // Expires at (ms)
}

/**
 * Signs verification proof into a tamper-evident string
 */
export function signProofToken(
  payload: ProofTokenPayload,
  secret = CAPTCHA_CONFIG.signingSecret
): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`proof:${data}`).digest('base64url');
  return `cproof_${data}.${signature}`;
}

/**
 * Verifies verification proof token signature and expiration
 */
export function verifyProofTokenSignature(
  token: string,
  secret = CAPTCHA_CONFIG.signingSecret
): { valid: boolean; payload?: ProofTokenPayload; reason?: string } {
  if (!token || typeof token !== 'string' || !token.startsWith('cproof_')) {
    return { valid: false, reason: 'invalid_proof_format' };
  }

  const raw = token.slice('cproof_'.length);
  const parts = raw.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'malformed_proof_token' };
  }

  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', secret).update(`proof:${data}`).digest('base64url');

  if (!safeCompare(signature, expectedSignature)) {
    return { valid: false, reason: 'tampered_proof_signature' };
  }

  try {
    const json = Buffer.from(data, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as ProofTokenPayload;

    if (!payload.pid || !payload.exp || !payload.pur) {
      return { valid: false, reason: 'invalid_proof_structure' };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, reason: 'proof_expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'proof_parse_error' };
  }
}

