import { JarvisTool, ToolResult } from './types';
import { executeAgentTask } from '../../chief-of-staff/orchestrator';

interface AgentDispatcherInput {
  agentId: 'website_guardian' | 'content_researcher' | 'lead_scout' | 'seo_growth';
  customTopic?: string;
}

export const agentDispatcherTool: JarvisTool<AgentDispatcherInput, any> = {
  name: 'agent_dispatcher',
  label: 'Chief of Staff Agent Runner',
  description:
    'Dispatches one of the autonomous specialist agents (Content Researcher, Website Guardian, Lead Scout, SEO Growth) to execute an end-to-end mission.',
  permissionLevel: 'prepare_draft',
  parameters: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'The specialist agent to run.',
        enum: ['website_guardian', 'content_researcher', 'lead_scout', 'seo_growth'],
      },
      customTopic: {
        type: 'string',
        description: 'Optional focus topic, target URL, or search directive.',
      },
    },
    required: ['agentId'],
  },
  execute: async (input, context) => {
    const startTime = Date.now();
    const { agentId, customTopic } = input;

    try {
      const result = await executeAgentTask({
        agentId,
        triggerSource: 'manual',
        payload: {
          customTopic,
          triggeredByAdmin: context?.adminEmail || 'prince',
        },
      });

      return {
        toolName: 'agent_dispatcher',
        success: result.success,
        data: result,
        summary: `Agent "${agentId}" executed task (${result.taskId}): ${result.message}`,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        toolName: 'agent_dispatcher',
        success: false,
        error: err?.message || 'Agent execution failed',
        summary: `Execution of agent "${agentId}" encountered an error: ${err?.message}`,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

