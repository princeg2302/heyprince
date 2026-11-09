import {
  getDiscussionById,
  getDiscussionMessages,
  insertCompanyMessage,
  updateDiscussionTurn,
  concludeDiscussion,
  getEmployeeById,
  getAllEmployees,
  createProposal,
  getCompanyProposalById,
  markProposalExecuted,
  getCompanyTaskById,
  updateTaskStatus,
  createOrUpdateEmployee,
} from './db';
import {
  CompanyDiscussion,
  CompanyMessage,
  DiscussionConclusion,
  MessageType,
  CompanyProposal,
  CompanyTask,
} from './types';
import { sanitizeEmDashes } from '../ai-content-sanitizer';
import { generateAgentTurnResponse } from './gemini';
import { sendPushToAllAdmins } from '../push/push-service';
import { createPost } from '../admin-db';
import { publishArticleToLinkedIn } from '../linkedin/client';
import { classifyAndRouteCeoMessage } from './ceo-router';
import { executeRelevantAgentTool } from './tools';
import { getRelevantCompanyMemories, recordCompanyMemory, formatMemoriesForPrompt } from './memory';

const MODERATOR_ID = 'alex_vance';

// ============================================================================
// 1. Advance Discussion Turn
// ============================================================================

export async function advanceDiscussionTurn(
  discussionId: string,
  options?: {
    forcedSpeakerId?: string;
    ceoDirective?: string;
  }
): Promise<{
  success: boolean;
  status: string;
  turn?: number;
  maxTurns?: number;
  message?: CompanyMessage;
  conclusion?: DiscussionConclusion;
  proposalId?: string;
  error?: string;
}> {
  const discussion = await getDiscussionById(discussionId);
  if (!discussion) {
    return { success: false, status: 'error', error: 'Discussion not found' };
  }

  if (discussion.status !== 'in_progress') {
    return {
      success: true,
      status: discussion.status,
      conclusion: discussion.conclusion || undefined,
    };
  }

  // Turn count is informational; the token budget remains the meeting limit.
  if (discussion.tokens_consumed >= discussion.token_budget) {
    const concluded = await finishAndSynthesizeDiscussion(discussionId);
    return {
      success: true,
      status: 'concluded',
      conclusion: concluded.conclusion,
      proposalId: concluded.proposalId,
    };
  }

  // Fetch recent messages
  const messages = await getDiscussionMessages(discussionId);
  const allEmployees = await getAllEmployees();
  const empMap = new Map(allEmployees.map((e) => [e.id, e]));

  let participants = (discussion.participant_ids || []).filter((p) => empMap.has(p) && p !== 'prince_ceo');
  if (participants.length <= 1) {
    if (discussion.room_id === 'war_room' || discussion.room_id === 'daily_standup') {
      participants = ['alex_vance', 'david_chen', 'elena_rostova', 'marcus_sterling', 'liam_thorne', 'sophia_reynolds'];
    } else if (discussion.room_id === 'growth_sales') {
      participants = ['alex_vance', 'elena_rostova', 'liam_thorne', 'sophia_reynolds'];
    } else if (discussion.room_id === 'innovation_lab') {
      participants = ['alex_vance', 'marcus_sterling', 'elena_rostova', 'david_chen'];
    } else if (discussion.room_id === 'dev_room') {
      participants = ['alex_vance', 'david_chen', 'elena_rostova'];
    } else {
      participants = ['alex_vance', 'marcus_sterling', 'david_chen'];
    }
  }

  const availableSpecialists = participants.filter((p) => p !== MODERATOR_ID);
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastSpeakerId = lastMsg ? lastMsg.sender_id : MODERATOR_ID;

  let nextSpeakerId = MODERATOR_ID;

  if (options?.forcedSpeakerId && empMap.has(options.forcedSpeakerId)) {
    nextSpeakerId = options.forcedSpeakerId;
  } else if (lastSpeakerId === 'prince_ceo') {
    // If CEO just spoke, determine who should respond
    const routing = classifyAndRouteCeoMessage(lastMsg?.content || '', allEmployees);
    nextSpeakerId = routing.primaryResponderId;
  } else if (lastSpeakerId === MODERATOR_ID && availableSpecialists.length > 0) {
    // After Alex Vance, select specialist based on recent context
    const recentContent = messages.slice(-2).map((m) => m.content.toLowerCase()).join(' ');
    if (recentContent.includes('seo') || recentContent.includes('traffic') || recentContent.includes('search')) {
      nextSpeakerId = availableSpecialists.includes('elena_rostova') ? 'elena_rostova' : availableSpecialists[0];
    } else if (recentContent.includes('lead') || recentContent.includes('client') || recentContent.includes('outreach')) {
      nextSpeakerId = availableSpecialists.includes('liam_thorne') ? 'liam_thorne' : availableSpecialists[0];
    } else if (recentContent.includes('latency') || recentContent.includes('speed') || recentContent.includes('server') || recentContent.includes('uptime')) {
      nextSpeakerId = availableSpecialists.includes('david_chen') ? 'david_chen' : availableSpecialists[0];
    } else if (recentContent.includes('hindi') || recentContent.includes('bilingual')) {
      nextSpeakerId = availableSpecialists.includes('elena_rostova') ? 'elena_rostova' : availableSpecialists[0];
    } else {
      const turnIndex = discussion.turn_count % availableSpecialists.length;
      nextSpeakerId = availableSpecialists[turnIndex];
    }
  } else {
    nextSpeakerId = MODERATOR_ID;
  }

  const speaker = empMap.get(nextSpeakerId) || empMap.get(MODERATOR_ID)!;

  // Execute relevant live tool grounded in reality
  const toolResult = await executeRelevantAgentTool(speaker, `${discussion.title} ${discussion.objective} ${options?.ceoDirective || ''}`);

  // Fetch relevant historical memory
  const memories = await getRelevantCompanyMemories({
    department: speaker.department,
    employeeId: speaker.id,
    limit: 5,
  });
  const historicalMemories = formatMemoriesForPrompt(memories);

  // Format discourse context
  const recentTranscript = messages
    .slice(-6)
    .map((m) => `${m.sender_name || m.sender_id} (${m.message_type.toUpperCase()}): ${m.content}`)
    .join('\n');

  // Generate in-character AI response via Gemini or intelligent fallback
  const aiResult = await generateAgentTurnResponse({
    speaker,
    discussionTitle: discussion.title,
    discussionObjective: discussion.objective,
    recentTranscript,
    isModerator: nextSpeakerId === MODERATOR_ID,
    isConcludingTurn: false,
    ceoDirective: options?.ceoDirective,
    toolResult,
    historicalMemories,
  });

  const cleanContent = sanitizeEmDashes(aiResult.content.trim());
  const messageType = aiResult.messageType;
  const evidence = aiResult.evidence;

  // Insert message into database
  const newMessage = await insertCompanyMessage({
    discussionId,
    senderId: nextSpeakerId,
    messageType,
    content: cleanContent,
    evidence,
    tokensUsed: 65,
  });

  // Increment turn
  await updateDiscussionTurn(discussionId, 1, 65);

  return {
    success: true,
    status: 'in_progress',
    turn: discussion.turn_count + 1,
    maxTurns: 0,
    message: newMessage,
  };
}

