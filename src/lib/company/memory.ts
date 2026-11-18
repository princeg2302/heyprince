import { query } from '../outreach/db';
import { executeAICompletion } from '../ai/model-router';

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

/**
 * Autonomous Employee Learning Engine:
 * Extracts tactical business lessons, technical patterns, market findings,
 * or SEO insights from completed tasks and discussions, saving them to company_memory
 * so employees continuously learn, retain facts, and grow smarter every day.
 */
export async function extractAndRecordLearning(params: {
  employeeId: string;
  department: string;
  employeeName?: string;
  context: string;
  outputProduced: string;
}): Promise<CompanyMemoryRecord | null> {
  try {
    const prompt = `Context of completed work:
${params.context.slice(0, 800)}

Work / Message Output by ${params.employeeName || params.employeeId}:
${params.outputProduced.slice(0, 1000)}

Task: Extract 1 clear, actionable business or engineering insight learned from this work.
Return strictly valid JSON:
{
  "insight": "1 concise sentence stating the specific fact, metric, technical tactic, or customer insight learned (zero em-dashes)",
  "category": "learning" | "market_intelligence" | "performance_benchmark" | "strategy",
  "confidenceScore": 0.95
}`;

    const completion = await executeAICompletion({
      taskType: 'memory_learning',
      systemInstruction: 'You are an autonomous corporate knowledge compiler. Extract high-signal, factual learnings for employee memory banks. Strictly no em-dashes.',
      userPrompt: prompt,
      formatJson: true,
      temperatureOverride: 0.2,
      maxTokensOverride: 200,
    });

    if (completion.json?.insight && completion.json.insight.length > 10) {
      const insight = completion.json.insight.trim();
      const category = completion.json.category || 'learning';
      const confidence = typeof completion.json.confidenceScore === 'number' ? completion.json.confidenceScore : 0.95;

      return await recordCompanyMemory({
        scope: 'employee',
        department: params.department,
        employeeId: params.employeeId,
        category,
        insight,
        confidenceScore: confidence,
        metadata: {
          learnedAt: new Date().toISOString(),
          provider: completion.provider,
          model: completion.model,
        },
      });
    }
  } catch (err) {
    console.warn('[AutonomousLearning] Failed to extract learning:', err);
  }
  return null;
}

