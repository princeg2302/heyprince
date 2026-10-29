import { sanitizeAiContent, sanitizeEmDashes } from '../ai-content-sanitizer';
import crypto from 'crypto';
import { query } from '../outreach/db';
import {
  ChiefAgent,
  ChiefTask,
  ChiefContentDraft,
  ChiefHealthAudit,
  ChiefSeoRecommendation,
  ChiefActivityLog,
  ChiefDashboardSummary,
  AgentStatus,
  OperatingMode,
  TaskStatus,
  DraftStatus,
} from './types';

// ============================================================================
// 1. Agent Operations
// ============================================================================

export async function getAllAgents(): Promise<ChiefAgent[]> {
  const rows = await query<ChiefAgent>(`
    SELECT * FROM chief_agents 
    WHERE id != 'inbound_responder'
    ORDER BY 
      CASE id 
        WHEN 'content_researcher' THEN 1
        WHEN 'website_guardian' THEN 2
        WHEN 'seo_growth' THEN 3
        WHEN 'lead_scout' THEN 4
        ELSE 5
      END ASC;
  `);
  return rows || [];
}

export async function getAgentById(id: string): Promise<ChiefAgent | null> {
  const rows = await query<ChiefAgent>(
    `SELECT * FROM chief_agents WHERE id = $1 LIMIT 1;`,
    [id]
  );
  return rows[0] || null;
}

export async function updateAgentStatus(id: string, status: AgentStatus): Promise<boolean> {
  await query(
    `UPDATE chief_agents SET status = $1, updated_at = NOW() WHERE id = $2;`,
    [status, id]
  );
  return true;
}

export async function updateAgentMode(id: string, mode: OperatingMode): Promise<boolean> {
  await query(
    `UPDATE chief_agents SET mode = $1, updated_at = NOW() WHERE id = $2;`,
    [mode, id]
  );
  return true;
}

export async function updateAgentExecutionTime(
  id: string,
  lastRun: Date,
  nextRun?: Date | null
): Promise<void> {
  await query(
    `UPDATE chief_agents 
     SET last_run_at = $1, 
         next_run_at = COALESCE($2, next_run_at),
         updated_at = NOW() 
     WHERE id = $3;`,
    [lastRun.toISOString(), nextRun ? nextRun.toISOString() : null, id]
  );
}

export async function incrementAgentStats(
  id: string,
  success: boolean,
  itemsProduced = 0,
  tokens = 0,
  costUsd = 0
): Promise<void> {
  await query(
    `UPDATE chief_agents
     SET stats = jsonb_set(
       jsonb_set(
         jsonb_set(
           jsonb_set(
             jsonb_set(
               stats,
               '{total_runs}',
               (COALESCE((stats->>'total_runs')::int, 0) + 1)::text::jsonb
             ),
             '{successful_runs}',
             (COALESCE((stats->>'successful_runs')::int, 0) + ${success ? 1 : 0})::text::jsonb
           ),
           '{failed_runs}',
           (COALESCE((stats->>'failed_runs')::int, 0) + ${success ? 0 : 1})::text::jsonb
         ),
         '{items_produced}',
         (COALESCE((stats->>'items_produced')::int, 0) + ${itemsProduced})::text::jsonb
       ),
       '{estimated_tokens}',
       (COALESCE((stats->>'estimated_tokens')::int, 0) + ${tokens})::text::jsonb
     ),
     updated_at = NOW()
     WHERE id = $1;`,
    [id]
  );
}

// ============================================================================
// 2. Task Queue Operations
// ============================================================================

export async function createChiefTask(params: {
  agentId: string;
  taskType: string;
  payload?: Record<string, any>;
  priority?: number;
}): Promise<string> {
  const taskId = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  await query(
    `INSERT INTO chief_tasks (id, agent_id, task_type, status, priority, payload, created_at, updated_at)
     VALUES ($1, $2, $3, 'pending', $4, $5, NOW(), NOW());`,
    [
      taskId,
      params.agentId,
      params.taskType,
      params.priority || 5,
      JSON.stringify(params.payload || {}),
    ]
  );
  return taskId;
}

export async function updateChiefTaskStatus(
  taskId: string,
  status: TaskStatus,
  result?: Record<string, any>,
  errorDetails?: string | null,
  durationMs?: number,
  tokensUsed?: number
): Promise<void> {
  await query(
    `UPDATE chief_tasks
     SET status = $1,
         result = COALESCE($2, result),
         error_details = COALESCE($3, error_details),
         duration_ms = COALESCE($4, duration_ms),
         tokens_used = COALESCE($5, tokens_used),
         completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
         updated_at = NOW()
     WHERE id = $6;`,
    [
      status,
      result ? JSON.stringify(result) : null,
      errorDetails || null,
      durationMs || 0,
      tokensUsed || 0,
      taskId,
    ]
  );
}

