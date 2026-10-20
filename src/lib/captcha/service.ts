import crypto from 'crypto';
import { CAPTCHA_CONFIG } from './config';
import {
  hashAnswer,
  hashClientIp,
  hashToken,
  signChallengeToken,
  verifyChallengeToken,
  signProofToken,
  ChallengeTokenPayload,
} from './crypto';
import { generateChallenge, ChallengeDifficulty } from './challenges';
import {
  getCaptchaSite,
  insertChallengeRecord,
  consumeChallengeInDb,
  insertProofRecord,
  checkRateLimit,
} from './db';

export interface CreateChallengeOptions {
  siteKey?: string;
  purpose: string;
  difficulty?: ChallengeDifficulty;
  clientIp?: string | null;
  origin?: string | null;
}

export interface CreateChallengeResult {
  success: boolean;
  challengeId?: string;
  question?: string;
  type?: string;
  signedToken?: string;
  expiresAt?: string;
  ttlSeconds?: number;
  audioPrompt?: string;
  error?: string;
  code?: string;
}

export interface VerifyChallengeOptions {
  challengeId: string;
  answer: string | number;
  signedToken: string;
  purpose: string;
  siteKey?: string;
  clientIp?: string | null;
  elapsedMs?: number;
}

export interface VerifyChallengeResult {
  success: boolean;
  verificationProof?: string;
  expiresAt?: string;
  ttlSeconds?: number;
  error?: string;
  code?: string;
  attemptsLeft?: number;
}

/**
 * Validates whether an incoming HTTP Origin or Referer matches the site's allowed domains
 */
export function isOriginAllowed(originOrReferer: string | null | undefined, allowedOrigins: string[]): boolean {
  if (!originOrReferer) return true; // Direct same-origin requests often omit origin header
  try {
    let hostname = originOrReferer.trim().toLowerCase();
    if (hostname.includes('://')) {
      const url = new URL(hostname);
      hostname = url.hostname;
    } else {
      hostname = hostname.split(':')[0].split('/')[0];
    }

    // Allow localhost / 127.0.0.1 for local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    return allowedOrigins.some((allowed) => {
      const cleanAllowed = allowed.toLowerCase().trim().replace(/^https?:\/\//, '').split(':')[0].split('/')[0];
      return hostname === cleanAllowed || hostname.endsWith(`.${cleanAllowed}`);
    });
  } catch {
    return false;
  }
}

/**
 * Generate a new CAPTCHA challenge
 */
export async function createCaptchaChallenge(options: CreateChallengeOptions): Promise<CreateChallengeResult> {
  const siteKey = options.siteKey?.trim() || CAPTCHA_CONFIG.defaultSiteKey;
  const purpose = options.purpose?.trim() || 'contact-form';

  // 1. Verify Site Key & Active Status
  const site = await getCaptchaSite(siteKey);
  if (!site || !site.is_active) {
    return {
      success: false,
      error: 'Invalid or inactive CAPTCHA site key.',
      code: 'INVALID_SITE_KEY',
    };
  }

  // 2. Validate Origin if provided
  if (options.origin && !isOriginAllowed(options.origin, site.allowed_origins)) {
    return {
      success: false,
      error: 'Domain not authorized for this CAPTCHA site key.',
      code: 'DOMAIN_NOT_ALLOWED',
    };
  }

  // 3. Client Rate Limiting
  const ipHash = hashClientIp(options.clientIp);
  const rateLimitKey = `rate:chal:${ipHash}`;
  const allowed = await checkRateLimit(
    rateLimitKey,
    site.max_challenges_per_minute || CAPTCHA_CONFIG.maxChallengesPerIpPerWindow,
    CAPTCHA_CONFIG.rateLimitWindowSeconds
  );

  if (!allowed) {
    return {
      success: false,
      error: 'Rate limit exceeded. Too many challenge requests. Please wait a moment.',
      code: 'RATE_LIMIT_EXCEEDED',
    };
  }

  // 4. Generate Random Challenge
  const difficulty = options.difficulty || 'easy';
  const challenge = generateChallenge(difficulty);
  const challengeId = crypto.randomUUID();
  const answerHash = hashAnswer(challenge.answer);

  const ttlSeconds = site.challenge_ttl_seconds || CAPTCHA_CONFIG.challengeTtlSeconds;
  const expiresAtMs = Date.now() + ttlSeconds * 1000;
  const expiresAtDate = new Date(expiresAtMs);

  // 5. Sign Token (Stateless cryptographic verification layer)
  const tokenPayload: ChallengeTokenPayload = {
    cid: challengeId,
    pur: purpose,
    site: siteKey,
    ans: answerHash,
    exp: expiresAtMs,
    ip: ipHash,
    iat: Date.now(),
  };

  const signedToken = signChallengeToken(tokenPayload);

  // 6. Record challenge in database for atomic one-time use verification
  await insertChallengeRecord({
    id: challengeId,
    siteKey,
    purpose,
    challengeType: challenge.type,
    question: challenge.question,
    answerHash,
    clientIpHash: ipHash,
    difficulty,
    expiresAt: expiresAtDate,
  });

  return {
    success: true,
    challengeId,
    question: challenge.question,
    type: challenge.type,
    signedToken,
    expiresAt: expiresAtDate.toISOString(),
    ttlSeconds,
    audioPrompt: challenge.audioPrompt,
  };
}

