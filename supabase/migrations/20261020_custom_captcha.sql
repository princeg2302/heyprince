-- ============================================================================
-- Production-Ready Custom CAPTCHA Service Schema — Supabase PostgreSQL
-- Safe, Idempotent DDL with Atomic RPC Functions and RLS Security
-- ============================================================================

-- 1. Sites Registry Table (Multi-Site Support)
CREATE TABLE IF NOT EXISTS captcha_sites (
  site_key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  allowed_origins TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_challenges_per_minute INT NOT NULL DEFAULT 60,
  challenge_ttl_seconds INT NOT NULL DEFAULT 300,
  proof_ttl_seconds INT NOT NULL DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default site for HeyPrince portfolio & services
INSERT INTO captcha_sites (
  site_key, name, allowed_origins, is_active, max_challenges_per_minute, challenge_ttl_seconds, proof_ttl_seconds
)
VALUES (
  'hp_site_live_default',
  'HeyPrince Web Engineering & Services',
  ARRAY[
    'heyprince.in',
    'www.heyprince.in',
    'localhost:3000',
    '127.0.0.1:3000'
  ],
  TRUE,
  60,
  300,
  300
)
ON CONFLICT (site_key) DO UPDATE SET
  allowed_origins = EXCLUDED.allowed_origins,
  updated_at = NOW();

-- 2. Challenges Table (Short-lived, One-Time Use)
CREATE TABLE IF NOT EXISTS captcha_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_key VARCHAR(64) NOT NULL REFERENCES captcha_sites(site_key) ON DELETE CASCADE,
  purpose VARCHAR(64) NOT NULL,
  challenge_type VARCHAR(32) NOT NULL DEFAULT 'math',
  question TEXT NOT NULL,
  answer_hash VARCHAR(128) NOT NULL,
  client_ip_hash VARCHAR(64) NOT NULL,
  difficulty VARCHAR(16) NOT NULL DEFAULT 'easy',
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ DEFAULT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_captcha_challenges_lookup
ON captcha_challenges (id, site_key, purpose);

CREATE INDEX IF NOT EXISTS idx_captcha_challenges_expires
ON captcha_challenges (expires_at)
WHERE consumed_at IS NULL;

-- 3. Verification Proofs Table (Short-lived, Consumed by Business Endpoints)
CREATE TABLE IF NOT EXISTS captcha_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_token_hash VARCHAR(128) NOT NULL UNIQUE,
  site_key VARCHAR(64) NOT NULL REFERENCES captcha_sites(site_key) ON DELETE CASCADE,
  purpose VARCHAR(64) NOT NULL,
  client_ip_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_captcha_proofs_lookup
ON captcha_proofs (proof_token_hash, purpose, site_key);

CREATE INDEX IF NOT EXISTS idx_captcha_proofs_expires
ON captcha_proofs (expires_at)
WHERE consumed_at IS NULL;

-- 4. Rate Limiting Table
CREATE TABLE IF NOT EXISTS captcha_rate_limits (
  key VARCHAR(255) PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_captcha_rate_limits_reset
ON captcha_rate_limits (reset_at);

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE captcha_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE captcha_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE captcha_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE captcha_rate_limits ENABLE ROW LEVEL SECURITY;

-- 6. Atomic Stored Procedure: Atomic Challenge Consumption
CREATE OR REPLACE FUNCTION consume_captcha_challenge(
  p_challenge_id UUID,
  p_answer_hash VARCHAR,
  p_client_ip_hash VARCHAR,
  p_purpose VARCHAR,
  p_site_key VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  -- Lock the row atomically to prevent race condition replay
  SELECT * INTO v_rec
  FROM captcha_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'challenge_not_found');
  END IF;

  IF v_rec.consumed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_consumed');
  END IF;

  IF NOW() > v_rec.expires_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  IF v_rec.purpose <> p_purpose OR v_rec.site_key <> p_site_key THEN
    RETURN jsonb_build_object('success', false, 'reason', 'purpose_or_site_mismatch');
  END IF;

  IF v_rec.attempts >= 3 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'too_many_attempts');
  END IF;

  -- Verify answer hash
  IF v_rec.answer_hash = p_answer_hash THEN
    -- Mark as consumed atomically
    UPDATE captcha_challenges
    SET consumed_at = NOW(),
        attempts = attempts + 1
    WHERE id = p_challenge_id;

    RETURN jsonb_build_object(
      'success', true,
      'site_key', v_rec.site_key,
      'purpose', v_rec.purpose
    );
  ELSE
    -- Increment attempts on failed answer
    UPDATE captcha_challenges
    SET attempts = attempts + 1
    WHERE id = p_challenge_id;

    RETURN jsonb_build_object(
      'success', false,
      'reason', 'incorrect_answer',
      'attempts_left', GREATEST(0, 2 - v_rec.attempts)
    );
  END IF;
END;
$$;

-- 7. Atomic Stored Procedure: Atomic Verification Proof Consumption
CREATE OR REPLACE FUNCTION consume_captcha_proof(
  p_proof_token_hash VARCHAR,
  p_purpose VARCHAR,
  p_site_key VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  -- Lock row atomically to enforce strictly one-time execution
  SELECT * INTO v_rec
  FROM captcha_proofs
  WHERE proof_token_hash = p_proof_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'proof_not_found');
  END IF;

  IF v_rec.consumed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_consumed');
  END IF;

  IF NOW() > v_rec.expires_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  IF v_rec.purpose <> p_purpose OR v_rec.site_key <> p_site_key THEN
    RETURN jsonb_build_object('success', false, 'reason', 'purpose_or_site_mismatch');
  END IF;

  -- Mark proof consumed atomically
  UPDATE captcha_proofs
  SET consumed_at = NOW()
  WHERE id = v_rec.id;

  RETURN jsonb_build_object(
    'success', true,
    'site_key', v_rec.site_key,
    'purpose', v_rec.purpose
  );
END;
$$;

-- 8. Atomic Stored Procedure: Atomic Rate Limiting
CREATE OR REPLACE FUNCTION check_captcha_rate_limit(
  p_key VARCHAR,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_rec RECORD;
BEGIN
  SELECT * INTO v_rec
  FROM captcha_rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO captcha_rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::INTERVAL);
    RETURN TRUE;
  END IF;

  IF v_now > v_rec.reset_at THEN
    UPDATE captcha_rate_limits
    SET count = 1,
        reset_at = v_now + (p_window_seconds || ' seconds')::INTERVAL
    WHERE key = p_key;
    RETURN TRUE;
  END IF;

  IF v_rec.count >= p_max_requests THEN
    RETURN FALSE;
  ELSE
    UPDATE captcha_rate_limits
    SET count = count + 1
    WHERE key = p_key;
    RETURN TRUE;
  END IF;
END;
$$;

-- 9. Automatic Cleanup Routine
CREATE OR REPLACE FUNCTION cleanup_expired_captcha_records()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM captcha_challenges
  WHERE expires_at < NOW() - INTERVAL '1 hour';

  DELETE FROM captcha_proofs
  WHERE expires_at < NOW() - INTERVAL '1 hour';

  DELETE FROM captcha_rate_limits
  WHERE reset_at < NOW() - INTERVAL '1 hour';
END;
$$;