export async function getRecentTasks(limit = 20): Promise<ChiefTask[]> {
  const rows = await query<ChiefTask>(
    `SELECT * FROM chief_tasks ORDER BY created_at DESC LIMIT $1;`,
    [limit]
  );
  return rows || [];
}

// ============================================================================
// 3. Content Drafts Operations (Approvals Queue)
// ============================================================================

export async function createContentDraft(params: {
  agentId: string;
  draftType: ChiefContentDraft['draft_type'];
  title: string;
  excerpt?: string;
  content: string;
  metadata?: Record<string, any>;
  status?: DraftStatus;
  content_hash?: string;
  idempotency_key?: string;
  target_url?: string;
}): Promise<string> {
  const draftId = `draft_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  await query(
    `INSERT INTO chief_content_drafts 
      (id, agent_id, draft_type, title, excerpt, content, metadata, status, content_hash, idempotency_key, target_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW());`,
    [
      draftId,
      params.agentId,
      params.draftType,
      sanitizeEmDashes(params.title),
      params.excerpt ? sanitizeEmDashes(params.excerpt) : "",
      sanitizeEmDashes(params.content),
      JSON.stringify(sanitizeAiContent(params.metadata || {})),
      params.status || 'pending_approval',
      params.content_hash || null,
      params.idempotency_key || null,
      params.target_url || null,
    ]
  );
  return draftId;
}

export async function getDrafts(status?: DraftStatus, limit = 50): Promise<ChiefContentDraft[]> {
  if (status) {
    return query<ChiefContentDraft>(
      `SELECT * FROM chief_content_drafts WHERE status = $1 ORDER BY created_at DESC LIMIT $2;`,
      [status, limit]
    );
  }
  return query<ChiefContentDraft>(
    `SELECT * FROM chief_content_drafts ORDER BY created_at DESC LIMIT $1;`,
    [limit]
  );
}

export async function getDraftById(draftId: string): Promise<ChiefContentDraft | null> {
  const rows = await query<ChiefContentDraft>(
    `SELECT * FROM chief_content_drafts WHERE id = $1 LIMIT 1;`,
    [draftId]
  );
  return rows[0] || null;
}

export async function updateDraftContent(
  draftId: string,
  updates: {
    title?: string;
    excerpt?: string;
    content?: string;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const params: any[] = [];
  let pIdx = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${pIdx++}`);
    params.push(updates.title);
  }
  if (updates.excerpt !== undefined) {
    fields.push(`excerpt = $${pIdx++}`);
    params.push(updates.excerpt);
  }
  if (updates.content !== undefined) {
    fields.push(`content = $${pIdx++}`);
    params.push(updates.content);
  }
  if (updates.metadata !== undefined) {
    fields.push(`metadata = $${pIdx++}`);
    params.push(JSON.stringify(updates.metadata));
  }

  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) return true;

  params.push(draftId);
  await query(
    `UPDATE chief_content_drafts SET ${fields.join(', ')} WHERE id = $${pIdx};`,
    params
  );
  return true;
}

export async function updateDraftStatus(
  draftId: string,
  status: DraftStatus,
  rejectionReason?: string
): Promise<boolean> {
  await query(
    `UPDATE chief_content_drafts 
     SET status = $1,
         rejection_reason = $2,
         approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
         published_at = CASE WHEN $1 = 'published' THEN NOW() ELSE published_at END,
         updated_at = NOW()
     WHERE id = $3;`,
    [status, rejectionReason || null, draftId]
  );
  return true;
}

export async function deleteDraftsBulk(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  await query(`DELETE FROM chief_content_drafts WHERE id = ANY($1::text[]);`, [ids]);
  return true;
}

// ============================================================================
// 4. Website Health Audits Operations
// ============================================================================

