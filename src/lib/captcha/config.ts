import crypto from 'crypto';

/**
 * Custom CAPTCHA Service Configuration
 * Production-ready settings with secure fallbacks
 */

export interface CaptchaConfig {
  signingSecret: string;
  defaultSiteKey: string;
  challengeTtlSeconds: number;
  proofTtlSeconds: number;
  maxAttemptsPerChallenge: number;
  minCompletionTimeMs: number;
  rateLimitWindowSeconds: number;
  maxChallengesPerIpPerWindow: number;
  maxVerificationsPerIpPerWindow: number;
}

// Derive a resilient, deterministic signing secret if CAPTCHA_SIGNING_SECRET is not explicitly provided
function resolveSigningSecret(): string {
  const explicit = process.env.CAPTCHA_SIGNING_SECRET;
  if (explicit && explicit.trim().length >= 32) {
    return explicit.trim();
  }

  // Derive from existing PAYLOAD_SECRET or DATABASE_URI as secondary stable entropy
  const seed =
    process.env.PAYLOAD_SECRET ||
    process.env.DATABASE_URI ||
    'heyprince-production-custom-captcha-secret-salt-2026';

  return crypto
    .createHmac('sha256', 'heyprince-captcha-engine')
    .update(seed)
    .digest('hex');
}

export const CAPTCHA_CONFIG: CaptchaConfig = {
  signingSecret: resolveSigningSecret(),
  defaultSiteKey:
    process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || 'hp_site_live_default',
  challengeTtlSeconds: 300, // 5 minutes
  proofTtlSeconds: 300, // 5 minutes to submit protected action
  maxAttemptsPerChallenge: 3,
  minCompletionTimeMs: 600, // Timing signal for bot mitigation
  rateLimitWindowSeconds: 60, // 1 minute
  maxChallengesPerIpPerWindow: 25,
  maxVerificationsPerIpPerWindow: 35,
};

