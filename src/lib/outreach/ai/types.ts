import { AIAnalysisPayload } from '../types';

export interface AIAnalysisInput {
  businessName: string;
  category: string;
  city?: string | null;
  countryCode: string;
  websiteUrl?: string | null;
  auditSignals?: {
    isReachable: boolean;
    hasHttps: boolean;
    mobileFriendly: boolean;
    hasContactPage: boolean;
    hasBookingSystem: boolean;
    hasEcommerce: boolean;
    hasNewsletter: boolean;
    hasLiveChat: boolean;
    speedIndexMs?: number | null;
    detectedTechnologies: string[];
    signals: Record<string, any>;
  } | null;
}

export interface AIAnalysisResult {
  provider: string;
  modelName: string;
  analysis: AIAnalysisPayload;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
}

export interface AIModelProvider {
  name: string;
  isConfigured(): boolean;
  analyzeBusiness(input: AIAnalysisInput): Promise<AIAnalysisResult>;
}