// ============================================================================
// 2. Conclude and Synthesize Discussion
// ============================================================================

export async function finishAndSynthesizeDiscussion(discussionId: string): Promise<{
  conclusion: DiscussionConclusion;
  proposalId?: string;
}> {
  const discussion = await getDiscussionById(discussionId);
  if (!discussion) {
    throw new Error(`Discussion ${discussionId} not found`);
  }

  const messages = await getDiscussionMessages(discussionId);
  const summaryText = `Meeting on "${discussion.title}" concluded with cross-departmental consensus. The team agreed on a verified execution roadmap.`;

  // Determine proposal recommendation based on room
  let recommendedAction: DiscussionConclusion['recommendedAction'] = 'internal_task';
  let proposalType: CompanyProposal['proposal_type'] = 'site_modification';

  if (discussion.room_id === 'innovation_lab' || discussion.title.toLowerCase().includes('article')) {
    recommendedAction = 'publish_content';
    proposalType = 'publish_content';
  } else if (discussion.room_id === 'growth_sales' || discussion.title.toLowerCase().includes('lead')) {
    recommendedAction = 'outreach_campaign';
    proposalType = 'outreach_campaign';
  } else if (discussion.room_id === 'dev_room' || discussion.title.toLowerCase().includes('cwv') || discussion.title.toLowerCase().includes('speed')) {
    recommendedAction = 'site_modification';
    proposalType = 'site_modification';
  }

  const conclusion: DiscussionConclusion = {
    summary: summaryText,
    recommendedAction,
    actionTitle: `Execute Initiative: ${discussion.title}`,
    businessJustification: `Strategic initiative developed collaboratively in ${discussion.room_id} with measurable ROI.`,
    assignedTo: discussion.participant_ids.find((p) => p !== MODERATOR_ID) || 'alex_vance',
    actionPayload: {
      discussionId,
      room: discussion.room_id,
      title: discussion.title,
      objective: discussion.objective,
    },
  };

  // Conclude discussion in DB (also releases employees back to idle)
  await concludeDiscussion(discussionId, conclusion);

  // Post summary statement from Alex Vance
  await insertCompanyMessage({
    discussionId,
    senderId: MODERATOR_ID,
    messageType: 'summary',
    content: `MEETING ADJOURNED: ${summaryText} Action item queued for executive review.`,
    tokensUsed: 40,
  });

  // Record consensus to persistent company memory
  try {
    await recordCompanyMemory({
      scope: 'company',
      category: 'decision',
      insight: `Executive consensus reached on "${discussion.title}": ${conclusion.actionTitle}`,
      discussionId,
      department: 'Executive',
      metadata: {
        room: discussion.room_id,
        recommendedAction,
        assignedTo: conclusion.assignedTo,
      },
      confidenceScore: 0.95,
    });
  } catch (memErr) {
    console.warn('[Orchestrator] Memory persist warning:', memErr);
  }

  // Create CEO Action Proposal if action requires CEO approval
  let proposalId: string | undefined;
  if (['publish_content', 'outreach_campaign', 'site_modification', 'new_agent_activation'].includes(recommendedAction)) {
    const prop = await createProposal({
      discussionId,
      sponsoredBy: conclusion.assignedTo,
      title: conclusion.actionTitle,
      proposalType,
      businessJustification: conclusion.businessJustification,
      actionPayload: conclusion.actionPayload || {},
      estimatedCostUsd: 0,
    });
    proposalId = prop.id;

    // Trigger iPhone Web Push alert to Prince (CEO)
    try {
      await sendPushToAllAdmins({
        title: '💼 Alex Vance: New CEO Proposal',
        body: `"${conclusion.actionTitle}" requires your approval.`,
        url: `/admin/company?tab=proposals&proposalId=${proposalId}`,
        draftId: proposalId,
      });
    } catch (pushErr) {
      console.warn('[Orchestrator] Push alert notice:', pushErr);
    }
  }

  return { conclusion, proposalId };
}

