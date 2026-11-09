import { query } from '../outreach/db';
import {
  CompanyEmployee,
  CompanyRoom,
  CompanyDiscussion,
  CompanyMessage,
  CompanyTask,
  CompanyProposal,
  CompanyMemory,
  CompanyOverviewSummary,
  EmployeeStatus,
  TaskStatus,
  ProposalStatus,
  DiscussionConclusion,
  MessageType,
  MemoryScope,
  MemoryCategory,
} from './types';

// ============================================================================
// 1. Employee Operations
// ============================================================================

export async function getAllEmployees(): Promise<CompanyEmployee[]> {
  const rows = await query<CompanyEmployee>(`
    SELECT * FROM company_employees 
    ORDER BY 
      CASE department
        WHEN 'Executive' THEN 1
        WHEN 'Growth' THEN 2
        WHEN 'Editorial' THEN 3
        WHEN 'Infrastructure' THEN 4
        WHEN 'Sales' THEN 5
        WHEN 'Client Solutions' THEN 6
        ELSE 7
      END ASC, name ASC;
  `);
  return rows || [];
}

export async function getEmployeeById(id: string): Promise<CompanyEmployee | null> {
  const rows = await query<CompanyEmployee>(
    `SELECT * FROM company_employees WHERE id = $1 LIMIT 1;`,
    [id]
  );
  return rows[0] || null;
}

export async function updateEmployeeStatus(
  id: string,
  status: EmployeeStatus,
  currentActivity?: string | null
): Promise<boolean> {
  await query(
    `UPDATE company_employees 
     SET status = $1, 
         current_activity = COALESCE($2, current_activity), 
         updated_at = NOW() 
     WHERE id = $3;`,
    [status, currentActivity ?? null, id]
  );
  return true;
}

export async function updateEmployeeMetrics(
  id: string,
  tasksDelta = 0,
  proposalsApprovedDelta = 0,
  proposalsRejectedDelta = 0,
  tokensDelta = 0
): Promise<void> {
  await query(
    `UPDATE company_employees
     SET performance_metrics = jsonb_set(
           jsonb_set(
             jsonb_set(
               jsonb_set(
                 performance_metrics,
                 '{tasks_completed}',
                 ((COALESCE(performance_metrics->>'tasks_completed', '0')::int + $1)::text)::jsonb
               ),
               '{proposals_approved}',
               ((COALESCE(performance_metrics->>'proposals_approved', '0')::int + $2)::text)::jsonb
             ),
             '{proposals_rejected}',
             ((COALESCE(performance_metrics->>'proposals_rejected', '0')::int + $3)::text)::jsonb
           ),
           '{total_tokens}',
           ((COALESCE(performance_metrics->>'total_tokens', '0')::bigint + $4)::text)::jsonb
         ),
         updated_at = NOW()
     WHERE id = $5;`,
    [tasksDelta, proposalsApprovedDelta, proposalsRejectedDelta, tokensDelta, id]
  );
}

export async function createOrUpdateEmployee(emp: Partial<CompanyEmployee> & { id: string; name: string }): Promise<CompanyEmployee> {
  const rows = await query<CompanyEmployee>(
    `INSERT INTO company_employees (
       id, legacy_agent_id, name, display_title, department, avatar_url, bio,
       personality_archetype, system_prompt_overlay, model_preference, status,
       current_activity, tool_permissions, performance_metrics, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
     ) ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       display_title = EXCLUDED.display_title,
       department = EXCLUDED.department,
       bio = EXCLUDED.bio,
       personality_archetype = EXCLUDED.personality_archetype,
       system_prompt_overlay = EXCLUDED.system_prompt_overlay,
       model_preference = EXCLUDED.model_preference,
       tool_permissions = EXCLUDED.tool_permissions,
       updated_at = NOW()
     RETURNING *;`,
    [
      emp.id,
      emp.legacy_agent_id || null,
      emp.name,
      emp.display_title || 'AI Specialist',
      emp.department || 'Growth',
      emp.avatar_url || `/assets/avatars/${emp.id}.svg`,
      emp.bio || 'Autonomous specialist at HeyPrince.',
      emp.personality_archetype || 'Analytical & Rigorous',
      emp.system_prompt_overlay || `You are ${emp.name} at HeyPrince.`,
      emp.model_preference || 'gemini-3.5-flash',
      emp.status || 'idle',
      emp.current_activity || 'Available for assignment',
      JSON.stringify(emp.tool_permissions || { allowed_tools: [], requires_approval: ['publish_content'] }),
      JSON.stringify(emp.performance_metrics || { tasks_completed: 0, proposals_approved: 0, proposals_rejected: 0, total_tokens: 0, rating: 5.0 }),
    ]
  );
  return rows[0];
}

