import { query } from '../outreach/db';

export interface CompanyMemoryRecord {
  id: string;
  scope: 'company' | 'department' | 'employee' | 'meeting';
  department?: string | null;
  employee_id?: string | null;
  discussion_id?: string | null;
  category: 'strategy' | 'decision' | 'learning' | 'performance_benchmark' | 'market_intelligence' | 'failed_experiment';
  insight: string;
  metadata: Record<string, any>;
  confidence_score: number;
  created_at: string;
}

/**
 * Persist an insight into company memory
 */
export async function recordCompanyMemory(params: {
  scope: 'company' | 'department' | 'employee' | 'meeting';
  category: 'strategy' | 'decision' | 'learning' | 'performance_benchmark' | 'market_intelligence' | 'failed_experiment';
  insight: string;
  department?: string;
  employeeId?: string;
  discussionId?: string;
  metadata?: Record<string, any>;
  confidenceScore?: number;
}): Promise<CompanyMemoryRecord> {
  const res = await query<CompanyMemoryRecord>(
    `
    INSERT INTO company_memory (
      scope, department, employee_id, discussion_id, category, insight, metadata, confidence_score
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
    `,
    [
      params.scope,
      params.department || null,
      params.employeeId || null,
      params.discussionId || null,
      params.category,
      params.insight,
      JSON.stringify(params.metadata || {}),
      params.confidenceScore ?? 1.0,
    ]
  );

  return res[0];
}

/**
 * Retrieve tiered company memories relevant to a discussion or agent
 */
export async function getRelevantCompanyMemories(params: {
  department?: string;
  employeeId?: string;
  limit?: number;
}): Promise<CompanyMemoryRecord[]> {
  const limit = params.limit || 8;
  const conditions: string[] = [`scope = 'company'`];
  const values: any[] = [];

  let idx = 1;
  if (params.department) {
    conditions.push(`(scope = 'department' AND department = $${idx++})`);
    values.push(params.department);
  }
  if (params.employeeId) {
    conditions.push(`(scope = 'employee' AND employee_id = $${idx++})`);
    values.push(params.employeeId);
  }

  values.push(limit);

  const sql = `
    SELECT *
    FROM company_memory
    WHERE (${conditions.join(' OR ')})
    ORDER BY created_at DESC
    LIMIT $${idx};
  `;

  return await query<CompanyMemoryRecord>(sql, values);
}

/**
 * Format memories into prompt-ready context string
 */
export function formatMemoriesForPrompt(memories: CompanyMemoryRecord[]): string {
  if (!memories || memories.length === 0) {
    return 'No historical company memories recorded yet.';
  }

  return memories
    .map(
      (m) =>
        `- [${m.scope.toUpperCase()}:${m.category.toUpperCase()}] ${m.insight} (Confidence: ${Math.round((m.confidence_score || 1) * 100)}%)`
    )
    .join('\n');
}
