export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface AIProviderConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  model: string;
  apiKey?: string;
}

export function getAIProviderConfig(): AIProviderConfig {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (geminiKey) {
    return {
      provider: 'gemini',
      model: process.env.DAILY_NEWS_AI_MODEL?.trim() || 'gemini-2.5-flash',
      apiKey: geminiKey,
    };
  }

  if (openaiKey) {
    return {
      provider: 'openai',
      model: process.env.DAILY_NEWS_AI_MODEL?.trim() || 'gpt-4o-mini',
      apiKey: openaiKey,
    };
  }

  if (anthropicKey) {
    return {
      provider: 'anthropic',
      model: process.env.DAILY_NEWS_AI_MODEL?.trim() || 'claude-3-5-haiku-20241022',
      apiKey: anthropicKey,
    };
  }

  return {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: undefined,
  };
}

export function isAIConfigured(): boolean {
  const config = getAIProviderConfig();
  return Boolean(config.apiKey);
}

export async function callAIModel(
  systemPrompt: string,
  userPrompt: string,
  preferredModel?: string
): Promise<LLMResponse> {
  const config = getAIProviderConfig();

  if (!config.apiKey) {
    throw new Error(
      'AI Provider API key is missing. Please configure GEMINI_API_KEY (recommended) or OPENAI_API_KEY in your Vercel / server environment variables.'
    );
  }

  const modelName = preferredModel || config.model;

  // 1. Google Gemini Provider
  if (config.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 2500,
        },
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Google Gemini API error (HTTP ${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned an empty response candidate.');
    }

    return {
      text: candidateText,
      provider: 'gemini',
      model: modelName,
      promptTokens: data.usageMetadata?.promptTokenCount,
      completionTokens: data.usageMetadata?.candidatesTokenCount,
    };
  }

  // 2. OpenAI Provider
  if (config.provider === 'openai') {
    const url = 'https://api.openai.com/v1/chat/completions';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI API error (HTTP ${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI API returned an empty message content.');
    }

    return {
      text: content,
      provider: 'openai',
      model: modelName,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    };
  }

  throw new Error(`Unsupported AI provider: ${config.provider}`);
}

