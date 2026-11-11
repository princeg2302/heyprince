import {
  getAllEmployees,
  createCompanyTask,
  getCompanyTasks,
  updateEmployeeStatus,
  getLatestDiscussionForRoom,
  createDiscussion,
} from './db';
import {
  auditLiveWebsiteLatency,
  auditLiveDatabaseSeo,
  auditLiveLeadIntelligence,
} from './tools';
import {
  processCompanyTask,
  advanceDiscussionTurn,
  finishAndSynthesizeDiscussion,
} from './orchestrator';
import { recordCompanyMemory } from './memory';

export interface AutonomousCycleReport {
  timestamp: string;
  auditsExecuted: {
    websiteLatency: { averageMs: number; slowRoutes: number };
    seoAudit: { audited: number; missingMeta: number };
    leadAudit: { totalBusinesses: number };
  };
  actionsTaken: Array<{
    type: 'task_created' | 'task_processed' | 'discussion_initiated' | 'memory_recorded';
    title: string;
    department: string;
    details: Record<string, any>;
  }>;
  summary: string;
}

let lastCycleRunTime = 0;
let isRunningCycle = false;

export async function triggerOpportunisticAutonomousCycle(minIntervalMs = 10 * 60 * 1000): Promise<boolean> {
  const now = Date.now();
  if (isRunningCycle || (now - lastCycleRunTime) < minIntervalMs) {
    return false;
  }

  isRunningCycle = true;
  try {
    await runAutonomousCompanyCycle();
    lastCycleRunTime = Date.now();
    return true;
  } catch (err) {
    console.warn('[Opportunistic Pulse] Autonomous cycle warning:', err);
    return false;
  } finally {
    isRunningCycle = false;
  }
}