// ============================================================================
// 2. Collaboration Room Operations
// ============================================================================

export async function getAllRooms(): Promise<CompanyRoom[]> {
  const rooms = await query<CompanyRoom>(`SELECT * FROM company_rooms ORDER BY name ASC;`);
  
  // Attach latest discussion for each room (active or concluded)
  for (const r of rooms) {
    const latest = await query<CompanyDiscussion>(
      `SELECT * FROM company_discussions WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1;`,
      [r.id]
    );
    r.active_discussion = latest[0] || null;
  }
  return rooms;
}

export async function getRoomById(id: string): Promise<CompanyRoom | null> {
  const rows = await query<CompanyRoom>(`SELECT * FROM company_rooms WHERE id = $1 LIMIT 1;`, [id]);
  return rows[0] || null;
}

export async function getLatestDiscussionForRoom(roomId: string): Promise<CompanyDiscussion | null> {
  const rows = await query<CompanyDiscussion>(
    `SELECT * FROM company_discussions WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1;`,
    [roomId]
  );
  return rows[0] || null;
}

// ============================================================================
// 3. Discussion & Turn Operations
// ============================================================================

export async function createDiscussion(params: {
  roomId: string;
  title: string;
  objective: string;
  moderatorId?: string;
  participantIds: string[];
  tokenBudget?: number;
  maxTurns?: number;
}): Promise<CompanyDiscussion> {
  const moderator = params.moderatorId || 'alex_vance';
  let participants = Array.from(new Set(params.participantIds?.filter(Boolean) || []));

  // If participants empty or only moderator, populate intelligent room defaults
  if (participants.length === 0 || (participants.length === 1 && participants[0] === moderator)) {
    if (params.roomId === 'war_room' || params.roomId === 'daily_standup') {
      participants = ['alex_vance', 'david_chen', 'elena_rostova', 'marcus_sterling', 'liam_thorne', 'sophia_reynolds'];
    } else if (params.roomId === 'growth_sales') {
      participants = ['alex_vance', 'elena_rostova', 'liam_thorne', 'sophia_reynolds'];
    } else if (params.roomId === 'innovation_lab') {
      participants = ['alex_vance', 'marcus_sterling', 'elena_rostova', 'david_chen'];
    } else if (params.roomId === 'dev_room') {
      participants = ['alex_vance', 'david_chen', 'elena_rostova'];
    } else {
      participants = ['alex_vance', 'marcus_sterling', 'david_chen'];
    }
  }

  if (!participants.includes(moderator)) {
    participants.unshift(moderator);
  }

  const rows = await query<CompanyDiscussion>(
    `INSERT INTO company_discussions (
       room_id, title, objective, moderator_id, participant_ids, status,
       token_budget, tokens_consumed, turn_count, max_turns, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, 'in_progress', $6, 0, 0, $7, NOW(), NOW()
     ) RETURNING *;`,
    [
      params.roomId,
      params.title,
      params.objective,
      moderator,
      participants,
      params.tokenBudget || 4000,
      params.maxTurns ?? 0,
    ]
  );

  const disc = rows[0];

  // Set participant employees to in_meeting
  for (const pid of participants) {
    await updateEmployeeStatus(pid, 'in_meeting', `Attending '${params.title}' in ${params.roomId}`);
  }

  return disc;
}

export async function getDiscussionById(id: string): Promise<CompanyDiscussion | null> {
  const rows = await query<CompanyDiscussion>(
    `SELECT * FROM company_discussions WHERE id = $1 LIMIT 1;`,
    [id]
  );
  return rows[0] || null;
}

export async function getActiveDiscussions(limit = 10): Promise<CompanyDiscussion[]> {
  return await query<CompanyDiscussion>(
    `SELECT * FROM company_discussions WHERE status = 'in_progress' ORDER BY updated_at DESC LIMIT $1;`,
    [limit]
  );
}

