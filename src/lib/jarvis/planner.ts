import crypto from 'crypto';
import { callAIModel, isAIConfigured } from '../daily-news/ai-provider';
import { executeJarvisTool, getJarvisTool, generateToolsPromptManifest, ToolResult } from './tools';
import { extractCleanSpokenText } from './cleaner';
import { getJarvisMemoryContext } from './memory';

export interface ExecutionPlanStep {
  id: string;
  order: number;
  title: string;
  description: string;
  toolName: string;
  input: Record<string, any>;
  permission: 'safe_auto' | 'prepare_draft' | 'approval_required';
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'requires_approval';
  result?: ToolResult;
  error?: string;
}

export interface ExecutionPlan {
  id: string;
  userPrompt: string;
  understanding: string;
  strategicObjective: string;
  expectedBenefits: string;
  risksAndConstraints: string;
  steps: ExecutionPlanStep[];
  spokenBriefing: string;
  totalDurationMs: number;
  status: 'completed' | 'partially_completed' | 'approval_pending' | 'failed';
  createdAt: string;
}

/**
 * JARVIS Planner-Executor-Verifier Engine
 * Breaks high-level business and technical objectives into prioritized tool steps,
 * runs safe actions autonomously, pauses for approval on high-impact actions, and verifies outputs.
 */
