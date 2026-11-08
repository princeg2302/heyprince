-- ============================================================================
-- HEYPRINCE AI COMPANY: ENTERPRISE WORKFORCE EXTENSION (V2)
-- Safe, non-destructive, idempotent migration
-- ============================================================================

-- 1. Employee Registry (Humanoid AI Identities)
CREATE TABLE IF NOT EXISTS company_employees (
  id TEXT PRIMARY KEY,
  legacy_agent_id TEXT REFERENCES chief_agents(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  display_title TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('Executive', 'Growth', 'Editorial', 'Infrastructure', 'Sales', 'Product', 'Analytics', 'Client Solutions')),
  avatar_url TEXT NOT NULL,
  bio TEXT NOT NULL,
  personality_archetype TEXT NOT NULL,
  system_prompt_overlay TEXT NOT NULL,
  model_preference TEXT NOT NULL DEFAULT 'gemini-3.5-flash',
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'thinking', 'researching', 'in_meeting', 'working', 'waiting_for_approval', 'blocked', 'reviewing', 'offline')),
  current_activity TEXT,
  tool_permissions JSONB NOT NULL DEFAULT '{"allowed_tools": [], "requires_approval": ["publish_content", "send_external_email", "deploy_code"]}'::jsonb,
  performance_metrics JSONB NOT NULL DEFAULT '{"tasks_completed": 0, "proposals_approved": 0, "proposals_rejected": 0, "total_tokens": 0, "rating": 5.0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure check constraint includes Client Solutions
ALTER TABLE company_employees DROP CONSTRAINT IF EXISTS company_employees_department_check;
ALTER TABLE company_employees ADD CONSTRAINT company_employees_department_check CHECK (department IN ('Executive', 'Growth', 'Editorial', 'Infrastructure', 'Sales', 'Product', 'Analytics', 'Client Solutions'));

CREATE INDEX IF NOT EXISTS idx_company_employees_dept ON company_employees(department);
CREATE INDEX IF NOT EXISTS idx_company_employees_status ON company_employees(status);

-- 2. Virtual Collaboration Rooms
CREATE TABLE IF NOT EXISTS company_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('war_room', 'daily_standup', 'innovation_lab', 'growth_sales', 'dev_room')),
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'MessageSquare',
  max_participants INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default corporate virtual rooms
INSERT INTO company_rooms (id, name, room_type, description, icon_name)
VALUES
  ('war_room', 'Company War Room', 'war_room', 'Executive strategic hub for urgent incidents, critical decisions, and business pivots.', 'AlertTriangle'),
  ('daily_standup', 'Daily 9:00 AM Standup', 'daily_standup', 'Morning company-wide synchronization, blockers removal, and daily priorities alignment.', 'Calendar'),
  ('innovation_lab', 'Innovation & R&D Lab', 'innovation_lab', 'Brainstorming service blueprints, new AI architectures, and experimental features.', 'Zap'),
  ('growth_sales', 'Growth & Revenue Room', 'growth_sales', 'Lead intelligence analysis, SEO opportunities, cold outreach, and conversion tracking.', 'TrendingUp'),
  ('dev_room', 'Engineering & SRE Room', 'dev_room', 'Core Web Vitals tuning, performance profiling, bug fixes, and site health audits.', 'Cpu')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 3. Collaborative Meeting Discussions
CREATE TABLE IF NOT EXISTS company_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES company_rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  moderator_id TEXT NOT NULL REFERENCES company_employees(id),
  participant_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'concluded', 'converted_to_task', 'cancelled')),
  token_budget INTEGER NOT NULL DEFAULT 4000,
  tokens_consumed INTEGER NOT NULL DEFAULT 0,
  turn_count INTEGER NOT NULL DEFAULT 0,
  max_turns INTEGER NOT NULL DEFAULT 8,
  conclusion JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  concluded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_discussions_room ON company_discussions(room_id, status);
CREATE INDEX IF NOT EXISTS idx_company_discussions_created ON company_discussions(created_at DESC);

-- 4. Discussion Turn-by-Turn Messages
CREATE TABLE IF NOT EXISTS company_messages (
  id BIGSERIAL PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES company_discussions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES company_employees(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'statement' CHECK (message_type IN ('statement', 'proposal', 'challenge', 'evidence', 'consensus', 'dissent', 'summary')),
  content TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_messages_discussion ON company_messages(discussion_id, created_at ASC);

-- 5. Enterprise Collaborative Tasks
CREATE TABLE IF NOT EXISTS company_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES company_discussions(id) ON DELETE SET NULL,
  proposal_id UUID,
  assigned_to TEXT NOT NULL REFERENCES company_employees(id),
  assigned_by TEXT NOT NULL REFERENCES company_employees(id),
  reviewer_id TEXT REFERENCES company_employees(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  acceptance_criteria TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review_ready', 'completed', 'blocked', 'failed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  depends_on_task_ids UUID[] NOT NULL DEFAULT '{}',
  execution_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  verification_notes TEXT,
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_tasks_assigned ON company_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_company_tasks_status ON company_tasks(status);

-- 6. CEO Action Proposals (Awaiting Executive Approval)
CREATE TABLE IF NOT EXISTS company_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES company_discussions(id) ON DELETE SET NULL,
  sponsored_by TEXT NOT NULL REFERENCES company_employees(id),
  title TEXT NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('publish_content', 'outreach_campaign', 'site_modification', 'new_agent_activation', 'financial_expense')),
  business_justification TEXT NOT NULL,
  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimated_cost_usd NUMERIC(10, 4) DEFAULT 0.0000,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'changes_requested', 'expired')),
  ceo_feedback TEXT,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_proposals_status ON company_proposals(status);
