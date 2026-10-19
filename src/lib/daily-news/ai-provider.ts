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
      model: process.env.DAILY_NEWS_AI_MODEL?.trim() || 'gemini-3.8-flash',
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
    model: 'gemini-3.8-flash',
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

  let modelName = preferredModel || config.model;
  if (modelName === 'gemini-2.5-flash') {
    modelName = 'gemini-3.8-flash';
  }

  // 1. Google Gemini Provider
  if (config.provider === 'gemini') {
    const candidateModels = Array.from(
      new Set([
        modelName,
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-3-flash-preview',
      ])
    );

    let lastError: Error | null = null;
    for (const activeModel of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${config.apiKey}`;

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
              maxOutputTokens: 8192,
              thinkingConfig: {
                thinkingLevel: 'low',
              },
            },
          }),
          signal: AbortSignal.timeout(45000),
        });

        if (!res.ok) {
          const errBody = await res.text();
          if (res.status === 503 || res.status === 429 || res.status === 404) {
            console.warn(`[Gemini] Model ${activeModel} returned HTTP ${res.status}, falling back to next available model...`);
            lastError = new Error(`Google Gemini API error (HTTP ${res.status}): ${errBody}`);
            continue;
          }
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
          model: activeModel,
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
        };
      } catch (callErr: any) {
        lastError = callErr;
        console.warn(`[Gemini] Attempt with ${activeModel} failed: ${callErr?.message || callErr}`);
      }
    }

    throw lastError || new Error('All Gemini candidate models failed to generate content.');
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

