import pg from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let pool: pg.Pool | null = null;
let supabaseClient: SupabaseClient | null = null;

export function getCaptchaSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muzbzrxwbanzsjvgtexp.supabase.co';
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      'sb_publishable_-_0Hj2xs4eK6DQ4CsKvmGw_QKyxgsnd';
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export function getCaptchaDbPool(): pg.Pool {
  if (!pool) {
    let uri =
      process.env.DATABASE_URI ||
      process.env.POSTGRES_URL ||
      'postgresql://postgres.muzbzrxwbanzsjvgtexp:HeyPrinceDB2026%21@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

    // Auto-route Supabase pooler from session mode (5432) to transaction mode (6543)
    if (uri.includes('pooler.supabase.com:5432')) {
      uri = uri.replace(':5432', ':6543');
    }

    pool = new pg.Pool({
      connectionString: uri,
      ssl:
        uri && !uri.includes('127.0.0.1') && !uri.includes('localhost')
          ? { rejectUnauthorized: false }
          : false,
      max: 8,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[Captcha DB Pool] Unexpected error:', err);
    });
  }
  return pool;
}

export async function queryCaptcha<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getCaptchaDbPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

export interface CaptchaSiteRecord {
  site_key: string;
  name: string;
  allowed_origins: string[];
  is_active: boolean;
  max_challenges_per_minute: number;
  challenge_ttl_seconds: number;
  proof_ttl_seconds: number;
}

// In-memory LRU cache for site configurations to avoid DB hits on every request
const siteCache = new Map<string, { site: CaptchaSiteRecord; expiresAt: number }>();

export async function getCaptchaSite(siteKey: string): Promise<CaptchaSiteRecord | null> {
  const cached = siteCache.get(siteKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.site;
  }

  // 1. Try Supabase HTTPS RPC
  try {
    const sb = getCaptchaSupabaseClient();
    const { data, error } = await sb.rpc('get_captcha_site_info', { p_site_key: siteKey });
    if (!error && data) {
      siteCache.set(siteKey, { site: data as CaptchaSiteRecord, expiresAt: Date.now() + 60000 });
      return data as CaptchaSiteRecord;
    }
  } catch (err) {
    // Ignore and fallback
  }

  // 2. Direct query fallback
  try {
    const rows = await queryCaptcha<CaptchaSiteRecord>(
      `SELECT * FROM captcha_sites WHERE site_key = $1 AND is_active = TRUE LIMIT 1;`,
      [siteKey]
    );

    if (rows && rows.length > 0) {
      siteCache.set(siteKey, { site: rows[0], expiresAt: Date.now() + 60000 }); // cache 1m
      return rows[0];
    }
  } catch (err) {
    console.error('[Captcha DB] Error loading site key:', err);
  }

  // Fallback for default site if database is initializing
  if (siteKey === 'hp_site_live_default') {
    return {
      site_key: 'hp_site_live_default',
      name: 'HeyPrince Web Engineering & Services',
      allowed_origins: ['heyprince.in', 'www.heyprince.in', 'localhost', '127.0.0.1'],
      is_active: true,
      max_challenges_per_minute: 60,
      challenge_ttl_seconds: 300,
      proof_ttl_seconds: 300,
    };
  }

  return null;
}

/**
 * Persists newly issued challenge to database
 */