export async function recordHealthAudit(params: {
  auditType: ChiefHealthAudit['audit_type'];
  routesChecked: any[];
  issuesFound: any[];
  lighthouseScores: any;
  status: ChiefHealthAudit['status'];
  summary: string;
  durationMs: number;
}): Promise<string> {
  const auditId = `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  await query(
    `INSERT INTO chief_health_audits
      (id, audit_type, routes_checked, issues_found, lighthouse_scores, status, summary, duration_ms, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());`,
    [
      auditId,
      params.auditType,
      JSON.stringify(params.routesChecked),
      JSON.stringify(params.issuesFound),
      JSON.stringify(params.lighthouseScores),
      params.status,
      params.summary,
      params.durationMs,
    ]
  );
  return auditId;
}

export async function getLatestHealthAudit(): Promise<ChiefHealthAudit | null> {
  const rows = await query<ChiefHealthAudit>(
    `SELECT * FROM chief_health_audits ORDER BY created_at DESC LIMIT 1;`
  );
  return rows[0] || null;
}

export async function getRecentHealthAudits(limit = 10): Promise<ChiefHealthAudit[]> {
  return query<ChiefHealthAudit>(
    `SELECT * FROM chief_health_audits ORDER BY created_at DESC LIMIT $1;`,
    [limit]
  );
}

// ============================================================================
// 5. SEO Recommendations Operations
// ============================================================================

export async function recordSeoRecommendation(params: {
  pageUrl: string;
  issue: string;
  evidence: string;
  suggestedChange: string;
  expectedBenefit: string;
  riskLevel?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}): Promise<string> {
  const recId = `seo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  await query(
    `INSERT INTO chief_seo_recommendations
      (id, page_url, issue, evidence, suggested_change, expected_benefit, risk_level, status, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, NOW(), NOW());`,
    [
      recId,
      params.pageUrl,
      params.issue,
      params.evidence,
      params.suggestedChange,
      params.expectedBenefit,
      params.riskLevel || 'low',
      JSON.stringify(params.metadata || {}),
    ]
  );
  return recId;
}

export async function getSeoRecommendations(status = 'open', limit = 20): Promise<ChiefSeoRecommendation[]> {
  return query<ChiefSeoRecommendation>(
    `SELECT * FROM chief_seo_recommendations WHERE status = $1 ORDER BY created_at DESC LIMIT $2;`,
    [status, limit]
  );
}

export async function updateSeoRecommendationStatus(
  id: string,
  status: 'open' | 'approved' | 'applied' | 'dismissed'
): Promise<boolean> {
  await query(
    `UPDATE chief_seo_recommendations SET status = $1, updated_at = NOW() WHERE id = $2;`,
    [status, id]
  );
  return true;
}

// ============================================================================
// 6. Activity Logs Operations
// ============================================================================

export async function logChiefActivity(
  agentId: string | null,
  level: ChiefActivityLog['level'],
  action: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    await query(
      `INSERT INTO chief_activity_logs (agent_id, level, action, details, created_at)
       VALUES ($1, $2, $3, $4, NOW());`,
      [agentId, level, action, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('[Chief of Staff DB] Activity log write error:', err);
  }
}

export async function getRecentActivityLogs(limit = 50): Promise<ChiefActivityLog[]> {
  return query<ChiefActivityLog>(
    `SELECT * FROM chief_activity_logs ORDER BY created_at DESC LIMIT $1;`,
    [limit]
  );
}

// ============================================================================
// 7. Dashboard Summary Aggregator
// ============================================================================

export async function getChiefDashboardSummary(): Promise<ChiefDashboardSummary> {
  const [agents, recentDrafts, latestHealth, openSeo, recentLogs] = await Promise.all([
    getAllAgents(),
    getDrafts(undefined, 10),
    getLatestHealthAudit(),
    getSeoRecommendations('open', 10),
    getRecentActivityLogs(25),
  ]);

  const activeAgentsCount = agents.filter((a) => a.status === 'enabled').length;
  const pausedAgentsCount = agents.filter((a) => a.status === 'paused').length;

  const pendingDraftsCount = recentDrafts.filter(
    (d) => d.status === 'pending_approval'
  ).length;

  // Aggregate stats across all agents
  let totalRuns = 0;
  let successfulRuns = 0;
  let totalItemsProduced = 0;
  let estimatedTokens = 0;
  let estimatedCostUsd = 0;

  for (const agent of agents) {
    const s = agent.stats || {};
    totalRuns += Number(s.total_runs || 0);
    successfulRuns += Number(s.successful_runs || 0);
    totalItemsProduced += Number(s.items_produced || 0);
    estimatedTokens += Number(s.estimated_tokens || 0);
    estimatedCostUsd += Number(s.estimated_cost_usd || 0);
  }

  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;

  return {
    agents,
    activeAgentsCount,
    pausedAgentsCount,
    pendingTasksCount: 0,
    draftsAwaitingApprovalCount: pendingDraftsCount,
    recentDrafts,
    latestHealthAudit: latestHealth,
    openSeoRecommendationsCount: openSeo.length,
    recentSeoRecommendations: openSeo,
    recentLogs,
    metrics: {
      totalRuns,
      successRate,
      totalDraftsProduced: totalItemsProduced,
      estimatedTokens,
      estimatedCostUsd,
    },
  };
}

