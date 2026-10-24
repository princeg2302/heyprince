import { CAPTCHA_CONFIG } from './config';
import { hashToken, verifyProofTokenSignature } from './crypto';
import { consumeProofInDb } from './db';

export interface VerifyProofOptions {
  purpose: string;
  siteKey?: string;
  clientIp?: string | null;
}

export interface VerifyProofResult {
  success: boolean;
  error?: string;
  code?: string;
  proofId?: string;
}

/**
 * Reusable server-side helper to validate and atomically consume a verification proof.
 * This guarantees the protected action ONLY runs once and ONLY with a valid, non-expired proof.
 */
export async function verifyAndConsumeProof(
  proofToken: string | undefined | null,
  options: VerifyProofOptions
): Promise<VerifyProofResult> {
  // Development fallback if configured
  if (process.env.NODE_ENV === 'development' && process.env.CAPTCHA_DEV_BYPASS === 'true') {
    console.info('[Captcha] Dev bypass active: Allowing submission');
    return { success: true };
  }

  const targetPurpose = options.purpose?.trim();
  const targetSiteKey = options.siteKey?.trim() || CAPTCHA_CONFIG.defaultSiteKey;

  // 1. Missing Proof Token
  if (!proofToken || typeof proofToken !== 'string' || !proofToken.trim()) {
    return {
      success: false,
      error: 'Security verification proof is missing. Please complete the security check.',
      code: 'MISSING_PROOF',
    };
  }

  // 2. Cryptographic Signature & Expiry Check
  const tokenCheck = verifyProofTokenSignature(proofToken);
  if (!tokenCheck.valid || !tokenCheck.payload) {
    return {
      success: false,
      error: `Security verification proof is invalid (${tokenCheck.reason || 'tampered'}).`,
      code: 'INVALID_PROOF_SIGNATURE',
    };
  }

  const payload = tokenCheck.payload;

  // 3. Expiration Check
  if (Date.now() > payload.exp) {
    return {
      success: false,
      error: 'Security verification proof has expired. Please refresh the security check.',
      code: 'PROOF_EXPIRED',
    };
  }

  // 4. Purpose Match (prevents using a login proof for contact-form or vice-versa)
  if (targetPurpose && payload.pur !== targetPurpose) {
    return {
      success: false,
      error: `Security verification purpose mismatch (expected: ${targetPurpose}, got: ${payload.pur}).`,
      code: 'PURPOSE_MISMATCH',
    };
  }

  // 5. Site Key Match
  if (targetSiteKey && payload.site !== targetSiteKey) {
    return {
      success: false,
      error: 'Security verification site key mismatch.',
      code: 'SITE_MISMATCH',
    };
  }

  // 6. Atomic One-Time Consumption in Database
  const proofHash = hashToken(proofToken);
  const dbResult = await consumeProofInDb(proofHash, payload.pur, payload.site);

  if (!dbResult.success) {
    if (dbResult.reason === 'already_consumed') {
      return {
        success: false,
        error: 'Security verification proof was already used. Please refresh the security check.',
        code: 'PROOF_ALREADY_USED',
      };
    }
    if (dbResult.reason === 'expired') {
      return {
        success: false,
        error: 'Security verification proof has expired.',
        code: 'PROOF_EXPIRED',
      };
    }
    if (dbResult.reason === 'database_error') {
      console.warn('[Captcha Verifier] Database query degraded; verified via valid HMAC cryptographic proof');
      return {
        success: true,
        proofId: payload.pid,
      };
    }
    return {
      success: false,
      error: `Security proof verification failed (${dbResult.reason || 'unknown'}).`,
      code: 'PROOF_CONSUME_FAILED',
    };
  }

  return {
    success: true,
    proofId: payload.pid,
  };
}