CREATE INDEX IF NOT EXISTS idx_company_proposals_created ON company_proposals(created_at DESC);

-- 7. Multi-Tier Corporate Memory Store
CREATE TABLE IF NOT EXISTS company_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('company', 'department', 'employee', 'meeting')),
  department TEXT,
  employee_id TEXT REFERENCES company_employees(id) ON DELETE SET NULL,
  discussion_id UUID REFERENCES company_discussions(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('strategy', 'decision', 'learning', 'performance_benchmark', 'market_intelligence', 'failed_experiment')),
  insight TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(3, 2) DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_memory_scope ON company_memory(scope, department, category);
CREATE INDEX IF NOT EXISTS idx_company_memory_employee ON company_memory(employee_id);

-- 8. Seed Initial Humanoid Workforce
INSERT INTO company_employees (
  id, legacy_agent_id, name, display_title, department, avatar_url, bio, personality_archetype, system_prompt_overlay, model_preference
) VALUES
  (
    'prince_ceo',
    NULL,
    'Prince',
    'Chief Executive Officer & Founder',
    'Executive',
    '/assets/cropped-prince-profile.webp',
    'Owner & CEO of HeyPrince. Ultimate strategic authority, business direction, and final approval authority.',
    'Visionary, Decisive, Strategic (CEO)',
    'You are Prince, Chief Executive Officer of HeyPrince. You lead business direction and give final approvals.',
    'human'
  ),
  (
    'alex_vance',
    NULL,
    'Alex Vance',
    'Chief of Staff & Head of Operations',
    'Executive',
    '/assets/avatars/alex-vance.webp',
    'Executive orchestrator keeping the company aligned, tracking deadlines, and moderating strategic debates.',
    'Diplomatic, structured, decisive (ENTJ)',
    'You are Alex Vance, Chief of Staff for HeyPrince. Always maintain executive decorum, enforce meeting agendas, seek consensus, and synthesize discussions into actionable tasks.',
    'gemini-3.5-flash'
  ),
  (
    'elena_rostova',
    'seo_growth',
    'Elena Rostova',
    'Head of Search & Semantic Intelligence',
    'Growth',
    '/assets/avatars/elena-rostova.webp',
    'Quantitative SEO scientist focused on organic search footprint, canonical integrity, and search volume intent.',
    'Analytical, rigorous, data-driven (INTJ)',
    'You are Elena Rostova, Head of Search. Never accept content ideas without verifiable keyword intent or search opportunity.',
    'gemini-3.5-flash'
  ),
  (
    'marcus_sterling',
    'content_researcher',
    'Marcus Sterling',
    'Principal Content Creator & Lead Writer',
    'Editorial',
    '/assets/avatars/marcus-sterling.webp',
    'Master technical wordsmith producing authoritative 1,500+ word software engineering guides with zero em dashes.',
    'Authoritative, visionary, articulate (ENTP)',
    'You are Marcus Sterling, Principal Content Creator. Write deeply practical architectural insights for senior engineers. Strictly never use em dashes.',
    'gemini-3.5-flash'
  ),
  (
    'liam_thorne',
    'lead_scout',
    'Liam Thorne',
    'Lead Intelligence & Growth Scout',
    'Sales',
    '/assets/avatars/liam-thorne.webp',
    'Enterprising business detective identifying companies struggling with sluggish sites and outdated architectures.',
    'Perceptive, enterprising, consultative (ESTP)',
    'You are Liam Thorne, Lead Intelligence Scout. Evaluate businesses objectively on technical merit and conversion upside.',
    'gemini-3.5-flash'
  ),
  (
    'david_chen',
    'website_guardian',
    'David Chen',
    'Site Reliability Sentinel & Performance Engineer',
    'Infrastructure',
    '/assets/avatars/david-chen.webp',
    'Vigilant SRE dedicated to 100% uptime, sub-200ms TTFB, and rock-solid production stability.',
    'Vigilant, meticulous, protective (ISTJ)',
    'You are David Chen, Site Reliability Sentinel. Challenge any deployment or content modification that endangers speed or reliability.',
    'gemini-3.5-flash'
  ),
  (
    'sophia_reynolds',
    'inbound_responder',
    'Sophia Reynolds',
    'Client Solutions Partner',
    'Client Solutions',
    '/assets/avatars/sophia-reynolds.webp',
    'Empathetic solutions consultant translating client problems into high-value engineering deliverables and proposals.',
    'Empathetic, commercial, structured (ENFJ)',
    'You are Sophia Reynolds. Analyze inbound inquiries with commercial acuity and craft clear scopes of work.',
    'gemini-3.5-flash'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_title = EXCLUDED.display_title,
  bio = EXCLUDED.bio,
  updated_at = NOW();

-- 9. Enable Realtime Replication for Collaboration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE company_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE company_discussions;
    ALTER PUBLICATION supabase_realtime ADD TABLE company_employees;
    ALTER PUBLICATION supabase_realtime ADD TABLE company_tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE company_proposals;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;
