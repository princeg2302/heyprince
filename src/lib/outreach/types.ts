import { z } from 'zod';

// ============================================================================
// 1. Core Enums
// ============================================================================

export type BusinessStatus = 'DISCOVERED' | 'AUDITED' | 'ENRICHED' | 'DISQUALIFIED';
export type VerificationStatus = 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN';
export type DiscoveryJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
export type ComplianceDecision = 'ELIGIBLE' | 'INELIGIBLE' | 'REVIEW_REQUIRED' | 'UNKNOWN';
export type SuppressionReason = 'UNSUBSCRIBE' | 'HARD_BOUNCE' | 'SPAM_COMPLAINT' | 'MANUAL_BLOCK' | 'LEGAL_REQUEST';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type EmailMessageStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'BOUNCED'
  | 'COMPLAINED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SUPPRESSED';

export type EmailEventType =
  | 'QUEUED'
  | 'SEND_ATTEMPT'
  | 'SENT'
  | 'DELIVERED'
  | 'BOUNCE'
  | 'COMPLAINT'
  | 'OPEN'
  | 'CLICK'
  | 'UNSUBSCRIBE'
  | 'REPLY'
  | 'FAILED';

// ============================================================================
// 2. Data Entity Interfaces
// ============================================================================

export interface BusinessEntity {
  id: string;
  name: string;
  domain: string | null;
  normalized_domain: string | null;
  website_url: string | null;
  country_code: string;
  region: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  industry: string | null;
  category: string | null;
  source_provider: string;
  source_provider_id: string;
  metadata: Record<string, any>;
  status: BusinessStatus;
  created_at: string;
  updated_at: string;
}

export interface ContactEntity {
  id: string;
  business_id: string;
  email: string;
  raw_email: string | null;
  name: string | null;
  role_or_title: string | null;
  phone: string | null;
  source_url: string | null;
  provenance: string | null;
  syntax_valid: boolean;
  mx_valid: boolean | null;
  verification_status: VerificationStatus;
  verification_confidence: number | null;
  verification_details: Record<string, any>;
  is_role_account: boolean;
  is_disposable: boolean;
  is_catchall: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryJobEntity {
  id: string;
  provider: string;
  country_code: string;
  region: string | null;
  city: string | null;
  category: string | null;
  query: string | null;
  status: DiscoveryJobStatus;
  total_found: number;
  total_inserted: number;
  total_duplicates: number;
  cursor: Record<string, any>;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteAuditEntity {
  id: string;
  business_id: string;
  target_url: string;
  final_url: string | null;
  http_status: number | null;
  is_reachable: boolean;
  has_https: boolean;
  mobile_friendly: boolean;
  has_contact_page: boolean;
  has_booking_system: boolean;
  has_ecommerce: boolean;
  has_newsletter: boolean;
  has_live_chat: boolean;
  speed_index_ms: number | null;
  detected_technologies: string[];
  signals: Record<string, any>;
  error: string | null;
  audited_at: string;
  created_at: string;
}

export interface AIAnalysisEntity {
  id: string;
  business_id: string;
  model_provider: string;
  model_name: string;
  business_summary: string;
  observed_digital_opportunity: string;
  recommended_service: string;
  evidence: string;
  confidence_level: number;
  suggested_subject: string;
  personalized_draft: string;
  unsupported_claim_warnings: string[];
  prompt_tokens: number | null;
  completion_tokens: number | null;
  estimated_cost_usd: number | null;
  created_at: string;
}

export interface CampaignEntity {
  id: string;
  name: string;
  service_offering: string;
  target_countries: string[];
  target_categories: string[];
  status: CampaignStatus;
  daily_limit: number;
  domain_hourly_limit: number;
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_complaints: number;
  total_unsubscribed: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceEvidenceEntity {
  id: string;
  contact_id: string;
  business_id: string;
  jurisdiction: string;
  decision: ComplianceDecision;
  legal_basis: string;
  reason: string;
  policy_version: string;
  evidence_snapshot: Record<string, any>;
  evaluated_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface SuppressionEntity {
  id: string;
  email: string;
  domain: string | null;
  reason: SuppressionReason;
  source: string;
  campaign_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EmailMessageEntity {
  id: string;
  campaign_id: string | null;
  business_id: string;
  contact_id: string;
  ai_analysis_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  sender_email: string;
  sender_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  unsubscribe_token: string;
  status: EmailMessageStatus;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  scheduled_for: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  bounced_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachSettingsEntity {
  id: string;
  global_kill_switch: boolean;
  test_mode: boolean;
  daily_send_cap: number;
  domain_hourly_cap: number;
  min_delay_between_sends_seconds: number;
  default_ai_provider: string;
  default_discovery_provider: string;
  require_manual_review: boolean;
  company_name: string;
  physical_address: string;
  contact_email: string;
  updated_at: string;
}

// ============================================================================
// 3. Zod Validation Schemas
// ============================================================================

export const AIAnalysisSchema = z.object({
  businessSummary: z.string().min(10, 'Business summary must be descriptive'),
  observedDigitalOpportunity: z.string().min(10, 'Digital opportunity must be documented'),
  recommendedService: z.enum([
    'Website Design & Development',
    'E-Commerce Storefront',
    'Web & Mobile Applications',
    'Booking & Reservation System',
    'Business Process Automation',
    'CRM & Pipeline Integration',
    'Newsletter & Email Systems',
    'Custom Software Engineering',
  ]),
  evidence: z.string().min(5, 'Specific evidence from audit is required'),
  confidenceLevel: z.number().min(0.0).max(1.0),
  suggestedSubject: z.string().min(5).max(150),
  personalizedDraft: z.string().min(50).max(3000),
  unsupportedClaimWarnings: z.array(z.string()).default([]),
});

export type AIAnalysisPayload = z.infer<typeof AIAnalysisSchema>;

export const DiscoveryJobCreateSchema = z.object({
  provider: z.enum(['openstreetmap', 'mock', 'google_places']).default('openstreetmap'),
  countryCode: z.string().min(2).max(2).toUpperCase(),
  region: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  category: z.string().min(1, 'Business category is required'),
  query: z.string().optional(),
});

export type DiscoveryJobCreateInput = z.infer<typeof DiscoveryJobCreateSchema>;
