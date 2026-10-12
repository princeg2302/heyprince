import pg from 'pg';

export const OUTREACH_MIGRATION_SQL = `
-- ============================================================================
-- HeyPrince Global Lead Intelligence & Compliant Outreach System Migration
-- Safe, Idempotent DDL (Preserves existing tables without data destruction)
-- ============================================================================

-- 1. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  normalized_domain VARCHAR(255),
  website_url TEXT,
  country_code VARCHAR(2) NOT NULL,
  region VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  postal_code VARCHAR(50),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  industry VARCHAR(100),
  category VARCHAR(100),
  source_provider VARCHAR(50) NOT NULL,
  source_provider_id VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'DISCOVERED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_businesses_provider_record 
ON businesses (source_provider, source_provider_id);

CREATE INDEX IF NOT EXISTS idx_businesses_normalized_domain 
ON businesses (normalized_domain);

CREATE INDEX IF NOT EXISTS idx_businesses_country_cat 
ON businesses (country_code, category);

CREATE INDEX IF NOT EXISTS idx_businesses_status 
ON businesses (status);

-- 2. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  raw_email VARCHAR(255),
  name VARCHAR(255),
  role_or_title VARCHAR(100),
  phone VARCHAR(100),
  source_url TEXT,
  provenance VARCHAR(100),
  syntax_valid BOOLEAN NOT NULL DEFAULT TRUE,
  mx_valid BOOLEAN,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
  verification_confidence NUMERIC(3, 2),
  verification_details JSONB DEFAULT '{}'::jsonb,
  is_role_account BOOLEAN NOT NULL DEFAULT FALSE,
  is_disposable BOOLEAN NOT NULL DEFAULT FALSE,
  is_catchall BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_business_email 
ON contacts (business_id, email);

CREATE INDEX IF NOT EXISTS idx_contacts_email 
ON contacts (email);

CREATE INDEX IF NOT EXISTS idx_contacts_verification_status 
ON contacts (verification_status);

-- 3. Discovery Jobs Table
CREATE TABLE IF NOT EXISTS discovery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  region VARCHAR(100),
  city VARCHAR(100),
  category VARCHAR(100),
  query TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  total_found INTEGER NOT NULL DEFAULT 0,
  total_inserted INTEGER NOT NULL DEFAULT 0,
  total_duplicates INTEGER NOT NULL DEFAULT 0,
  cursor JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_jobs_status_created 
ON discovery_jobs (status, created_at DESC);

-- 4. Discovery Sources & Quota Usage
CREATE TABLE IF NOT EXISTS discovery_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  units_used INTEGER NOT NULL DEFAULT 0,
  cost_estimate_usd NUMERIC(8, 4) DEFAULT 0,
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quota_limit INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_sources_provider_date 
ON discovery_sources (provider, period_date);

-- 5. Website Audits Table
CREATE TABLE IF NOT EXISTS website_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  final_url TEXT,
  http_status INTEGER,
  is_reachable BOOLEAN NOT NULL DEFAULT FALSE,
  has_https BOOLEAN NOT NULL DEFAULT FALSE,
  mobile_friendly BOOLEAN NOT NULL DEFAULT FALSE,
  has_contact_page BOOLEAN NOT NULL DEFAULT FALSE,
  has_booking_system BOOLEAN NOT NULL DEFAULT FALSE,
  has_ecommerce BOOLEAN NOT NULL DEFAULT FALSE,
  has_newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  has_live_chat BOOLEAN NOT NULL DEFAULT FALSE,
  speed_index_ms INTEGER,
  detected_technologies JSONB DEFAULT '[]'::jsonb,
  signals JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_audits_business 
ON website_audits (business_id, audited_at DESC);

-- 6. AI Analyses & Outreach Personalization Table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  model_provider VARCHAR(50) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  business_summary TEXT NOT NULL,
  observed_digital_opportunity TEXT NOT NULL,
  recommended_service VARCHAR(100) NOT NULL,
  evidence TEXT NOT NULL,
  confidence_level NUMERIC(3, 2) NOT NULL,
  suggested_subject VARCHAR(255) NOT NULL,
  personalized_draft TEXT NOT NULL,
  unsupported_claim_warnings JSONB DEFAULT '[]'::jsonb,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  estimated_cost_usd NUMERIC(8, 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_business 
ON ai_analyses (business_id, created_at DESC);

-- 7. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  service_offering VARCHAR(100) NOT NULL,
  target_countries TEXT[] DEFAULT '{}',
  target_categories TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  daily_limit INTEGER NOT NULL DEFAULT 20,
  domain_hourly_limit INTEGER NOT NULL DEFAULT 1,
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_delivered INTEGER NOT NULL DEFAULT 0,
  total_bounced INTEGER NOT NULL DEFAULT 0,
  total_complaints INTEGER NOT NULL DEFAULT 0,
  total_unsubscribed INTEGER NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Compliance Evidence Table
CREATE TABLE IF NOT EXISTS compliance_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  jurisdiction VARCHAR(100) NOT NULL,
  decision VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
  legal_basis VARCHAR(150) NOT NULL,
  reason TEXT NOT NULL,
  policy_version VARCHAR(50) NOT NULL,
  evidence_snapshot JSONB DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_contact_decision 
ON compliance_evidence (contact_id, decision);

-- 9. Suppressions Table (Opt-outs, Bounces, Complaints)
CREATE TABLE IF NOT EXISTS suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255),
  reason VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL,
  campaign_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppressions_domain 
ON suppressions (domain);

-- 10. Email Messages Table (Durable Queue & Outbox)
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  ai_analysis_id UUID REFERENCES ai_analyses(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  unsubscribe_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_messages_status_scheduled 
ON email_messages (status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_email_messages_provider_id 
ON email_messages (provider_message_id);

CREATE INDEX IF NOT EXISTS idx_email_messages_recipient 
ON email_messages (recipient_email);

-- 11. Email Events Table (Webhooks, Delivery tracking)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  provider VARCHAR(50),
  provider_event_id VARCHAR(255),
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_message_type 
ON email_events (email_message_id, event_type);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_created 
ON audit_logs (admin_email, created_at DESC);

-- 13. Global Outreach Settings Table (Emergency Kill Switch)
CREATE TABLE IF NOT EXISTS outreach_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default_settings',
  global_kill_switch BOOLEAN NOT NULL DEFAULT TRUE,
  test_mode BOOLEAN NOT NULL DEFAULT TRUE,
  daily_send_cap INTEGER NOT NULL DEFAULT 10,
  domain_hourly_cap INTEGER NOT NULL DEFAULT 1,
  min_delay_between_sends_seconds INTEGER NOT NULL DEFAULT 30,
  default_ai_provider VARCHAR(50) NOT NULL DEFAULT 'deterministic',
  default_discovery_provider VARCHAR(50) NOT NULL DEFAULT 'openstreetmap',
  require_manual_review BOOLEAN NOT NULL DEFAULT TRUE,
  company_name VARCHAR(255) NOT NULL DEFAULT 'HeyPrince',
  physical_address TEXT NOT NULL DEFAULT 'Kolkata, West Bengal, India',
  contact_email VARCHAR(255) NOT NULL DEFAULT 'it@heyprince.in',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure default row exists with global_kill_switch = true for immediate safety
INSERT INTO outreach_settings (
  id, global_kill_switch, test_mode, daily_send_cap, domain_hourly_cap, min_delay_between_sends_seconds, 
  default_ai_provider, default_discovery_provider, require_manual_review, company_name, physical_address, contact_email
)
VALUES (
  'default_settings', TRUE, TRUE, 10, 1, 30, 
  'deterministic', 'openstreetmap', TRUE, 'HeyPrince', 'Kolkata, West Bengal, India', 'it@heyprince.in'
)
ON CONFLICT (id) DO NOTHING;
`;

export async function runOutreachMigration(connectionString?: string): Promise<{ success: boolean; message: string }> {
  const connStr =
    connectionString ||
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@127.0.0.1:5432/heyprince';

  const client = new pg.Client({
    connectionString: connStr,
    ssl:
      connStr && !connStr.includes('127.0.0.1') && !connStr.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.info('[Outreach Migration] Executing safe DDL script...');
    await client.query(OUTREACH_MIGRATION_SQL);
    console.info('[Outreach Migration] ✅ All 13 tables, indexes, and safety settings verified!');
    return { success: true, message: 'All outreach tables and constraints successfully verified/migrated.' };
  } catch (err: any) {
    console.error('[Outreach Migration] ❌ Migration failed:', err);
    return { success: false, message: err?.message || 'Unknown migration error' };
  } finally {
    await client.end();
  }
}

