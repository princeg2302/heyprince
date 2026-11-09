import {
  getAllEmployees,
  createCompanyTask,
  getCompanyTasks,
  updateEmployeeStatus,
} from './db';
import {
  auditLiveWebsiteLatency,
  auditLiveDatabaseSeo,
  auditLiveLeadIntelligence,
} from './tools';
import { processCompanyTask } from './orchestrator';
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

export async function runAutonomousCompanyCycle(): Promise<AutonomousCycleReport> {
  const timestamp = new Date().toISOString();
  const actionsTaken: AutonomousCycleReport['actionsTaken'] = [];

  // 1. David Chen (Infrastructure) Autonomous Audit
  const latencyAudit = await auditLiveWebsiteLatency('david_chen');
  const slowCount = latencyAudit.data.slowOrFailingCount || 0;

  if (slowCount > 0) {
    // Check if an open task already exists
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
        break; // Process one per cycle to avoid blocking
      }
    }
  }

  // 5. Record Autonomous Cycle Learning into Company Memory
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