export async function insertChallengeRecord(record: {
  id: string;
  siteKey: string;
  purpose: string;
  challengeType: string;
  question: string;
  answerHash: string;
  clientIpHash: string;
  difficulty: string;
  expiresAt: Date;
}): Promise<boolean> {
  // 1. Try Supabase HTTPS RPC
  try {
    const sb = getCaptchaSupabaseClient();
    const { data, error } = await sb.rpc('create_captcha_challenge', {
      p_id: record.id,
      p_site_key: record.siteKey,
      p_purpose: record.purpose,
      p_challenge_type: record.challengeType,
      p_question: record.question,
      p_answer_hash: record.answerHash,
      p_client_ip_hash: record.clientIpHash,
      p_difficulty: record.difficulty,
      p_expires_at: record.expiresAt.toISOString(),
    });

    if (!error && data?.success) {
      return true;
    }
  } catch (err) {
    // Fall back to direct query
  }

  // 2. Direct query fallback
  try {
    await queryCaptcha(
      `INSERT INTO captcha_challenges (
        id, site_key, purpose, challenge_type, question, answer_hash, client_ip_hash, difficulty, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        record.id,
        record.siteKey,
        record.purpose,
        record.challengeType,
        record.question,
        record.answerHash,
        record.clientIpHash,
        record.difficulty,
        record.expiresAt,
      ]
    );
    return true;
  } catch (err) {
    console.error('[Captcha DB] insertChallengeRecord error:', err);
    return false;
  }
}

/**
 * Atomically consumes a challenge in database via stored procedure
 */
export async function consumeChallengeInDb(
  challengeId: string,
  answerHash: string,
  clientIpHash: string,
  purpose: string,
  siteKey: string
): Promise<{ success: boolean; reason?: string; attemptsLeft?: number }> {
  // 1. Try Supabase HTTPS RPC
  try {
    const sb = getCaptchaSupabaseClient();
    const { data, error } = await sb.rpc('consume_captcha_challenge', {
      p_challenge_id: challengeId,
      p_answer_hash: answerHash,
      p_client_ip_hash: clientIpHash,
      p_purpose: purpose,
      p_site_key: siteKey,
    });

    if (!error && data && typeof data === 'object') {
      return {
        success: Boolean(data.success),
        reason: data.reason,
        attemptsLeft: data.attempts_left,
      };
    }
  } catch (err) {
    console.warn('[Captcha DB] Supabase RPC consumeChallenge error, trying pooler fallback:', err);
  }

  // 2. Direct query fallback
  try {
    const rows = await queryCaptcha<{ consume_captcha_challenge: any }>(
      `SELECT consume_captcha_challenge($1::UUID, $2, $3, $4, $5);`,
      [challengeId, answerHash, clientIpHash, purpose, siteKey]
    );

    const result = rows[0]?.consume_captcha_challenge;
    if (result && typeof result === 'object') {
      return {
        success: Boolean(result.success),
        reason: result.reason,
        attemptsLeft: result.attempts_left,
      };
    }

    return { success: false, reason: 'unknown_db_response' };
  } catch (err) {
    console.error('[Captcha DB] consumeChallengeInDb error:', err);
    return { success: false, reason: 'database_error' };
  }
}

/**
 * Stores a verification proof token hash
 */
export async function insertProofRecord(record: {
  id: string;
  proofTokenHash: string;
  siteKey: string;
  purpose: string;
  clientIpHash: string;
  expiresAt: Date;
}): Promise<boolean> {
  // 1. Try Supabase HTTPS RPC
  try {
    const sb = getCaptchaSupabaseClient();
    const { data, error } = await sb.rpc('create_captcha_proof', {
      p_id: record.id,
      p_proof_token_hash: record.proofTokenHash,
      p_site_key: record.siteKey,
      p_purpose: record.purpose,
      p_client_ip_hash: record.clientIpHash,
      p_expires_at: record.expiresAt.toISOString(),
    });

    if (!error && data?.success) {
      return true;
    }
  } catch (err) {
    // Fall back to direct query
  }

  // 2. Direct query fallback
  try {
    await queryCaptcha(
      `INSERT INTO captcha_proofs (
        id, proof_token_hash, site_key, purpose, client_ip_hash, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6);`,
      [
        record.id,
        record.proofTokenHash,
        record.siteKey,
        record.purpose,
        record.clientIpHash,
        record.expiresAt,
      ]
    );
    return true;
  } catch (err) {
    console.error('[Captcha DB] insertProofRecord error:', err);
    return false;
  }
}

/**
 * Atomically consumes a verification proof token hash
 */
export async function consumeProofInDb(
  proofTokenHash: string,
  purpose: string,
  siteKey: string
): Promise<{ success: boolean; reason?: string }> {
  // 1. Try Supabase HTTPS RPC
  try {
    const sb = getCaptchaSupabaseClient();
    const { data, error } = await sb.rpc('consume_captcha_proof', {
      p_proof_token_hash: proofTokenHash,
      p_purpose: purpose,
      p_site_key: siteKey,
    });

    if (!error && data && typeof data === 'object') {
      return {
        success: Boolean(data.success),
        reason: data.reason,
      };
    }
  } catch (err) {
    console.warn('[Captcha DB] Supabase RPC consumeProof error, trying pooler fallback:', err);
  }

  // 2. Direct query fallback
  try {
    const rows = await queryCaptcha<{ consume_captcha_proof: any }>(
      `SELECT consume_captcha_proof($1, $2, $3);`,
      [proofTokenHash, purpose, siteKey]
    );

    const result = rows[0]?.consume_captcha_proof;
    if (result && typeof result === 'object') {
      return {
        success: Boolean(result.success),
        reason: result.reason,
      };
    }

    return { success: false, reason: 'unknown_db_response' };
  } catch (err) {
    console.error('[Captcha DB] consumeProofInDb error:', err);
    return { success: false, reason: 'database_error' };
  }
}

/**
 * Checks and increments rate limit counter atomically
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  // 1. Try Supabase HTTPS RPC
  try {
    const sb = getCaptchaSupabaseClient();
    const { data, error } = await sb.rpc('check_captcha_rate_limit', {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (err) {
    // Fall back to direct query
  }

  // 2. Direct query fallback
  try {
    const rows = await queryCaptcha<{ check_captcha_rate_limit: boolean }>(
      `SELECT check_captcha_rate_limit($1, $2, $3);`,
      [key, maxRequests, windowSeconds]
    );
    return Boolean(rows[0]?.check_captcha_rate_limit);
  } catch (err) {
    console.warn('[Captcha DB] Rate limit check exception (failing open for single request):', err);
    // If DB has temporary issue, allow single request rather than total system lockup
    return true;
  }
}