export async function planAndExecuteMission(
  prompt: string,
  context?: {
    adminName?: string;
    adminEmail?: string;
    route?: string;
  }
): Promise<ExecutionPlan> {
  const planId = 'plan_' + crypto.randomBytes(6).toString('hex');
  const startTime = Date.now();
  const adminName = context?.adminName || 'Prince';

  // 1. STAGE 1: PLANNER FORMULATION
  const toolsManifest = generateToolsPromptManifest();
  const memoryContext = await getJarvisMemoryContext();

  let understanding = `Execute operational directive: "${prompt}"`;
  let strategicObjective = `Orchestrate autonomous tools to fulfill request with verified outcomes.`;
  let expectedBenefits = `Accelerate execution, monitor site health, and generate measurable business growth.`;
  let risksAndConstraints = `Strict adherence to safety permissions; drafts require approval before live publishing.`;
  let plannedSteps: Array<{
    title: string;
    description: string;
    toolName: string;
    input: Record<string, any>;
  }> = [];

  if (isAIConfigured()) {
    try {
      const systemPrompt = `You are the Master Planning Engine of JARVIS, AI Chief of Staff for Prince (HeyPrince.in).
Prince has issued a directive: "${prompt}"

YOUR TASK:
Formulate an optimal, multi-step execution plan using the registered tools.
${toolsManifest}

${memoryContext}

RULES:
1. Prefer real tools (web_research, site_scanner, http_inspector, agent_dispatcher, memory_inspector).
2. For site health/audits: use "site_scanner" or agent_dispatcher with "website_guardian".
3. For market/growth/clients: use "web_research" and agent_dispatcher with "lead_scout" or "seo_growth".
4. For articles/content: use "web_research" then agent_dispatcher with "content_researcher".
5. Keep steps between 1 and 4 maximum.

RESPOND IN STRICT JSON ONLY:
{
  "understanding": "Clear, concise 1-sentence breakdown of what Prince requested.",
  "strategicObjective": "The concrete business or technical outcome.",
  "expectedBenefits": "Measurable impact on HeyPrince.in.",
  "risksAndConstraints": "Safety considerations or approval boundaries.",
  "steps": [
    {
      "title": "Short title",
      "description": "What this step accomplishes",
      "toolName": "name_of_tool_from_manifest",
      "input": {}
    }
  ]
}`;

      const aiRes = await callAIModel(systemPrompt, `Formulate mission plan for: "${prompt}"`);
      const cleaned = aiRes.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.understanding) understanding = parsed.understanding;
      if (parsed.strategicObjective) strategicObjective = parsed.strategicObjective;
      if (parsed.expectedBenefits) expectedBenefits = parsed.expectedBenefits;
      if (parsed.risksAndConstraints) risksAndConstraints = parsed.risksAndConstraints;
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        plannedSteps = parsed.steps;
      }
    } catch (planErr) {
      console.warn('[JARVIS Planner] AI planning fallback to heuristic decomposition:', planErr);
    }
  }

  // Deterministic heuristic fallback if AI planning is unconfigured or gave empty steps
  if (plannedSteps.length === 0) {
    const lower = prompt.toLowerCase();
    if (lower.includes('traffic') || lower.includes('client') || lower.includes('grow')) {
      plannedSteps = [
        {
          title: 'Audit Website Health & Routes',
          description: 'Scan core HeyPrince.in routes to ensure no broken user funnels.',
          toolName: 'site_scanner',
          input: { scanType: 'all' },
        },
        {
          title: 'Research Market Opportunities',
          description: 'Search trending technology demand in AI web applications and Next.js.',
          toolName: 'web_research',
          input: { query: 'Next.js AI web development agency opportunities', maxResults: 3 },
        },
        {
          title: 'Deploy Lead Intelligence Scout',
          description: 'Identify high-potential commercial prospects for tailored proposals.',
          toolName: 'agent_dispatcher',
          input: { agentId: 'lead_scout' },
        },
      ];
    } else if (lower.includes('audit') || lower.includes('health')) {
      plannedSteps = [
        {
          title: 'Run Core Route Health Diagnostics',
          description: 'Sweep routes for latency and 404 regressions.',
          toolName: 'site_scanner',
          input: { scanType: 'all' },
        },
        {
          title: 'Execute Website Guardian Agent',
          description: 'Run deep diagnostic audit and record historical health entry.',
          toolName: 'agent_dispatcher',
          input: { agentId: 'website_guardian' },
        },
      ];
    } else if (lower.includes('blog') || lower.includes('content') || lower.includes('article')) {
      plannedSteps = [
        {
          title: 'Live Tech Trend Discovery',
          description: 'Research trending tech headlines from Hacker News and dev communities.',
          toolName: 'web_research',
          input: { query: prompt, maxResults: 4 },
        },
        {
          title: 'Deploy Content Researcher Agent',
          description: 'Draft original, SEO-optimized insight post and LinkedIn thoughts in Mode B.',
          toolName: 'agent_dispatcher',
          input: { agentId: 'content_researcher', customTopic: prompt },
        },
      ];
    } else {
      plannedSteps = [
        {
          title: 'Live Information Retrieval',
          description: 'Retrieve real-world context on request topic.',
          toolName: 'web_research',
          input: { query: prompt, maxResults: 3 },
        },
      ];
    }
  }

  // 2. STAGE 2: EXECUTOR WITH PERMISSION VALIDATION
  const executedSteps: ExecutionPlanStep[] = [];
  let hasFailed = false;
  let hasPendingApproval = false;

  for (let i = 0; i < plannedSteps.length; i++) {
    const rawStep = plannedSteps[i];
    const toolDef = getJarvisTool(rawStep.toolName);
    const permission = toolDef?.permissionLevel || 'safe_auto';

    const stepRecord: ExecutionPlanStep = {
      id: `${planId}_s${i + 1}`,
      order: i + 1,
      title: rawStep.title,
      description: rawStep.description,
      toolName: rawStep.toolName,
      input: rawStep.input || {},
      permission,
      status: 'pending',
    };

    if (permission === 'approval_required') {
      stepRecord.status = 'requires_approval';
      hasPendingApproval = true;
      executedSteps.push(stepRecord);
      continue;
    }

    // Execute tool
    stepRecord.status = 'executing';
    try {
      const toolRes = await executeJarvisTool(rawStep.toolName, rawStep.input, {
        adminName,
        adminEmail: context?.adminEmail,
        pageContext: { route: context?.route },
      });

      stepRecord.result = toolRes;
      stepRecord.status = toolRes.success ? 'completed' : 'failed';
      if (!toolRes.success) {
        stepRecord.error = toolRes.error || 'Tool reported non-success';
        hasFailed = true;
      }
    } catch (err: any) {
      stepRecord.status = 'failed';
      stepRecord.error = err?.message || 'Execution error';
      hasFailed = true;
    }

    executedSteps.push(stepRecord);
  }

  // 3. STAGE 3: VERIFIER & SPOKEN SYNTHESIS
  const completedCount = executedSteps.filter((s) => s.status === 'completed').length;
  const totalCount = executedSteps.length;
  const totalDurationMs = Date.now() - startTime;

  let overallStatus: ExecutionPlan['status'] = 'completed';
  if (hasPendingApproval) overallStatus = 'approval_pending';
  else if (hasFailed && completedCount > 0) overallStatus = 'partially_completed';
  else if (hasFailed && completedCount === 0) overallStatus = 'failed';

  // Executive spoken summary
  let spokenBriefing = `Mission complete, ${adminName}. Executed ${completedCount} of ${totalCount} automated operational steps across website health, research, and growth.`;

  if (isAIConfigured()) {
    try {
      const promptSummary = `You are JARVIS, British AI Chief of Staff.
Prince requested: "${prompt}"
You executed a mission plan with ${completedCount}/${totalCount} successful steps:
${executedSteps.map((s) => `- [${s.title}]: ${s.result?.summary || s.status}`).join('\n')}

Generate a 2-sentence crisp executive spoken summary for Prince.
Dignified, British, authoritative cadence.
CRITICAL FORMAT RULE: Plain text sentences ONLY. No JSON, no quotes, no speaker prefix.`;

      const aiRes = await callAIModel('You are JARVIS, British Chief of Staff.', promptSummary);
      if (aiRes.text?.trim()) {
        spokenBriefing = extractCleanSpokenText(aiRes.text);
      }
    } catch {}
  }

  return {
    id: planId,
    userPrompt: prompt,
    understanding,
    strategicObjective,
    expectedBenefits,
    risksAndConstraints,
    steps: executedSteps,
    spokenBriefing,
    totalDurationMs,
    status: overallStatus,
    createdAt: new Date().toISOString(),
  };
}
