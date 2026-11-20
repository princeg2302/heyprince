-- ============================================================================
-- HEYPRINCE AI COMPANY: INTELLIGENCE, PRODUCTIVITY & DEDUPLICATION OVERHAUL
-- Safe, non-destructive, idempotent migration
-- ============================================================================

-- 1. Dynamic Industry Categories & Market Expansion
CREATE TABLE IF NOT EXISTS industry_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  commercial_relevance TEXT NOT NULL,
  heyprince_services TEXT[] NOT NULL DEFAULT '{}',
  estimated_demand TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'proposed', 'archived')),
  discovered_by TEXT REFERENCES company_employees(id) ON DELETE SET NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  leads_found_count INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_industry_categories_status ON industry_categories(status);
CREATE INDEX IF NOT EXISTS idx_industry_categories_scanned ON industry_categories(last_scanned_at);

-- Seed core high-intent industry categories
INSERT INTO industry_categories (id, name, slug, commercial_relevance, heyprince_services, estimated_demand, status)
VALUES
  (
    'it_services',
    'IT Services & Software Companies',
    'it-services-software',
    'High tech budgets, need specialized sub-contracting for Next.js frontends, cloud migration, and AI agent automation.',
    ARRAY['Full-Stack Next.js Architecture', 'AI Agent Automation', 'Cloud Backend Optimization'],
    'high',
    'active'
  ),
  (
    'startups_scaleups',
    'Startups & Newly Launched Businesses',
    'startups-newly-launched',
    'Urgent need for fast MVP delivery, modern branding, sub-second web apps, and conversion-optimized sales funnels.',
    ARRAY['Next.js MVP Development', 'Database & Supabase Setup', 'Speed & CWV Engineering'],
    'high',
    'active'
  ),
  (
    'ecommerce_d2c',
    'E-commerce & D2C Brands',
    'ecommerce-d2c-brands',
    'Directly impacted by slow mobile checkout speeds, WooCommerce latency, and Shopify App bloat.',
    ARRAY['Headless WooCommerce to Next.js', 'Sub-Second Storefront Optimization', 'Core Web Vitals Remediation'],
    'high',
    'active'
  ),
  (
    'healthcare_clinics',
    'Healthcare, Dental & Specialized Clinics',
    'healthcare-dental-clinics',
    'Need modern patient appointment booking systems, HIPAA/GDPR compliance, and local SEO dominance.',
    ARRAY['Automated Booking Systems', 'High-Converting Web Portals', 'Local SEO & Speed Upgrades'],
    'medium',
    'active'
  ),
  (
    'education_institutes',
    'Education, EdTech & Coaching Institutes',
    'education-coaching-institutes',
    'Require student management portals, high-converting enrollment pages, and WhatsApp notification flows.',
    ARRAY['Web Application Portals', 'WhatsApp Automation', 'Landing Page Conversion Architecture'],
    'medium',
    'active'
  ),
  (
    'real_estate_construction',
    'Real Estate & Construction Developers',
    'real-estate-construction',
    'Require ultra-fast property showcase catalogs, 3D/virtual tour optimization, and instant WhatsApp inquiry capture.',
    ARRAY['Property Catalog Web Apps', 'High-Speed Image/Media Delivery', 'CRM Lead Capture Automations'],
    'high',
    'active'
  ),
  (
    'manufacturing_industrial',
    'Manufacturing & Industrial Businesses',
    'manufacturing-industrial',
    'Legacy outdated desktop-only websites; massive opportunity for digital modernization and B2B quote portals.',
    ARRAY['Modern B2B Portal Architecture', 'Product Catalog Modernization', 'ERP/CRM Integrations'],
    'medium',
    'active'
  ),
  (
    'hospitality_travel',
    'Hospitality, Boutique Hotels & Travel',
    'hospitality-travel',
    'Dependent on visual speed, mobile direct bookings, and reducing reliance on high-fee third-party platforms.',
    ARRAY['Direct Booking Engines', 'Mobile Performance Upgrades', 'Visual Media Optimization'],
    'medium',
    'active'
  ),
  (
    'marketing_agencies',
    'Marketing & Creative Agencies',
    'marketing-creative-agencies',
    'Require reliable white-label web engineering partners to execute complex React, Next.js, and AI projects for their clients.',
    ARRAY['White-Label Web Development', 'Headless CMS Architecture', 'AI Integration for Agency Clients'],
    'high',
    'active'
  ),
  (
    'professional_services',
    'Professional Services (Legal, Financial & Consulting)',
    'professional-services',
    'Require high-authority design, client onboarding flows, appointment scheduling, and rock-solid uptime.',
    ARRAY['Corporate Authority Portals', 'Client Onboarding Portals', 'Security & CWV Assurance'],
    'high',
    'active'
  ),
  (
    'outdated_slow_websites',
    'Businesses with Outdated or Sluggish Websites',
    'businesses-outdated-websites',
    'Direct outreach opportunity: failing Google Core Web Vitals, slow TTFB (>2s), mobile unfriendliness.',
    ARRAY['Core Web Vitals Engineering', 'Legacy to Next.js Modernization', 'Mobile-First Responsive Redesign'],
    'urgent',
    'active'
  ),
  (
    'digital_transformation',
    'Businesses Expanding or Undergoing Digital Transformation',
    'businesses-digital-transformation',
    'Companies actively hiring tech roles or announcing expansion, requiring scalable architecture and workflow automation.',
    ARRAY['Cloud Infrastructure Scaling', 'Autonomous AI Workflow Implementation', 'Full-Stack Engineering'],
    'high',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  commercial_relevance = EXCLUDED.commercial_relevance,
  heyprince_services = EXCLUDED.heyprince_services,
  updated_at = NOW();

-- 2. Blog Topics Registry & Semantic Editorial Engine
CREATE TABLE IF NOT EXISTS blog_topics_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  normalized_topic TEXT NOT NULL,
  category TEXT NOT NULL,
  angle TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  semantic_keywords TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'drafted', 'published', 'rejected')),
  rejection_reason TEXT,
  similarity_score NUMERIC(4,3) DEFAULT 0.000,
  similar_to_slug TEXT,
  post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  proposed_by TEXT REFERENCES company_employees(id) ON DELETE SET NULL,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_topics_normalized ON blog_topics_registry(normalized_topic);
