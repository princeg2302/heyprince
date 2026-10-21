/**
 * JARVIS Typed Tool System
 * Defines strict schemas, permission levels, and structured output contracts.
 */

export type ToolPermissionLevel = 'safe_auto' | 'prepare_draft' | 'approval_required';

export interface ToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: { type: string };
  default?: any;
}

export interface ToolParametersSchema {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
}

export interface ToolCitation {
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
}

export interface ToolResult<T = any> {
  toolName: string;
  success: boolean;
  data?: T;
  error?: string;
  summary: string;
  citations?: ToolCitation[];
  durationMs: number;
  timestamp: string;
}

export interface JarvisExecutionContext {
  userId?: number | string;
  adminName?: string;
  adminEmail?: string;
  pageContext?: {
    route?: string;
    heading?: string;
  };
  requireApproval?: boolean;
}

export interface JarvisTool<TInput = any, TOutput = any> {
  name: string;
  label: string;
  description: string;
  permissionLevel: ToolPermissionLevel;
  parameters: ToolParametersSchema;
  execute: (input: TInput, context?: JarvisExecutionContext) => Promise<ToolResult<TOutput>>;
}

