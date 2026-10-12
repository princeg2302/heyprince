import { AIModelProvider, AIAnalysisInput, AIAnalysisResult } from './types';
import { DeterministicRuleEngineAdapter } from './deterministic-adapter';
import { GeminiAIAdapter } from './gemini-adapter';
import { saveAIAnalysis } from '../db';
import { AIAnalysisEntity } from '../types';

export class AIEngineService {
  private providers: Map<string, AIModelProvider> = new Map();
  private fallbackProvider: AIModelProvider;

  constructor() {
    this.fallbackProvider = new DeterministicRuleEngineAdapter();
    this.registerProvider(this.fallbackProvider);
    this.registerProvider(new GeminiAIAdapter());
  }

  public registerProvider(provider: AIModelProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  public getProvider(preferredName?: string): AIModelProvider {
    if (preferredName) {
      const p = this.providers.get(preferredName.toLowerCase());
      if (p && p.isConfigured()) return p;
    }

    // Check Gemini
    const gemini = this.providers.get('gemini');
    if (gemini && gemini.isConfigured()) return gemini;

    // Default safe fallback
    return this.fallbackProvider;
  }

  /**
   * Generates AI analysis & personalization for a business, with automated fallback
   */
  async analyzeAndSave(
    businessId: string,
    input: AIAnalysisInput,
    preferredProvider?: string
  ): Promise<AIAnalysisEntity> {
    const provider = this.getProvider(preferredProvider);
    let result: AIAnalysisResult;

    try {
      result = await provider.analyzeBusiness(input);
    } catch (err: any) {
      console.warn(
        `[AIEngineService] Provider '${provider.name}' failed (${err.message}). Falling back to deterministic rule engine.`
      );
      result = await this.fallbackProvider.analyzeBusiness(input);
    }

    return saveAIAnalysis({
      business_id: businessId,
      model_provider: result.provider,
      model_name: result.modelName,
      business_summary: result.analysis.businessSummary,
      observed_digital_opportunity: result.analysis.observedDigitalOpportunity,
      recommended_service: result.analysis.recommendedService,
      evidence: result.analysis.evidence,
      confidence_level: result.analysis.confidenceLevel,
      suggested_subject: result.analysis.suggestedSubject,
      personalized_draft: result.analysis.personalizedDraft,
      unsupported_claim_warnings: result.analysis.unsupportedClaimWarnings,
      prompt_tokens: result.promptTokens,
      completion_tokens: result.completionTokens,
      estimated_cost_usd: result.estimatedCostUsd,
    });
  }
}

export const aiEngineService = new AIEngineService();
