import {
  createChiefTask,
  updateChiefTaskStatus,
  getAgentById,
  logChiefActivity,
} from './db';
import { runWebsiteGuardianAudit } from './agents/website-guardian';
import { runSeoGrowthAudit } from './agents/seo-growth';
import { runLeadScoutDiscovery } from './agents/lead-scout';
import { runContentResearcherDiscovery } from './agents/content-researcher';
import { processInboundLead, InboundLeadData } from './agents/inbound-responder';

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

  const taskId = await createChiefTask({
    agentId,
    taskType: `${agentId}_execution`,
    payload: { triggerSource, ...payload },
  });

  await logChiefActivity(
    agentId,
    'info',
    `Triggered ${agent.name} (${triggerSource})`,
    { taskId, mode: agent.mode }
  );

  let taskSuccess = false;
  let taskResult: any = null;
  let errorMessage: string | null = null;

  try {
    switch (agentId) {
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
        });
        taskSuccess = taskResult.success;
        if (!taskSuccess) errorMessage = taskResult.summary;
        break;
      }

      case 'inbound_responder': {
        taskResult = await processInboundLead(payload as InboundLeadData);
        taskSuccess = Boolean(taskResult);
        break;
      }

      default: {
        throw new Error(`Unsupported agent id: ${agentId}`);
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
