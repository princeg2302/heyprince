import {
  createChiefTask,
  updateChiefTaskStatus,
  getAgentById,
  logChiefActivity,
  updateAgentExecutionTime,
  incrementAgentStats,
} from './db';
import { isAiBackendEnabled, callAiBackend } from '@/lib/ai-backend-client';
import { runWebsiteGuardianAudit } from './agents/website-guardian';
import { runSeoGrowthAudit } from './agents/seo-growth';
import { runLeadScoutDiscovery } from './agents/lead-scout';
import { runContentResearcherDiscovery } from './agents/content-researcher';
import { runAutonomousCompanyCycle } from '@/lib/company/autonomous-worker';

export interface RunAgentOptions {
  agentId: string;
  triggerSource?: 'manual' | 'cron' | 'event';
  payload?: Record<string, any>;
}

export interface RunAgentResult {
  taskId: string;
  agentId: string;
  success: boolean;
  message: string;
  data?: any;
  durationMs: number;
}

const AGENT_ID_MAP: Record<string, string> = {
  alex_vance: 'alex_vance',
  content_researcher: 'content_researcher',
  marcus_sterling: 'content_researcher',
  website_guardian: 'website_guardian',
  david_chen: 'website_guardian',
  seo_growth: 'seo_growth',
  elena_rostova: 'seo_growth',
  lead_scout: 'lead_scout',
  liam_thorne: 'lead_scout',
  inbound_responder: 'inbound_responder',
  sophia_reynolds: 'inbound_responder',
};

export async function executeAgentTask(options: RunAgentOptions): Promise<RunAgentResult> {
  const { agentId, triggerSource = 'manual', payload = {} } = options;
  const startTime = Date.now();

  const agent = await getAgentById(agentId);
  if (!agent) {
    return {
      taskId: 'none',
      agentId,
      success: false,
      message: `Agent with id "${agentId}" not found.`,
      durationMs: 0,
    };
  }

  if (agent.status === 'paused' && triggerSource === 'cron') {
    return {
      taskId: 'none',
      agentId,
      success: true,
      message: `Agent "${agent.name}" is currently paused. Skipping scheduled run.`,
      durationMs: 0,
    };
  }

  const normalizedAgentId = AGENT_ID_MAP[agentId] || AGENT_ID_MAP[agent.id] || agentId;

  const taskId = await createChiefTask({
    agentId: agent.id,
    taskType: `${normalizedAgentId}_execution`,
    payload: { triggerSource, ...payload },
  });

  await logChiefActivity(
    agent.id,
    'info',
    `Triggered ${agent.name} (${triggerSource})`,
    { taskId, mode: agent.mode }
  );

  let taskSuccess = false;
  let taskResult: any = null;
  let errorMessage: string | null = null;

  try {
    if (isAiBackendEnabled() && normalizedAgentId !== 'inbound_responder' && normalizedAgentId !== 'alex_vance') {
      const pythonRes = await callAiBackend('/api/v1/chief/run-agent', {
        agent: normalizedAgentId,
        trigger: triggerSource,
        payload,
      });
      if (pythonRes.success && pythonRes.data?.result) {
        taskResult = pythonRes.data.result;
        taskSuccess = true;
        console.log('[Chief Orchestrator] Agent executed successfully via dedicated Python AI backend.');
      } else {
        console.warn('[Chief Orchestrator] Python backend delegation failed, falling back to local TypeScript agent:', pythonRes.error);
      }
    }

    if (taskResult === null) {
      switch (normalizedAgentId) {
      case 'alex_vance': {
        const cycleReport = await runAutonomousCompanyCycle();
        taskResult = {
          executiveSummary: cycleReport.summary,
          auditsExecuted: cycleReport.auditsExecuted,
          actionsTaken: cycleReport.actionsTaken,
          itemsProduced: cycleReport.actionsTaken.length || 1,
          tokensUsed: 420,
          status: 'healthy',
        };
        taskSuccess = true;
        break;
      }

      case 'website_guardian': {
        taskResult = await runWebsiteGuardianAudit({
          routes: payload.routes,
        });
        taskSuccess = taskResult.status !== 'critical';
        break;
      }

      case 'seo_growth': {
        taskResult = await runSeoGrowthAudit();
        taskSuccess = true;
        break;
      }

      case 'lead_scout': {
        taskResult = await runLeadScoutDiscovery();
        taskSuccess = true;
        break;
      }

      case 'content_researcher': {
        taskResult = await runContentResearcherDiscovery({
          customTopic: payload.customTopic,
          contentType: payload.contentType || (triggerSource === 'cron' ? 'service_page' : 'blog_article'),
        });
        taskSuccess = taskResult.success;
        if (!taskSuccess) errorMessage = taskResult.summary;
        break;
      }

      case 'inbound_responder': {
        taskResult = { message: 'Inbound leads are now consolidated and processed automatically in the unified Lead Intelligence pipeline.' };
        taskSuccess = true;
        break;
      }

      default: {
        throw new Error(`Unsupported agent id: ${agentId}`);
      }
    }
    }
  } catch (err: any) {
    taskSuccess = false;
    errorMessage = err?.message || 'Agent execution failed unexpectedly.';
    console.error(`[Chief Orchestrator] Agent execution error (${agentId}):`, err);
  }

  const durationMs = Date.now() - startTime;

  await updateChiefTaskStatus(
    taskId,
    taskSuccess ? 'completed' : 'failed',
    taskResult,
    errorMessage,
    durationMs
  );

  if (taskSuccess) {
    const itemsProduced =
      taskResult?.itemsProduced ||
      (normalizedAgentId === 'alex_vance' ? 1 : taskResult?.recommendations?.length || 1);
    const tokens = taskResult?.tokensUsed || 350;
    try {
      await updateAgentExecutionTime(agent.id, new Date());
      await incrementAgentStats(agent.id, true, itemsProduced, tokens);
    } catch (statErr) {
      console.warn('[Chief Orchestrator] Failed updating agent stats:', statErr);
    }
  } else {
    try {
      await incrementAgentStats(agent.id, false, 0, 0);
    } catch (statErr) {
      console.warn('[Chief Orchestrator] Failed updating agent failure stats:', statErr);
    }
  }

  return {
    taskId,
    agentId,
    success: taskSuccess,
    message: taskSuccess
      ? `Successfully executed ${agent.name}.`
      : errorMessage || `Failed executing ${agent.name}.`,
    data: taskResult,
    durationMs,
  };
}

