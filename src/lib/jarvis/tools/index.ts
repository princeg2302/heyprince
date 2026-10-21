import { JarvisTool, JarvisExecutionContext, ToolResult } from './types';
import { webResearchTool } from './web-research';
import { httpInspectorTool } from './http-inspector';
import { siteScannerTool } from './site-scanner';
import { agentDispatcherTool } from './agent-dispatcher';
import { memoryInspectorTool } from './memory-inspector';

export * from './types';
export { webResearchTool, httpInspectorTool, siteScannerTool, agentDispatcherTool, memoryInspectorTool };

const TOOLS_REGISTRY: Record<string, JarvisTool> = {
  web_research: webResearchTool,
  http_inspector: httpInspectorTool,
  site_scanner: siteScannerTool,
  agent_dispatcher: agentDispatcherTool,
  memory_inspector: memoryInspectorTool,
};

export function getAllJarvisTools(): JarvisTool[] {
  return Object.values(TOOLS_REGISTRY);
}

export function getJarvisTool(name: string): JarvisTool | undefined {
  return TOOLS_REGISTRY[name];
}

export async function executeJarvisTool(
  name: string,
  input: any,
  context?: JarvisExecutionContext
): Promise<ToolResult> {
  const tool = getJarvisTool(name);
  if (!tool) {
    return {
      toolName: name,
      success: false,
      error: `Tool "${name}" is not registered in JARVIS tools registry.`,
      summary: `Tool "${name}" not found.`,
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Permission validation
  if (tool.permissionLevel === 'approval_required' && context?.requireApproval !== false) {
    return {
      toolName: name,
      success: false,
      error: `Tool "${name}" requires explicit user approval before execution.`,
      summary: `Execution paused: Human approval required for ${name}.`,
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return await tool.execute(input, context);
  } catch (err: any) {
    return {
      toolName: name,
      success: false,
      error: err?.message || 'Tool execution threw an unhandled exception',
      summary: `Failed to execute ${name}: ${err?.message}`,
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

export function generateToolsPromptManifest(): string {
  const tools = getAllJarvisTools();
  let manifest = 'AVAILABLE REAL-TIME TOOLS (CAN BE INVOKED VIA "tool_calls"):\n';

  tools.forEach((t) => {
    manifest += `\n• Tool: "${t.name}" [Permission: ${t.permissionLevel}]\n`;
    manifest += `  Description: ${t.description}\n`;
    manifest += `  Parameters: ${JSON.stringify(t.parameters.properties)}\n`;
    if (t.parameters.required) {
      manifest += `  Required: [${t.parameters.required.join(', ')}]\n`;
    }
  });

  return manifest;
}