export async function updateDiscussionTurn(
  id: string,
  turnIncrement = 1,
  tokensConsumedDelta = 0
): Promise<void> {
  await query(
    `UPDATE company_discussions
     SET turn_count = turn_count + $1,
         tokens_consumed = tokens_consumed + $2,
         updated_at = NOW()
     WHERE id = $3;`,
    [turnIncrement, tokensConsumedDelta, id]
  );
}

export async function concludeDiscussion(
  id: string,
  conclusion: DiscussionConclusion
): Promise<CompanyDiscussion> {
  const rows = await query<CompanyDiscussion>(
    `UPDATE company_discussions
     SET status = 'concluded',
         conclusion = $1,
         concluded_at = NOW(),
         updated_at = NOW()
     WHERE id = $2
     RETURNING *;`,
    [JSON.stringify(conclusion), id]
  );

  const disc = rows[0];

  // Release participants back to idle
  if (disc?.participant_ids) {
    for (const pid of disc.participant_ids) {
      await updateEmployeeStatus(pid, 'idle', 'Available for assignment');
    }
  }

  // Record meeting summary to company_memory
  if (disc) {
    await recordCompanyMemory({
      scope: 'meeting',
      discussionId: disc.id,
      category: 'decision',
      insight: conclusion.summary,
      metadata: conclusion,
    });
  }

  return disc;
}

// ============================================================================
// 4. Message Operations
// ============================================================================

export async function getDiscussionMessages(discussionId: string): Promise<CompanyMessage[]> {
  return await query<CompanyMessage>(
    `SELECT 
       m.*, 
       COALESCE(e.name, CASE WHEN m.sender_id = 'prince_ceo' THEN 'Prince (CEO)' ELSE m.sender_id END) as sender_name, 
       COALESCE(e.display_title, CASE WHEN m.sender_id = 'prince_ceo' THEN 'Chief Executive Officer' ELSE 'Specialist' END) as sender_role, 
       COALESCE(e.avatar_url, '/assets/cropped-prince-profile.webp') as sender_avatar
     FROM company_messages m
     LEFT JOIN company_employees e ON m.sender_id = e.id
     WHERE m.discussion_id = $1
     ORDER BY m.created_at ASC;`,
    [discussionId]
  );
}

export async function insertCompanyMessage(params: {
  discussionId: string;
  senderId: string;
  messageType: MessageType;
  content: string;
  evidence?: Record<string, any>;
  tokensUsed?: number;
}): Promise<CompanyMessage> {
  const rows = await query<CompanyMessage>(
    `INSERT INTO company_messages (
       discussion_id, sender_id, message_type, content, evidence, tokens_used, created_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, NOW()
     ) RETURNING *;`,
    [
      params.discussionId,
      params.senderId,
      params.messageType,
      params.content,
      JSON.stringify(params.evidence || {}),
      params.tokensUsed || 50,
    ]
  );

  const msg = rows[0];
  if (params.senderId === 'prince_ceo') {
    msg.sender_name = 'Prince (CEO)';
    msg.sender_role = 'Chief Executive Officer';
    msg.sender_avatar = '/assets/cropped-prince-profile.webp';
  } else {
    const sender = await getEmployeeById(params.senderId);
    if (sender) {
      msg.sender_name = sender.name;
      msg.sender_role = sender.display_title;
      msg.sender_avatar = sender.avatar_url;
    }
  }
  return msg;
}

// ============================================================================
// 5. Task Orchestration Operations
// ============================================================================

export async function createCompanyTask(params: {
  discussionId?: string | null;
  proposalId?: string | null;
  assignedTo: string;
  assignedBy?: string;
  reviewerId?: string | null;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dependsOnTaskIds?: string[];
  executionPayload?: Record<string, any>;
  dueDate?: string | null;
}): Promise<CompanyTask> {
  const assignedBy = params.assignedBy || 'alex_vance';
  const reviewerId = params.reviewerId || (assignedBy !== params.assignedTo ? assignedBy : 'alex_vance');

  const rows = await query<CompanyTask>(
    `INSERT INTO company_tasks (
       discussion_id, proposal_id, assigned_to, assigned_by, reviewer_id,
       title, description, acceptance_criteria, status, priority,
       depends_on_task_ids, execution_payload, due_date, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, NOW(), NOW()
     ) RETURNING *;`,
    [
      params.discussionId || null,
      params.proposalId || null,
      params.assignedTo,
      assignedBy,
      reviewerId,
      params.title,
      params.description,
      params.acceptanceCriteria,
      params.priority || 'medium',
      params.dependsOnTaskIds || [],
      JSON.stringify(params.executionPayload || {}),
      params.dueDate || null,
    ]
  );
  return rows[0];
}

