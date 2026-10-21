-- ============================================================================
-- Autonomous AI Chief of Staff Schema for HeyPrince.in
-- Safe, idempotent, non-destructive migration
-- ============================================================================

-- 1. Chief Agents Table
CREATE TABLE IF NOT EXISTS chief_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled', 'paused', 'running', 'error')),
  mode TEXT NOT NULL DEFAULT 'prepare' CHECK (mode IN ('observe', 'prepare', 'auto')),
  schedule_cron TEXT NOT NULL DEFAULT '0 */6 * * *',
  schedule_display TEXT NOT NULL DEFAULT 'Every 6 Hours',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  stats JSONB NOT NULL DEFAULT '{"total_runs": 0, "successful_runs": 0, "failed_runs": 0, "items_produced": 0, "estimated_tokens": 0, "estimated_cost_usd": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chief_agents_status ON chief_agents(status);
CREATE INDEX IF NOT EXISTS idx_chief_agents_mode ON chief_agents(mode);

-- 2. Chief Tasks Queue & History Table
CREATE TABLE IF NOT EXISTS chief_tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES chief_agents(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'approval_required')),
  priority INTEGER NOT NULL DEFAULT 5,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_details TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  duration_ms INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chief_tasks_agent_status ON chief_tasks(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_chief_tasks_created ON chief_tasks(created_at DESC);

-- 3. Chief Content & Action Drafts (Awaiting Approval Queue)
CREATE TABLE IF NOT EXISTS chief_content_drafts (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES chief_agents(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL CHECK (draft_type IN ('article', 'linkedin_post', 'client_proposal', 'seo_patch', 'site_fix', 'outreach_draft')),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'published', 'rejected')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chief_drafts_status ON chief_content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_chief_drafts_created ON chief_content_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chief_drafts_type ON chief_content_drafts(draft_type);

-- 4. Chief Website Health & Diagnostics Audits
CREATE TABLE IF NOT EXISTS chief_health_audits (
  id TEXT PRIMARY KEY,
  audit_type TEXT NOT NULL DEFAULT 'full_audit' CHECK (audit_type IN ('full_audit', 'route_check', 'seo_audit', 'link_check', 'cwv_check')),
  routes_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
  issues_found JSONB NOT NULL DEFAULT '[]'::jsonb,
  lighthouse_scores JSONB NOT NULL DEFAULT '{"performance": null, "accessibility": null, "best_practices": null, "seo": null}'::jsonb,
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical')),
  summary TEXT NOT NULL,
  duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chief_health_created ON chief_health_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chief_health_status ON chief_health_audits(status);

-- 5. Chief SEO Recommendations
CREATE TABLE IF NOT EXISTS chief_seo_recommendations (
  id TEXT PRIMARY KEY,
  page_url TEXT NOT NULL,
  issue TEXT NOT NULL,
  evidence TEXT NOT NULL,
  suggested_change TEXT NOT NULL,
  expected_benefit TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'applied', 'dismissed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chief_seo_status ON chief_seo_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_chief_seo_created ON chief_seo_recommendations(created_at DESC);

-- 6. Chief Activity & Audit Logs
CREATE TABLE IF NOT EXISTS chief_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT REFERENCES chief_agents(id) ON DELETE SET NULL,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'success')),
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chief_logs_agent ON chief_activity_logs(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chief_logs_created ON chief_activity_logs(created_at DESC);

-- 7. Seed Initial Core Agents (Idempotent ON CONFLICT DO UPDATE)
INSERT INTO chief_agents (id, name, role, description, status, mode, schedule_cron, schedule_display, config)
VALUES
  (
    'content_researcher',
    'Content & Research Agent',
    'Tech Trend Discovery & Original Article Drafting',
    'Scans tech publications, AI labs, GitHub, and Hacker News to prepare research-backed, high-quality blog posts and LinkedIn thoughts.',
    'enabled',
    'prepare',
    '30 3 * * *',
    'Daily at 9:00 AM IST',
    '{"topics": ["AI & Machine Learning", "Next.js & React 19", "Web Architecture & Performance", "Cloud & Supabase", "Full-stack Engineering"], "max_daily_drafts": 1, "include_linkedin": true}'::jsonb
  ),
  (
    'website_guardian',
    'Website Guardian Agent',
    'Autonomous Site Health, Core Web Vitals & Regressions Monitor',
    'Continuously tests live routes, broken links, sitemaps, robots.txt, accessibility regressions, and reports immediate health alerts.',
    'enabled',
    'observe',
    '0 */4 * * *',
    'Every 4 Hours',
    '{"routes_to_monitor": ["/", "/about/", "/services/", "/insights/", "/contact/", "/sitemap.xml", "/robots.txt"], "alert_on_404": true, "max_response_time_ms": 2500}'::jsonb
  ),
  (
    'seo_growth',
    'SEO & Organic Growth Agent',
    'Technical SEO Auditing & High-Intent Opportunity Finder',
    'Audits metadata, schema markup, canonical links, internal linking gaps, and content clusters to maximize search footprint.',
    'enabled',
    'prepare',
    '0 6 * * 1',
    'Weekly on Monday at 11:30 AM IST',
    '{"min_title_length": 30, "max_title_length": 65, "min_desc_length": 110, "max_desc_length": 160, "cluster_focus": ["Full-Stack Development", "Next.js Consulting", "AI Web Applications"]}'::jsonb
  ),
  (
    'lead_scout',
    'Lead Intelligence Scout',
    'Ethical Business Lead Discovery & Technical Opportunity Fit',
    'Identifies businesses with slow websites, outdated tech, or WooCommerce needs and analyzes fit for tailored client proposals.',
    'enabled',
    'prepare',
    '0 10 * * 1-5',
    'Weekdays at 3:30 PM IST',
    '{"target_industries": ["B2B SaaS", "E-commerce & D2C", "Digital Agencies", "Professional Services"], "focus_tech": ["WordPress", "Shopify", "React", "Next.js"]}'::jsonb
  ),
  (
    'inbound_responder',
    'Inbound Lead Responder',
    'Inbound Client Inquiry Intelligence & Custom Proposal Drafter',
    'Instantly analyzes contact form inquiries, determines project scope, technical requirements, and prepares a tailored proposal outline for review.',
    'enabled',
    'prepare',
    'event_driven',
    'Real-time Event Triggered',
    '{"auto_draft_proposal": true, "turnaround_target_hours": 2, "estimated_rate_usd": 65}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  description = EXCLUDED.description,
  updated_at = NOW();
