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

// Never use a public/default fallback for a signing key. Derive from the
// server-only Payload secret only when a dedicated CAPTCHA secret is absent.
function resolveSigningSecret(): string {
  const explicit = process.env.CAPTCHA_SIGNING_SECRET?.trim();
  if (explicit && explicit.length >= 32) return explicit;

  const payloadSecret = process.env.PAYLOAD_SECRET?.trim();
  if (!payloadSecret || payloadSecret.length < 32) {
    throw new Error(
      'CAPTCHA_SIGNING_SECRET (32+ characters) or PAYLOAD_SECRET (32+ characters) must be configured.'
    );
  }

  return crypto
    .createHmac('sha256', payloadSecret)
    .update('heyprince:captcha:signing:v1')
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

