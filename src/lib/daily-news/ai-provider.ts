import { sanitizeEmDashes, NO_EM_DASH_INSTRUCTION } from '../ai-content-sanitizer';
import { executeAICompletion } from '../ai/model-router';

export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export function isAIConfigured(): boolean {
  const gemini1 = process.env.GEMINI_API_KEY_1?.trim();
  const gemini2 = process.env.GEMINI_API_KEY_2?.trim();
  const geminiLegacy = process.env.GEMINI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();

  return Boolean(gemini1 || gemini2 || geminiLegacy || openai);
}

export function getAIProviderConfig(): { provider: string; model: string } {
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY_1?.trim() ||
    process.env.GEMINI_API_KEY_2?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  );
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (hasGemini) {
    return {
      provider: 'gemini_multi_tier',
      model: 'gemini-3.8-flash (with auto-shifting to 3.5-flash-lite & OpenAI)',
    };
  }

  if (hasOpenAi) {
    return {
      provider: 'openai',
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    };
  }

  return {
    provider: 'unconfigured',
    model: 'none',
  };
}

/**
 * Universal callAIModel for Daily AI News and Blog Generation.
 * Powered by task-based multi-provider routing (Gemini Key 1 -> Gemini Key 2 -> OpenAI).
 */
export async function callAIModel(
  systemPrompt: string,
  userPrompt: string,
  _preferredModel?: string
): Promise<LLMResponse> {
  if (!isAIConfigured()) {
    throw new Error(
      'No AI Provider configured. Please add GEMINI_API_KEY_1, GEMINI_API_KEY_2, or OPENAI_API_KEY in your environment variables.'
    );
  }

  const effectiveSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\n${NO_EM_DASH_INSTRUCTION}`
    : NO_EM_DASH_INSTRUCTION;

  const result = await executeAICompletion({
    taskType: 'high_reasoning',
    systemInstruction: effectiveSystemPrompt,
    userPrompt,
    formatJson: true,
    maxTokensOverride: 8192,
    temperatureOverride: 0.35,
    timeoutMs: 25000,
  });

  if (!result.text) {
    throw new Error(
      'All AI providers (Gemini Primary, Gemini Backup, and OpenAI Fallback) exhausted or returned empty responses. Please verify your API quotas and network connectivity.'
    );
  }

  return {
    text: result.text,
    provider: result.provider,
    model: result.model,
  };
}
