import { AIModelProvider, AIAnalysisInput, AIAnalysisResult } from './types';
import { AIAnalysisPayload, AIAnalysisSchema } from '../types';

export class GeminiAIAdapter implements AIModelProvider {
  name = 'gemini';

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async analyzeBusiness(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }

    const systemPrompt = `You are a factual, ethical business intelligence analyst for HeyPrince (https://heyprince.in), a premium digital engineering studio offering:
- Website Design & Development
- E-Commerce Storefront
- Web & Mobile Applications
- Booking & Reservation System
- Business Process Automation
- CRM & Pipeline Integration
- Newsletter & Email Systems
- Custom Software Engineering

RULES:
1. Never invent a business problem.
2. Never claim a website is broken without explicit evidence in the audit signals.
3. Never fabricate personal details, customer relationships, prior conversations, or previous consent.
4. Output MUST strictly be valid JSON matching the required schema.
5. In personalizedDraft: Identify sender as "Prince from HeyPrince", clearly state commercial intent, keep concise (< 200 words), and include "{{UNSUBSCRIBE_URL}}" at the bottom.`;

    const userPrompt = `Analyze the following business and verified audit signals:
Business Name: ${input.businessName}
Category: ${input.category}
Location: ${input.city || 'Unknown'}, ${input.countryCode}
Website: ${input.websiteUrl || 'None'}
Audit Signals: ${JSON.stringify(input.auditSignals || {}, null, 2)}

Respond with JSON adhering to:
{
  "businessSummary": "string (concise factual overview)",
  "observedDigitalOpportunity": "string (clear observable opportunity)",
  "recommendedService": "One of the 8 HeyPrince services listed above",
  "evidence": "string (direct fact from audit signals)",
  "confidenceLevel": number (between 0.0 and 1.0),
  "suggestedSubject": "string (concise professional email subject)",
  "personalizedDraft": "string (polite, direct outreach message with {{UNSUBSCRIBE_URL}})",
  "unsupportedClaimWarnings": []
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (HTTP ${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned empty response candidate.');
    }

    const parsedJson = JSON.parse(candidateText);
    const validated: AIAnalysisPayload = AIAnalysisSchema.parse(parsedJson);

    return {
      provider: 'gemini',
      modelName: 'gemini-2.5-flash',
      analysis: validated,
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      estimatedCostUsd: 0.0001,
    };
  }
}
