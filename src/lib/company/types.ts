export type EmployeeStatus =
  | 'idle'
  | 'thinking'
  | 'researching'
  | 'in_meeting'
  | 'working'
  | 'waiting_for_approval'
  | 'blocked'
  | 'reviewing'
  | 'offline';

export type EmployeeDepartment =
  | 'Executive'
  | 'Growth'
  | 'Editorial'
  | 'Infrastructure'
  | 'Sales'
  | 'Product'
  | 'Analytics'
  | 'Client Solutions';

export interface ToolPermissions {
  allowed_tools: string[];
  requires_approval: string[];
}

export interface PerformanceMetrics {
  tasks_completed: number;
  proposals_approved: number;
  proposals_rejected: number;
  total_tokens: number;
  rating: number;
}

export interface CompanyEmployee {
  id: string;
  legacy_agent_id: string | null;
  name: string;
  display_title: string;
  department: EmployeeDepartment;
  avatar_url: string;
  bio: string;
  personality_archetype: string;
  system_prompt_overlay: string;
  model_preference: string;
  status: EmployeeStatus;
  current_activity: string | null;
  tool_permissions: ToolPermissions;
  performance_metrics: PerformanceMetrics;
  created_at: string;
  updated_at: string;
}

export type RoomType =
  | 'war_room'
  | 'daily_standup'
  | 'innovation_lab'
  | 'growth_sales'
  | 'dev_room';

export interface CompanyRoom {
  id: string;
  name: string;
  room_type: RoomType;
  description: string;
  icon_name: string;
  max_participants: number;
  created_at: string;
  active_discussion?: CompanyDiscussion | null;
}

export type DiscussionStatus =
  | 'in_progress'
  | 'concluded'
  | 'converted_to_task'
  | 'cancelled';

export interface DiscussionConclusion {
  summary: string;
  recommendedAction:
    | 'publish_content'
    | 'outreach_campaign'
    | 'site_modification'
    | 'new_agent_activation'
    | 'internal_task'
    | 'dismiss';
  actionTitle: string;
  businessJustification: string;
  assignedTo: string;
  actionPayload?: Record<string, any>;
}

export interface CompanyDiscussion {
  id: string;
  room_id: string;
  title: string;
  objective: string;
  moderator_id: string;
  participant_ids: string[];
  status: DiscussionStatus;
  token_budget: number;
  tokens_consumed: number;
  turn_count: number;
  max_turns: number;
  conclusion: DiscussionConclusion | null;
  created_at: string;
  concluded_at: string | null;
  updated_at: string;
}

export type MessageType =
  | 'statement'
  | 'proposal'
  | 'challenge'
  | 'evidence'
  | 'consensus'
  | 'dissent'
  | 'summary';

export interface CompanyMessage {
  id: number;
  discussion_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string;
  evidence: Record<string, any>;
  tokens_used: number;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
  sender_avatar?: string;
}

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'review_ready'
  | 'completed'
  | 'blocked'
  | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CompanyTask {
  id: string;
  discussion_id: string | null;
  proposal_id: string | null;
  assigned_to: string;
  assigned_by: string;
  reviewer_id: string | null;
  title: string;
  description: string;
  acceptance_criteria: string[];
  status: TaskStatus;
  priority: TaskPriority;
  depends_on_task_ids: string[];
  execution_payload: Record<string, any>;
  output_result: Record<string, any>;
  verification_notes: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: CompanyEmployee;
  reviewer?: CompanyEmployee;
}

export type ProposalType =
  | 'publish_content'
  | 'outreach_campaign'
  | 'site_modification'
  | 'new_agent_activation'
  | 'financial_expense';

export type ProposalStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'expired';

export interface CompanyProposal {
  id: string;
  discussion_id: string | null;
  sponsored_by: string;
  title: string;
  proposal_type: ProposalType;
  business_justification: string;
  action_payload: Record<string, any>;
  estimated_cost_usd: number;
  status: ProposalStatus;
  ceo_feedback: string | null;
  approved_at: string | null;
  executed_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  sponsor?: CompanyEmployee;
}

export type MemoryScope = 'company' | 'department' | 'employee' | 'meeting';

export type MemoryCategory =
  | 'strategy'
  | 'decision'
  | 'learning'
  | 'performance_benchmark'
  | 'market_intelligence'
  | 'failed_experiment';

export interface CompanyMemory {
  id: string;
  scope: MemoryScope;
  department: string | null;
  employee_id: string | null;
  discussion_id: string | null;
  category: MemoryCategory;
  insight: string;
  metadata: Record<string, any>;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyOverviewSummary {
  employees: CompanyEmployee[];
  rooms: CompanyRoom[];
  activeDiscussions: CompanyDiscussion[];
  pendingProposalsCount: number;
  openTasksCount: number;
  totalTokensConsumed: number;
  systemHealth: 'healthy' | 'degraded' | 'offline';
}
