// ============================================================================
// Autonomous AI Chief of Staff Type Definitions
// ============================================================================

export type AgentStatus = 'enabled' | 'paused' | 'running' | 'error';
export type OperatingMode = 'observe' | 'prepare' | 'auto';

export interface ChiefAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  mode: OperatingMode;
  schedule_cron: string;
  schedule_display: string;
  last_run_at: string | null;
  next_run_at: string | null;
  config: Record<string, any>;
  stats: {
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    items_produced: number;
    estimated_tokens?: number;
    estimated_cost_usd?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'approval_required';

export interface ChiefTask {
  id: string;
  agent_id: string;
  task_type: string;
  status: TaskStatus;
  priority: number;
  payload: Record<string, any>;
  result: Record<string, any>;
  error_details: string | null;
  retry_count: number;
  max_retries: number;
  duration_ms: number;
  tokens_used: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export type DraftType = 'article' | 'linkedin_post' | 'client_proposal' | 'seo_patch' | 'site_fix' | 'outreach_draft';
export type DraftStatus = 'pending_approval' | 'approved' | 'published' | 'rejected';

export interface ChiefContentDraft {
  id: string;
  agent_id: string;
  draft_type: DraftType;
  title: string;
  excerpt?: string;
  content: string;
  metadata: {
    slug?: string;
    category?: string;
    tags?: string[];
    seo_title?: string;
    seo_description?: string;
    featured_image_url?: string;
    lead_id?: string | number;
    lead_email?: string;
    lead_company?: string;
    linkedin_copy?: string;
    affected_url?: string;
    diff_patch?: string;
    [key: string]: any;
  };
  status: DraftStatus;
  rejection_reason?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface RouteCheckResult {
  url: string;
  status: number;
  ok: boolean;
  responseTimeMs: number;
  error?: string;
  contentType?: string;
}

export interface HealthIssue {
  severity: 'info' | 'warning' | 'critical';
  route: string;
  type: string;
  message: string;
  suggested_fix?: string;
}

export interface ChiefHealthAudit {
  id: string;
  audit_type: 'full_audit' | 'route_check' | 'seo_audit' | 'link_check' | 'cwv_check';
  routes_checked: RouteCheckResult[];
  issues_found: HealthIssue[];
  lighthouse_scores: {
    performance: number | null;
    accessibility: number | null;
    best_practices: number | null;
    seo: number | null;
  };
  status: HealthStatus;
  summary: string;
  duration_ms: number;
  created_at: string;
}

export type SeoRecommendationStatus = 'open' | 'approved' | 'applied' | 'dismissed';

export interface ChiefSeoRecommendation {
  id: string;
  page_url: string;
  issue: string;
  evidence: string;
  suggested_change: string;
  expected_benefit: string;
  risk_level: 'low' | 'medium' | 'high';
  status: SeoRecommendationStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface ChiefActivityLog {
  id: number;
  agent_id: string | null;
  level: LogLevel;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export interface ChiefDashboardSummary {
  agents: ChiefAgent[];
  activeAgentsCount: number;
  pausedAgentsCount: number;
  pendingTasksCount: number;
  draftsAwaitingApprovalCount: number;
  recentDrafts: ChiefContentDraft[];
  latestHealthAudit: ChiefHealthAudit | null;
  openSeoRecommendationsCount: number;
  recentSeoRecommendations: ChiefSeoRecommendation[];
  recentLogs: ChiefActivityLog[];
  metrics: {
    totalRuns: number;
    successRate: number;
    totalDraftsProduced: number;
    estimatedTokens: number;
    estimatedCostUsd: number;
  };
}