CREATE INDEX IF NOT EXISTS idx_blog_topics_status ON blog_topics_registry(status);
CREATE INDEX IF NOT EXISTS idx_blog_topics_category ON blog_topics_registry(category);

-- 3. Visual Asset Registry & Image Quality Store
CREATE TABLE IF NOT EXISTS image_assets_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL,
  article_id TEXT,
  post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  visual_concepts TEXT[] NOT NULL DEFAULT '{}',
  quality_status TEXT NOT NULL DEFAULT 'approved' CHECK (quality_status IN ('approved', 'rejected', 'flagged')),
  quality_score NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  watermark_detected BOOLEAN NOT NULL DEFAULT FALSE,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_assets_hash ON image_assets_registry(content_hash);
CREATE INDEX IF NOT EXISTS idx_image_assets_post ON image_assets_registry(post_id);
CREATE INDEX IF NOT EXISTS idx_image_assets_status ON image_assets_registry(quality_status);

-- 4. Persistent Agent Learning & Feedback Store
CREATE TABLE IF NOT EXISTS company_agent_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES company_employees(id) ON DELETE CASCADE,
  learning_type TEXT NOT NULL CHECK (learning_type IN ('approval', 'rejection', 'correction', 'failure_analysis', 'market_observation', 'performance_metric')),
  topic_or_entity TEXT NOT NULL,
  lesson TEXT NOT NULL,
  actionable_directive TEXT NOT NULL,
  source_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_learnings_agent ON company_agent_learnings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_type ON company_agent_learnings(learning_type);

-- 5. Autonomous Workflow Improvement Proposals
CREATE TABLE IF NOT EXISTS company_improvement_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_by TEXT NOT NULL REFERENCES company_employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  existing_limitation TEXT NOT NULL,
  evidence TEXT NOT NULL,
  proposed_change TEXT NOT NULL,
  affected_files TEXT[] NOT NULL DEFAULT '{}',
  risk_assessment TEXT NOT NULL,
  estimated_cost_usd NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'implemented', 'rejected')),
  review_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_improvement_proposals_status ON company_improvement_proposals(status);

-- 6. Measurable Daily Company Reports (Backed by Real Database Records)
CREATE TABLE IF NOT EXISTS daily_company_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE UNIQUE NOT NULL,
  research_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  new_discoveries JSONB NOT NULL DEFAULT '[]'::jsonb,
  proposed_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  leads_discovered JSONB NOT NULL DEFAULT '[]'::jsonb,
  images_generated JSONB NOT NULL DEFAULT '[]'::jsonb,
  blogs_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  rejected_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvements_made JSONB NOT NULL DEFAULT '[]'::jsonb,
  pending_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_company_reports_date ON daily_company_reports(report_date DESC);

-- 7. Extend Businesses Table for Verified Lead Lifecycle & Evidence Tracking
DO $$
BEGIN
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS lead_score NUMERIC(3,2) DEFAULT 0.65;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS fit_reason TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_history JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS discovery_history JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS source_url TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_update BOOLEAN DEFAULT FALSE;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_score ON businesses(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON businesses(last_verified_at);