/**
 * Verify a completed CAPTCHA challenge and issue a short-lived verification proof
 */
export async function verifyCaptchaChallenge(options: VerifyChallengeOptions): Promise<VerifyChallengeResult> {
  const siteKey = options.siteKey?.trim() || CAPTCHA_CONFIG.defaultSiteKey;
  const purpose = options.purpose?.trim() || 'contact-form';

  // 1. Validate Input Presence
  if (!options.challengeId || options.answer === undefined || options.answer === null || !options.signedToken) {
    return {
      success: false,
      error: 'Missing required challenge parameters.',
      code: 'MISSING_PARAMETERS',
    };
  }

  // 2. Validate Signed Token Cryptographically
  const tokenCheck = verifyChallengeToken(options.signedToken);
  if (!tokenCheck.valid || !tokenCheck.payload) {
    return {
      success: false,
      error: `Security token verification failed (${tokenCheck.reason || 'tampered'}).`,
      code: 'INVALID_TOKEN',
    };
  }

  const payload = tokenCheck.payload;

  // 3. Challenge ID, Purpose, Site Binding Verification
  if (payload.cid !== options.challengeId) {
    return {
      success: false,
      error: 'Challenge ID does not match token payload.',
      code: 'CHALLENGE_MISMATCH',
    };
  }

  if (payload.pur !== purpose) {
    return {
      success: false,
      error: 'Challenge purpose mismatch.',
      code: 'PURPOSE_MISMATCH',
    };
  }

  if (payload.site !== siteKey) {
    return {
      success: false,
      error: 'Challenge site key mismatch.',
      code: 'SITE_MISMATCH',
    };
  }

  // 4. Expiration Check
  if (Date.now() > payload.exp) {
    return {
      success: false,
      error: 'Challenge has expired. Please refresh the security check.',
      code: 'CHALLENGE_EXPIRED',
    };
  }

  // 5. Bot Speed / Timing Signal
  if (options.elapsedMs !== undefined && options.elapsedMs < CAPTCHA_CONFIG.minCompletionTimeMs) {
    return {
      success: false,
      error: 'Submission was too fast. Please verify you are human.',
      code: 'SUBMISSION_TOO_FAST',
    };
  }

  // 6. Rate Limit Verification Attempts
  const ipHash = hashClientIp(options.clientIp);
  const verifyRateKey = `rate:ver:${ipHash}`;
  const rateAllowed = await checkRateLimit(
    verifyRateKey,
    CAPTCHA_CONFIG.maxVerificationsPerIpPerWindow,
    CAPTCHA_CONFIG.rateLimitWindowSeconds
  );

  if (!rateAllowed) {
    return {
      success: false,
      error: 'Too many verification attempts. Please wait a minute before retrying.',
      code: 'RATE_LIMIT_EXCEEDED',
    };
  }

  // 7. Compute User Answer Hash
  const submittedAnswerHash = hashAnswer(options.answer);

  // 8. Atomic Consumption via Stored Procedure
  const dbResult = await consumeChallengeInDb(
    options.challengeId,
    submittedAnswerHash,
    ipHash,
    purpose,
    siteKey
  );

  if (!dbResult.success) {
    if (dbResult.reason === 'incorrect_answer') {
      return {
        success: false,
        error: 'Incorrect answer. Please try again.',
        code: 'INCORRECT_ANSWER',
        attemptsLeft: dbResult.attemptsLeft,
      };
    }
    if (dbResult.reason === 'already_consumed') {
      return {
        success: false,
        error: 'Challenge has already been consumed. Please request a new challenge.',
        code: 'CHALLENGE_ALREADY_USED',
      };
    }
    if (dbResult.reason === 'too_many_attempts') {
      return {
        success: false,
        error: 'Too many failed attempts. Please request a new challenge.',
        code: 'TOO_MANY_ATTEMPTS',
      };
    }
    return {
      success: false,
      error: `Challenge verification failed (${dbResult.reason || 'invalid'}).`,
      code: 'VERIFICATION_FAILED',
    };
  }

  // 9. Generate Signed Verification Proof Token (Valid for 5 minutes)
  const site = await getCaptchaSite(siteKey);
  const proofTtl = site?.proof_ttl_seconds || CAPTCHA_CONFIG.proofTtlSeconds;
  const proofId = crypto.randomUUID();
  const proofExpiresAtMs = Date.now() + proofTtl * 1000;
  const proofExpiresAtDate = new Date(proofExpiresAtMs);

  const proofToken = signProofToken({
    pid: proofId,
    cid: options.challengeId,
    pur: purpose,
    site: siteKey,
    ip: ipHash,
    iat: Date.now(),
    exp: proofExpiresAtMs,
  });

  const proofHash = hashToken(proofToken);

  // Store in database for atomic one-time consumption by the protected endpoint
  await insertProofRecord({
    id: proofId,
    proofTokenHash: proofHash,
    siteKey,
    purpose,
    clientIpHash: ipHash,
    expiresAt: proofExpiresAtDate,
  });

  return {
    success: true,
    verificationProof: proofToken,
    expiresAt: proofExpiresAtDate.toISOString(),
    ttlSeconds: proofTtl,
  };
}

