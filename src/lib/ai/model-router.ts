import { sanitizeEmDashes, NO_EM_DASH_INSTRUCTION } from '../ai-content-sanitizer';

export type AITaskType =
  | 'high_reasoning'     // Strategic consensus, executive proposals, in-depth blog writing
  | 'balanced'           // Task matrix execution, technical blueprints, SEO plans, SRE audits
  | 'high_volume_chat'   // Company floor discussions, agent debate, 1-on-1 private desk conversation
  | 'memory_learning'    // Extracting daily lessons and learnings into company_memory
  | 'fast_utility';      // Quick parsing, JSON formatting, classification

export interface ModelPreference {
  geminiPreferred: string[];
  geminiFallback: string[];
  openaiPreferred: string;
  maxTokens: number;
  temperature: number;
}

// Model configurations mapped according to user quota and capabilities
// High-volume chat prioritizes 500 RPD models (Flash Lite) to prevent quota exhaustion
export const TASK_MODEL_PREFERENCES: Record<AITaskType, ModelPreference> = {
  high_reasoning: {
    geminiPreferred: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    geminiFallback: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-1.5-flash'],
    openaiPreferred: 'gpt-4o',
    maxTokens: 2500,
    temperature: 0.35,
  },
  balanced: {
    geminiPreferred: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.5-flash-lite'],
    geminiFallback: ['gemini-3.1-flash-lite', 'gemini-1.5-flash'],
    openaiPreferred: 'gpt-4o-mini',
    maxTokens: 1500,
    temperature: 0.3,
  },
  high_volume_chat: {
    // Models with 500 Requests Per Day placed first to protect 20 RPD free tier limits
    geminiPreferred: [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-8b',
    ],
    geminiFallback: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    openaiPreferred: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.4,
  },
  memory_learning: {
    geminiPreferred: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.0-flash-lite'],
    geminiFallback: ['gemini-2.5-flash', 'gemini-1.5-flash'],
    openaiPreferred: 'gpt-4o-mini',
    maxTokens: 350,
    temperature: 0.2,
  },
  fast_utility: {
    geminiPreferred: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.0-flash-lite'],
    geminiFallback: ['gemini-2.5-flash'],
    openaiPreferred: 'gpt-4o-mini',
    maxTokens: 300,
    temperature: 0.1,
  },
};

export interface AICompletionParams {
  taskType: AITaskType;
  systemInstruction?: string;
  userPrompt: string;
  formatJson?: boolean;
  maxTokensOverride?: number;
  temperatureOverride?: number;
  timeoutMs?: number;
}

export interface AICompletionResult {
  text: string;
  json?: any;
  provider: 'gemini_primary' | 'gemini_backup' | 'openai' | 'fallback';
  model: string;
  durationMs: number;
}

function getAvailableKeys() {
  const primaryKey = process.env.GEMINI_API_KEY_1?.trim() || process.env.GEMINI_API_KEY?.trim();
  const backupKey = process.env.GEMINI_API_KEY_2?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const customOpenAiModel = process.env.OPENAI_MODEL?.trim();

  const geminiKeys: { label: 'gemini_primary' | 'gemini_backup'; key: string }[] = [];
  if (primaryKey && primaryKey.length > 5) {
    geminiKeys.push({ label: 'gemini_primary', key: primaryKey });
  }
  if (backupKey && backupKey.length > 5) {
    geminiKeys.push({ label: 'gemini_backup', key: backupKey });
  }

  return { geminiKeys, openaiKey, customOpenAiModel };
}

function extractJsonPayload(text: string): any {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Universal multi-provider, multi-key, task-based AI router.
 * Automatically chooses models by task requirements and shifts between
 * Gemini Key 1 -> Gemini Key 2 -> OpenAI Fallback seamlessly.
 */
export async function executeAICompletion(
  params: AICompletionParams
): Promise<AICompletionResult> {
  const startTime = Date.now();
  const { geminiKeys, openaiKey, customOpenAiModel } = getAvailableKeys();
  const preference = TASK_MODEL_PREFERENCES[params.taskType] || TASK_MODEL_PREFERENCES.balanced;

  const effectiveSystem = params.systemInstruction
    ? `${params.systemInstruction}\n\n${NO_EM_DASH_INSTRUCTION}`
    : NO_EM_DASH_INSTRUCTION;

  const maxTokens = params.maxTokensOverride || preference.maxTokens;
  const temperature = params.temperatureOverride !== undefined ? params.temperatureOverride : preference.temperature;
  const timeoutMs = params.timeoutMs || 15000;

  const allGeminiModels = Array.from(
    new Set([...preference.geminiPreferred, ...preference.geminiFallback])
  );

  // -------------------------------------------------------------------------
  // 1. Try Gemini Keys (Primary, then Backup) across task-appropriate models
  // -------------------------------------------------------------------------
  for (const geminiEntry of geminiKeys) {
    for (const model of allGeminiModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiEntry.key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
            systemInstruction: { parts: [{ text: effectiveSystem }] },
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              ...(params.formatJson ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          // If status is 429 quota or 503 service unavailable, auto-shift to next model
          continue;
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const cleanText = sanitizeEmDashes(rawText.trim());
        const jsonResult = params.formatJson ? extractJsonPayload(cleanText) : undefined;

        return {
          text: cleanText,
          json: jsonResult,
          provider: geminiEntry.label,
          model,
          durationMs: Date.now() - startTime,
        };
      } catch {
        // Network timeout or fetch failure: try next model or key
        continue;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. Fall back to OpenAI if Gemini keys hit quota or are unavailable
  // -------------------------------------------------------------------------
  if (openaiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs + 3000);

      const targetOpenAiModel = customOpenAiModel || preference.openaiPreferred || 'gpt-4o-mini';

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: targetOpenAiModel,
          messages: [
            { role: 'system', content: effectiveSystem },
            {
              role: 'user',
              content: params.formatJson
                ? `${params.userPrompt}\n\nIMPORTANT: Respond strictly in valid JSON format.`
                : params.userPrompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
          ...(params.formatJson ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.choices?.[0]?.message?.content;
        if (rawText) {
          const cleanText = sanitizeEmDashes(rawText.trim());
          const jsonResult = params.formatJson ? extractJsonPayload(cleanText) : undefined;

          return {
            text: cleanText,
            json: jsonResult,
            provider: 'openai',
            model: targetOpenAiModel,
            durationMs: Date.now() - startTime,
          };
        }
      }
    } catch {
      // OpenAI failed
    }
  }

  // -------------------------------------------------------------------------
  // 3. Graceful Fallback if all providers are offline or exhausted
  // -------------------------------------------------------------------------
  return {
    text: '',
    json: null,
    provider: 'fallback',
    model: 'none',
    durationMs: Date.now() - startTime,
  };
}
