import { sanitizeEmDashes } from '../ai-content-sanitizer';
import { CompanyEmployee } from './types';

export type CeoIntentCategory =
  | 'language_query'
  | 'general_question'
  | 'direct_instruction'
  | 'business_strategy'
  | 'task_assignment'
  | 'feedback'
  | 'approval_rejection'
  | 'new_idea'
  | 'urgent_issue';

export interface CeoRoutingDecision {
  category: CeoIntentCategory;
  primaryResponderId: string;
  supportingParticipantIds: string[];
  strategicContext: string;
  suggestedAction?: 'create_task' | 'run_audit' | 'pivot_discussion' | 'answer_directly' | 'prepare_proposal';
}

/**
 * Classifies Prince's input and selects the optimal specialist and supporting team
 */
export function classifyAndRouteCeoMessage(
  directive: string,
  employees: CompanyEmployee[]
): CeoRoutingDecision {
  const text = directive.trim().toLowerCase();

  // 1. Language queries (e.g., "Hindi kis kis ko aati hai?", "Who speaks Hindi?", etc.)
  if (
    text.includes('hindi') ||
    text.includes('kis kis ko') ||
    text.includes('bhasha') ||
    text.includes('language') ||
    text.includes('kisko aati') ||
    text.includes('kaun bolta')
  ) {
    return {
      category: 'language_query',
      primaryResponderId: 'alex_vance',
      supportingParticipantIds: ['elena_rostova', 'liam_thorne', 'sophia_reynolds'],
      strategicContext:
        'Prince is inquiring about language capabilities (specifically Hindi/English). Alex Vance must acknowledge and summarize the team language matrix, followed by Elena Rostova or Liam Thorne answering naturally in Hindi/Hinglish regarding their bilingual client and SEO capabilities.',
      suggestedAction: 'answer_directly',
    };
  }

  // 2. Urgent incidents or performance issues
  if (
    text.includes('down') ||
    text.includes('error') ||
    text.includes('500') ||
    text.includes('broken') ||
    text.includes('urgent') ||
    text.includes('crash') ||
    text.includes('emergency') ||
    text.includes('latency') ||
    text.includes('slow')
  ) {
    return {
      category: 'urgent_issue',
      primaryResponderId: 'david_chen',
      supportingParticipantIds: ['alex_vance'],
      strategicContext:
        'Prince reported an urgent stability or performance issue. David Chen (Infrastructure Sentinel) must immediately inspect latency and uptime baseline metrics.',
      suggestedAction: 'run_audit',
    };
  }

  // 3. Approval or Rejection
  if (
    text === 'approved' ||
    text === 'approve' ||
    text.startsWith('go ahead') ||
    text.startsWith('proceed') ||
    text === 'rejected' ||
    text === 'reject' ||
    text.startsWith('do not') ||
    text.startsWith('stop')
  ) {
    return {
      category: 'approval_rejection',
      primaryResponderId: 'alex_vance',
      supportingParticipantIds: [],
      strategicContext:
        'Prince gave an explicit approval or rejection directive. Alex Vance must process this against open proposals or tasks immediately.',
      suggestedAction: 'answer_directly',
    };
  }

  // 4. Pivot or Direct Instruction (e.g. "Stop working on this idea and research another opportunity")
  if (
    text.includes('stop working') ||
    text.includes('pivot') ||
    text.includes('switch to') ||
    text.includes('focus on') ||
    text.includes('drop this') ||
    text.startsWith('don\'t do')
  ) {
    return {
      category: 'direct_instruction',
      primaryResponderId: 'alex_vance',
      supportingParticipantIds: ['elena_rostova', 'liam_thorne', 'marcus_sterling'],
      strategicContext:
        'Prince issued a strategic pivot. Alex Vance must re-align all departments, cancel legacy directions, and focus the team on the new objective.',
      suggestedAction: 'pivot_discussion',
    };
  }

  // 5. Business Strategy & Growth (e.g., "How can we grow HeyPrince.in in the next 30 days?", "increase revenue")
  if (
    text.includes('grow') ||
    text.includes('revenue') ||
    text.includes('sales') ||
    text.includes('30 days') ||
    text.includes('month') ||
    text.includes('client acquisition') ||
    text.includes('profitable') ||
    text.includes('commercial')
  ) {
    return {
      category: 'business_strategy',
      primaryResponderId: 'alex_vance',
      supportingParticipantIds: ['elena_rostova', 'liam_thorne', 'marcus_sterling', 'sophia_reynolds'],
      strategicContext:
        'Prince asked for a concrete commercial growth roadmap for HeyPrince.in. Alex Vance coordinates, Elena (SEO) identifies high-converting search clusters, Liam (Sales) outlines target B2B clients, and Sophia (Solutions) details service packages.',
      suggestedAction: 'prepare_proposal',
    };
  }

  // 6. Direct SEO & Traffic Questions
  if (
    text.includes('seo') ||
    text.includes('traffic') ||
    text.includes('google') ||
    text.includes('rank') ||
    text.includes('keywords') ||
    text.includes('search')
  ) {
    return {
      category: 'task_assignment',
      primaryResponderId: 'elena_rostova',
      supportingParticipantIds: ['alex_vance', 'marcus_sterling'],
      strategicContext:
        'Prince requested an SEO and organic traffic analysis. Elena Rostova must audit live post meta tags, title integrity, and target commercial search queries.',
      suggestedAction: 'run_audit',
    };
  }

  // 7. Lead Generation & Prospecting
  if (
    text.includes('leads') ||
    text.includes('clients') ||
    text.includes('scout') ||
    text.includes('outreach') ||
    text.includes('cold')
  ) {
    return {
      category: 'task_assignment',
      primaryResponderId: 'liam_thorne',
      supportingParticipantIds: ['alex_vance', 'sophia_reynolds'],
      strategicContext:
        'Prince requested lead discovery and prospecting. Liam Thorne must query business data and evaluate conversion opportunities.',
      suggestedAction: 'run_audit',
    };
  }

  // 8. New Service or R&D Idea
  if (
    text.includes('new service') ||
    text.includes('launch') ||
    text.includes('idea') ||
    text.includes('feature') ||
    text.includes('ai service')
  ) {
    return {
      category: 'new_idea',
      primaryResponderId: 'alex_vance',
      supportingParticipantIds: ['marcus_sterling', 'sophia_reynolds', 'elena_rostova'],
      strategicContext:
        'Prince proposed a new service expansion or technical capability. Alex Vance must structure a feasibility evaluation and invite Marcus and Sophia to outline deliverables.',
      suggestedAction: 'create_task',
    };
  }

  // 9. Default General Question
  return {
    category: 'general_question',
    primaryResponderId: 'alex_vance',
    supportingParticipantIds: ['elena_rostova', 'david_chen', 'liam_thorne'],
    strategicContext:
      'Prince posed a general inquiry. Alex Vance must provide an executive status update grounded in verified company metrics.',
    suggestedAction: 'answer_directly',
  };
}