export async function getCompanyTasks(filters?: {
  assignedTo?: string;
  status?: TaskStatus;
  limit?: number;
}): Promise<CompanyTask[]> {
  let sql = `
    SELECT 
      t.*,
      row_to_json(ae) as assignee,
      row_to_json(re) as reviewer
    FROM company_tasks t
    LEFT JOIN company_employees ae ON t.assigned_to = ae.id
    LEFT JOIN company_employees re ON t.reviewer_id = re.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.assignedTo) {
    params.push(filters.assignedTo);
    sql += ` AND t.assigned_to = $${params.length}`;
  }
  if (filters?.status) {
    params.push(filters.status);
    sql += ` AND t.status = $${params.length}`;
  }

  sql += ` ORDER BY 
    CASE t.priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      ELSE 4 
    END ASC, t.created_at DESC`;

  if (filters?.limit) {
    params.push(filters.limit);
    sql += ` LIMIT $${params.length}`;
  }

  return await query<CompanyTask>(sql, params);
}

export async function getCompanyTaskById(id: string): Promise<CompanyTask | null> {
  const rows = await query<CompanyTask>(
    `SELECT 
       t.*,
       row_to_json(ae) as assignee,
       row_to_json(re) as reviewer
     FROM company_tasks t
     LEFT JOIN company_employees ae ON t.assigned_to = ae.id
     LEFT JOIN company_employees re ON t.reviewer_id = re.id
     WHERE t.id = $1 LIMIT 1;`,
    [id]
  );
  return rows[0] || null;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  outputResult?: Record<string, any>,
  verificationNotes?: string | null
): Promise<CompanyTask | null> {
  const completedAt = status === 'completed' ? 'NOW()' : 'NULL';
  const startedAt = status === 'in_progress' ? 'COALESCE(started_at, NOW())' : 'started_at';

  const rows = await query<CompanyTask>(
    `UPDATE company_tasks
     SET status = $1,
         output_result = COALESCE($2, output_result),
         verification_notes = COALESCE($3, verification_notes),
         started_at = ${startedAt},
         completed_at = ${completedAt},
         updated_at = NOW()
     WHERE id = $4
     RETURNING *;`,
    [status, outputResult ? JSON.stringify(outputResult) : null, verificationNotes ?? null, id]
  );

  const task = rows[0];
  if (task && status === 'completed') {
    await updateEmployeeMetrics(task.assigned_to, 1, 0, 0, 500);
  }
  return task || null;
}

// ============================================================================
// 6. CEO Proposal Operations
// ============================================================================

export async function createProposal(params: {
  discussionId?: string | null;
  sponsoredBy: string;
  title: string;
  proposalType: 'publish_content' | 'outreach_campaign' | 'site_modification' | 'new_agent_activation' | 'financial_expense';
  businessJustification: string;
  actionPayload: Record<string, any>;
  estimatedCostUsd?: number;
}): Promise<CompanyProposal> {
  const rows = await query<CompanyProposal>(
    `INSERT INTO company_proposals (
       discussion_id, sponsored_by, title, proposal_type, business_justification,
       action_payload, estimated_cost_usd, status, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, 'pending_approval', NOW(), NOW()
     ) RETURNING *;`,
    [
      params.discussionId || null,
      params.sponsoredBy,
      params.title,
      params.proposalType,
      params.businessJustification,
      JSON.stringify(params.actionPayload),
      params.estimatedCostUsd || 0,
    ]
  );
  return rows[0];
}

export async function getCompanyProposals(status?: ProposalStatus): Promise<CompanyProposal[]> {
  let sql = `
    SELECT 
      p.*,
      row_to_json(e) as sponsor
    FROM company_proposals p
    LEFT JOIN company_employees e ON p.sponsored_by = e.id
  `;
  const params: any[] = [];
  if (status) {
    params.push(status);
    sql += ` WHERE p.status = $1`;
  }
  sql += ` ORDER BY p.created_at DESC;`;
  return await query<CompanyProposal>(sql, params);
}

export async function getCompanyProposalById(id: string): Promise<CompanyProposal | null> {
  const rows = await query<CompanyProposal>(
    `SELECT 
       p.*,
       row_to_json(e) as sponsor
     FROM company_proposals p
     LEFT JOIN company_employees e ON p.sponsored_by = e.id
     WHERE p.id = $1 LIMIT 1;`,
    [id]
  );
  return rows[0] || null;
}

export async function updateProposalStatus(
  id: string,
  status: ProposalStatus,
  ceoFeedback?: string | null
): Promise<CompanyProposal | null> {
  const approvedAt = status === 'approved' ? 'NOW()' : 'NULL';

  const rows = await query<CompanyProposal>(
    `UPDATE company_proposals
     SET status = $1,
         ceo_feedback = COALESCE($2, ceo_feedback),
         approved_at = ${approvedAt},
         updated_at = NOW()
     WHERE id = $3
     RETURNING *;`,
    [status, ceoFeedback ?? null, id]
  );

  const prop = rows[0];
  if (prop) {
    if (status === 'approved') {
      await updateEmployeeMetrics(prop.sponsored_by, 0, 1, 0, 0);
    } else if (status === 'rejected') {
      await updateEmployeeMetrics(prop.sponsored_by, 0, 0, 1, 0);
    }
  }
  return prop || null;
}

export async function markProposalExecuted(id: string): Promise<void> {
  await query(
    `UPDATE company_proposals SET executed_at = NOW(), updated_at = NOW() WHERE id = $1;`,
    [id]
  );
}

// ============================================================================
// 7. Multi-Tier Memory Store Operations
// ============================================================================

export async function recordCompanyMemory(params: {
  scope: MemoryScope;
  department?: string | null;
  employeeId?: string | null;
  discussionId?: string | null;
  category: MemoryCategory;
  insight: string;
  metadata?: Record<string, any>;
  confidenceScore?: number;
}): Promise<CompanyMemory> {
  const rows = await query<CompanyMemory>(
    `INSERT INTO company_memory (
       scope, department, employee_id, discussion_id, category,
       insight, metadata, confidence_score, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
     ) RETURNING *;`,
    [
      params.scope,
      params.department || null,
      params.employeeId || null,
      params.discussionId || null,
      params.category,
      params.insight,
      JSON.stringify(params.metadata || {}),
      params.confidenceScore || 1.0,
    ]
  );
  return rows[0];
}

export async function queryCompanyMemory(options?: {
  scope?: MemoryScope;
  category?: MemoryCategory;
  employeeId?: string;
  limit?: number;
}): Promise<CompanyMemory[]> {
  let sql = `SELECT * FROM company_memory WHERE 1=1`;
  const params: any[] = [];

  if (options?.scope) {
    params.push(options.scope);
    sql += ` AND scope = $${params.length}`;
  }
  if (options?.category) {
    params.push(options.category);
    sql += ` AND category = $${params.length}`;
  }
  if (options?.employeeId) {
    params.push(options.employeeId);
    sql += ` AND employee_id = $${params.length}`;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1};`;
  params.push(options?.limit || 20);

  return await query<CompanyMemory>(sql, params);
}

// ============================================================================
// 8. Executive Overview Aggregator
// ============================================================================

export async function getCompanyOverview(): Promise<CompanyOverviewSummary> {
  const employees = await getAllEmployees();
  const rooms = await getAllRooms();
  const activeDiscussions = await getActiveDiscussions();

  const propCountRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM company_proposals WHERE status = 'pending_approval';`
  );
  const taskCountRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM company_tasks WHERE status IN ('pending', 'in_progress', 'review_ready');`
  );
  const tokenRows = await query<{ sum: string }>(
    `SELECT COALESCE(SUM(tokens_consumed), 0)::text as sum FROM company_discussions;`
  );

  return {
    employees,
    rooms,
    activeDiscussions,
    pendingProposalsCount: parseInt(propCountRows[0]?.count || '0', 10),
    openTasksCount: parseInt(taskCountRows[0]?.count || '0', 10),
    totalTokensConsumed: parseInt(tokenRows[0]?.sum || '0', 10),
    systemHealth: 'healthy',
  };
}