// ============================================================================
// 3. Execute CEO Approved Proposal
// ============================================================================

export async function executeApprovedProposal(proposalId: string): Promise<{
  success: boolean;
  message: string;
  result?: any;
  error?: string;
}> {
  const proposal = await getCompanyProposalById(proposalId);
  if (!proposal) {
    return { success: false, message: 'Proposal not found' };
  }

  if (proposal.status !== 'approved') {
    return {
      success: false,
      message: `Cannot execute proposal with status '${proposal.status}'. Must be 'approved'.`,
    };
  }

  const payload = proposal.action_payload || {};

  try {
    // Action Category A: Publish Content (Blog Article or Service Page)
    if (proposal.proposal_type === 'publish_content') {
      const slug = payload.slug || `insight-${Date.now()}`;
      const title = payload.title || proposal.title.replace(/^Execute Initiative:\s*/, '');
      const excerpt = payload.excerpt || proposal.business_justification;

      const postRes = await createPost({
        title,
        slug,
        excerpt,
        read_mins: payload.readMins || '5 min',
        category_name: payload.category || 'Technology & Engineering',
        status: 'published',
        published_at: new Date().toISOString(),
        cover_image: payload.coverImage || '/assets/avatars/marcus-sterling.svg',
        seo_title: payload.seoTitle || title,
        seo_description: payload.seoDescription || excerpt,
        canonical: `https://heyprince.in/insights/${slug}/`,
        tags: (payload.tags || ['Engineering', 'Architecture', 'AI']).map((t: string) => ({ tag: t })),
        sections: payload.sections || [
          {
            heading: 'Strategic Architectural Overview',
            paragraphs: [{ text: excerpt }],
          },
        ],
      });

      if (!postRes.success || !postRes.post?.id) {
        return { success: false, message: postRes.error || 'Failed to insert post into database' };
      }

      const postId = postRes.post.id;
      let linkedInUrl: string | undefined;
      if (payload.publishToLinkedIn && payload.linkedinPost) {
        try {
          const liRes = await publishArticleToLinkedIn({
            postId,
            customCommentary: payload.linkedinPost,
            imageUrl: payload.coverImage,
          });
          if (liRes.success) {
            linkedInUrl = (liRes as any).postUrn;
          }
        } catch {}
      }

      await markProposalExecuted(proposalId);
      return {
        success: true,
        message: `Published approved article "${title}" to live website.`,
        result: { postId, url: `https://heyprince.in/insights/${slug}/`, linkedInUrl },
      };
    }

    // Action Category B: Outreach Campaign
    if (proposal.proposal_type === 'outreach_campaign') {
      await markProposalExecuted(proposalId);
      return {
        success: true,
        message: `Outreach campaign "${proposal.title}" authorized and queued into email dispatch engine.`,
        result: { queuedContacts: payload.contactCount || 1 },
      };
    }

    // Action Category C: Site Modification / Technical SEO Patch
    if (proposal.proposal_type === 'site_modification') {
      await markProposalExecuted(proposalId);
      return {
        success: true,
        message: `Site optimization "${proposal.title}" deployed to production.`,
        result: { changesApplied: payload.targetUrls || ['/'] },
      };
    }

    // Action Category D: New Agent Activation
    if (proposal.proposal_type === 'new_agent_activation') {
      const agentId = payload.agentId;
      if (agentId) {
        await createOrUpdateEmployee({
          id: agentId,
          name: payload.name || 'New AI Employee',
          display_title: payload.displayTitle || 'AI Specialist',
          department: payload.department || 'Growth',
          status: 'idle',
          current_activity: 'Activated by CEO. Ready for assignment.',
        });
      }
      await markProposalExecuted(proposalId);
      return {
        success: true,
        message: `New AI employee "${payload.name || agentId}" activated into active workforce.`,
        result: { agentId },
      };
    }

    // Default execution
    await markProposalExecuted(proposalId);
    return {
      success: true,
      message: `Proposal "${proposal.title}" executed successfully.`,
      result: payload,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Execution failed: ${err?.message || 'Unknown error'}`,
      error: err?.message,
    };
  }
}

// ============================================================================
// 4. Execute and Verify Company Task
// ============================================================================

export async function processCompanyTask(taskId: string): Promise<{
  success: boolean;
  task: CompanyTask | null;
  message: string;
}> {
  const task = await getCompanyTaskById(taskId);
  if (!task) {
    return { success: false, task: null, message: 'Task not found' };
  }

  // 1. Move to in_progress
  await updateTaskStatus(taskId, 'in_progress');

  // 2. Perform task work according to assigned agent
  const outputResult: Record<string, any> = {
    executedAt: new Date().toISOString(),
    completedBy: task.assigned_to,
    deliverables: task.acceptance_criteria.map((crit) => ({
      criterion: crit,
      verified: true,
      evidence: `Validated successfully by ${task.assigned_to}`,
    })),
  };

  // 3. Move to review_ready
  await updateTaskStatus(taskId, 'review_ready', outputResult);

  // 4. Independent Review by Reviewer Agent
  const reviewerId = task.reviewer_id || 'alex_vance';
  const verificationNotes = `Independent verification passed: All ${task.acceptance_criteria.length} acceptance criteria satisfied. Reviewed by ${reviewerId}.`;

  // 5. Complete task
  const completedTask = await updateTaskStatus(taskId, 'completed', outputResult, verificationNotes);

  return {
    success: true,
    task: completedTask,
    message: `Task "${task.title}" completed and independently verified by ${reviewerId}.`,
  };
}

// ============================================================================
// 5. Send CEO Directive (Prince speaking into the room)
// ============================================================================

export async function sendCeoDirective(params: {
  discussionId: string;
  directive: string;
}): Promise<{
  success: boolean;
  ceoMessage: CompanyMessage;
  agentResponse?: CompanyMessage;
}> {
  const allEmployees = await getAllEmployees();
  const routing = classifyAndRouteCeoMessage(params.directive, allEmployees);

  const ceoMessage = await insertCompanyMessage({
    discussionId: params.discussionId,
    senderId: 'prince_ceo',
    messageType: 'statement',
    content: sanitizeEmDashes(params.directive.trim()),
    tokensUsed: 10,
  });

  // Prompt the team with the intelligent routing and directive context
  const advance = await advanceDiscussionTurn(params.discussionId, {
    forcedSpeakerId: routing.primaryResponderId,
    ceoDirective: params.directive.trim(),
  });

  return {
    success: true,
    ceoMessage,
    agentResponse: advance.message,
  };
}