export async function runAutonomousCompanyCycle(): Promise<AutonomousCycleReport> {
  const timestamp = new Date().toISOString();
  const actionsTaken: AutonomousCycleReport['actionsTaken'] = [];

  // 1. David Chen (Infrastructure) Autonomous Audit
  const latencyAudit = await auditLiveWebsiteLatency('david_chen');
  const slowCount = latencyAudit.data.slowOrFailingCount || 0;

  if (slowCount > 0) {
    const existingTasks = await getCompanyTasks({ assignedTo: 'david_chen' });
    const hasActiveTask = existingTasks.some((t) => t.status === 'in_progress' || t.status === 'pending');

    if (!hasActiveTask) {
      const task = await createCompanyTask({
        assignedTo: 'david_chen',
        assignedBy: 'alex_vance',
        reviewerId: 'alex_vance',
        title: `Remediate Latency Baseline: ${slowCount} flagged routes`,
        description: `Autonomous probe detected ${slowCount} routes with latency > 1500ms. Analyze server queries and tune caching headers.`,
        acceptanceCriteria: [
          'Verify TTFB on all core routes stays under 500ms',
          'Ensure zero HTTP 4xx/5xx responses',
        ],
        priority: 'high',
      });

      actionsTaken.push({
        type: 'task_created',
        title: task.title,
        department: 'Infrastructure',
        details: { taskId: task.id, slowCount },
      });
    }
  }

  // 2. Elena Rostova (Growth & SEO) Autonomous Audit
  const seoAudit = await auditLiveDatabaseSeo('elena_rostova');
  const missingMeta = seoAudit.data.missingMetaDescriptionCount || 0;

  if (missingMeta > 0) {
    const elenaTasks = await getCompanyTasks({ assignedTo: 'elena_rostova' });
    const hasActiveSeoTask = elenaTasks.some((t) => t.status === 'in_progress' || t.status === 'pending');

    if (!hasActiveSeoTask) {
      const task = await createCompanyTask({
        assignedTo: 'elena_rostova',
        assignedBy: 'alex_vance',
        reviewerId: 'marcus_sterling',
        title: `SEO Metadata Optimization: ${missingMeta} articles needing descriptions`,
        description: `Automated audit identified ${missingMeta} published posts lacking dedicated meta descriptions. Author high-CTR meta snippets.`,
        acceptanceCriteria: [
          'Draft compelling 130-155 character meta descriptions for flagged posts',
          'Validate keyword density without keyword stuffing',
        ],
        priority: 'medium',
      });

      actionsTaken.push({
        type: 'task_created',
        title: task.title,
        department: 'Growth',
        details: { taskId: task.id, missingMeta },
      });
    }
  }

  // 3. Liam Thorne (Sales & Lead Scout) Intelligence
  const leadAudit = await auditLiveLeadIntelligence('liam_thorne');

  // 4. Autonomous Task Processing: Progress up to 1 pending task
  const allEmployees = await getAllEmployees();
  for (const emp of allEmployees) {
    if (emp.id === 'prince_ceo') continue;
    const tasks = await getCompanyTasks({ assignedTo: emp.id });
    const pending = tasks.find((t) => t.status === 'pending');
    if (pending) {
      const proc = await processCompanyTask(pending.id);
      if (proc.success) {
        actionsTaken.push({
          type: 'task_processed',
          title: pending.title,
          department: emp.department,
          details: { taskId: pending.id, completedBy: emp.id },
        });
        break;
      }
    }
  }

  // 5. Autonomous Floor Discussion Engine (Spontaneous Cross-Agent Collaboration)
  try {
    const activeDiscussion = await getLatestDiscussionForRoom('company_hq');
    if (activeDiscussion && activeDiscussion.status === 'in_progress') {
      if (activeDiscussion.turn_count >= 8) {
        const synth = await finishAndSynthesizeDiscussion(activeDiscussion.id);
        actionsTaken.push({
          type: 'discussion_initiated',
          title: `Synthesized Consensus: ${activeDiscussion.title}`,
          department: 'Executive',
          details: { discussionId: activeDiscussion.id, proposalId: synth.proposalId },
        });
      } else {
        const turnRes = await advanceDiscussionTurn(activeDiscussion.id);
        if (turnRes.success && turnRes.message) {
          actionsTaken.push({
            type: 'discussion_initiated',
            title: `${turnRes.message.sender_name || 'Specialist'} contributed on floor`,
            department: 'Executive',
            details: {
              discussionId: activeDiscussion.id,
              turn: turnRes.turn,
              senderId: turnRes.message.sender_id,
              preview: turnRes.message.content.slice(0, 100),
            },
          });
        }
      }
    } else {
      const AGENDAS = [
        {
          title: 'Daily 9:00 AM All-Hands Synchronization: Revenue, Blockers & Production Priorities',
          objective: 'Synchronize daily cross-departmental focus between SEO, engineering latency, tech content publication, and client lead pipeline.',
        },
        {
          title: 'High-Intent Commercial Keyword Expansion & Organic Inbound Acquisition',
          objective: 'Elena Rostova and Liam Thorne collaborate to capture high-value organic searches for Next.js, AI automation, and IT consulting.',
        },
        {
          title: 'Core Web Vitals & Sub-250ms Mobile TTFB Architecture',
          objective: 'David Chen leads technical audit on server-side query latency, Redis caching, and edge routing performance.',
        },
        {
          title: 'Emerging AI Architecture & Production Engineering Thought Leadership',
          objective: 'Marcus Sterling presents deep-dive technical insights for CEO review and LinkedIn distribution.',
        },
      ];

      const chosenAgenda = AGENDAS[Math.floor(Math.random() * AGENDAS.length)];
      const newDisc = await createDiscussion({
        roomId: 'company_hq',
        title: chosenAgenda.title,
        objective: chosenAgenda.objective,
        moderatorId: 'alex_vance',
        participantIds: ['alex_vance', 'elena_rostova', 'marcus_sterling', 'liam_thorne', 'david_chen', 'sophia_reynolds'],
        tokenBudget: 50000,
        maxTurns: 8,
      });

      await advanceDiscussionTurn(newDisc.id, { forcedSpeakerId: 'alex_vance' });
      actionsTaken.push({
        type: 'discussion_initiated',
        title: `Initiated All-Hands Agenda: ${chosenAgenda.title}`,
        department: 'Executive',
        details: { discussionId: newDisc.id, kickoffBy: 'alex_vance' },
      });
    }
  } catch (discErr) {
    console.warn('[AutonomousWorker] Discussion engine warning:', discErr);
  }

  // 6. Synchronize Chief of Staff Stats & Activity Logs
  try {
    const { updateAgentExecutionTime, incrementAgentStats, logChiefActivity } = await import('@/lib/chief-of-staff/db');
    await updateAgentExecutionTime('alex_vance', new Date());
    await incrementAgentStats('alex_vance', true, 1, 250);
    await logChiefActivity(
      'alex_vance',
      'info',
      'Autonomous company workforce cycle executed',
      { actionsCount: actionsTaken.length }
    );
  } catch (chiefErr) {
    console.warn('[AutonomousWorker] Chief of Staff stats sync warning:', chiefErr);
  }

  // 7. Record Autonomous Cycle Learning into Company Memory
  await recordCompanyMemory({
    scope: 'company',
    category: 'performance_benchmark',
    insight: `Autonomous company audit cycle executed: Latency avg ${latencyAudit.data.averageLatencyMs}ms, ${missingMeta} SEO opportunities flagged, ${leadAudit.data.totalBusinessesDiscovered} prospect accounts monitored.`,
    metadata: {
      latencyMs: latencyAudit.data.averageLatencyMs,
      missingMeta,
      totalBusinesses: leadAudit.data.totalBusinessesDiscovered,
      actionsCount: actionsTaken.length,
    },
  });

  actionsTaken.push({
    type: 'memory_recorded',
    title: 'Workforce Cycle Performance Benchmark',
    department: 'Executive',
    details: { latencyMs: latencyAudit.data.averageLatencyMs },
  });

  const summary = `Autonomous cycle completed: ${actionsTaken.length} operational action(s) executed. Latency: ${latencyAudit.data.averageLatencyMs}ms. SEO gaps: ${missingMeta}. Lead pipeline: ${leadAudit.data.totalBusinessesDiscovered} accounts.`;

  return {
    timestamp,
    auditsExecuted: {
      websiteLatency: {
        averageMs: latencyAudit.data.averageLatencyMs,
        slowRoutes: slowCount,
      },
      seoAudit: {
        audited: seoAudit.data.totalPublishedAudited,
        missingMeta,
      },
      leadAudit: {
        totalBusinesses: leadAudit.data.totalBusinessesDiscovered,
      },
    },
    actionsTaken,
    summary,
  };
}
