import pg from 'pg';
import {
  BusinessEntity,
  ContactEntity,
  DiscoveryJobEntity,
  WebsiteAuditEntity,
  AIAnalysisEntity,
  CampaignEntity,
  ComplianceEvidenceEntity,
  SuppressionEntity,
  EmailMessageEntity,
  OutreachSettingsEntity,
  BusinessStatus,
  VerificationStatus,
  DiscoveryJobStatus,
  ComplianceDecision,
  SuppressionReason,
  EmailMessageStatus,
} from './types';

let pool: pg.Pool | null = null;

export function getOutreachPool(): pg.Pool {
  if (!pool) {
    let uri =
      process.env.DATABASE_URI ||
      process.env.POSTGRES_URL ||
      'postgresql://postgres:postgres@127.0.0.1:5432/heyprince';

    // Auto-route Supabase pooler from session mode (5432) to transaction mode (6543)
    if (uri.includes('pooler.supabase.com:5432')) {
      uri = uri.replace(':5432', ':6543');
    }

    pool = new pg.Pool({
      connectionString: uri,
      ssl:
        uri && !uri.includes('127.0.0.1') && !uri.includes('localhost')
          ? { rejectUnauthorized: false }
          : false,
      max: 6,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[Outreach DB Pool] Idle client error:', err);
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getOutreachPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

// ============================================================================
// 1. Settings & Emergency Kill Switch
// ============================================================================

export async function getOutreachSettings(): Promise<OutreachSettingsEntity> {
  const rows = await query<OutreachSettingsEntity>(
    `SELECT * FROM outreach_settings WHERE id = 'default_settings' LIMIT 1;`
  );
  if (rows.length > 0) return rows[0];

  // If table is newly created, create and return default with kill switch true
  const created = await query<OutreachSettingsEntity>(
    `INSERT INTO outreach_settings (id, global_kill_switch, test_mode) 
     VALUES ('default_settings', TRUE, TRUE) 
     ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
     RETURNING *;`
  );
  return created[0];
}

export async function updateOutreachSettings(
  updates: Partial<Omit<OutreachSettingsEntity, 'id' | 'updated_at'>>
): Promise<OutreachSettingsEntity> {
  const current = await getOutreachSettings();
  const merged = { ...current, ...updates };

  const rows = await query<OutreachSettingsEntity>(
    `UPDATE outreach_settings SET 
      global_kill_switch = $1,
      test_mode = $2,
      daily_send_cap = $3,
      domain_hourly_cap = $4,
      min_delay_between_sends_seconds = $5,
      default_ai_provider = $6,
      default_discovery_provider = $7,
      require_manual_review = $8,
      company_name = $9,
      physical_address = $10,
      contact_email = $11,
      updated_at = NOW()
     WHERE id = 'default_settings'
     RETURNING *;`,
    [
      merged.global_kill_switch,
      merged.test_mode,
      merged.daily_send_cap,
      merged.domain_hourly_cap,
      merged.min_delay_between_sends_seconds,
      merged.default_ai_provider,
      merged.default_discovery_provider,
      merged.require_manual_review,
      merged.company_name,
      merged.physical_address,
      merged.contact_email,
    ]
  );
  return rows[0];
}

// ============================================================================
// 2. Businesses & Deduplication
// ============================================================================

export async function findBusinessByProviderId(
  provider: string,
  providerId: string
): Promise<BusinessEntity | null> {
  const rows = await query<BusinessEntity>(
    `SELECT * FROM businesses WHERE source_provider = $1 AND source_provider_id = $2 LIMIT 1;`,
    [provider, providerId]
  );
  return rows[0] || null;
}

export async function findBusinessByDomain(
  normalizedDomain: string
): Promise<BusinessEntity | null> {
  if (!normalizedDomain) return null;
  const rows = await query<BusinessEntity>(
    `SELECT * FROM businesses WHERE normalized_domain = $1 LIMIT 1;`,
    [normalizedDomain]
  );
  return rows[0] || null;
}

export async function upsertBusiness(data: {
  name: string;
  domain?: string | null;
  normalized_domain?: string | null;
  website_url?: string | null;
  country_code: string;
  region?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  industry?: string | null;
  category?: string | null;
  source_provider: string;
  source_provider_id: string;
  metadata?: Record<string, any>;
  status?: BusinessStatus;
}): Promise<{ business: BusinessEntity; isNew: boolean }> {
  // Check provider unique record first
  const existing = await findBusinessByProviderId(data.source_provider, data.source_provider_id);
  if (existing) {
    const updated = await query<BusinessEntity>(
      `UPDATE businesses SET 
        name = COALESCE($1, name),
        website_url = COALESCE($2, website_url),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        metadata = metadata || $5::jsonb,
        updated_at = NOW()
       WHERE id = $6 RETURNING *;`,
      [
        data.name,
        data.website_url,
        data.address,
        data.city,
        JSON.stringify(data.metadata || {}),
        existing.id,
      ]
    );
    return { business: updated[0], isNew: false };
  }

  const rows = await query<BusinessEntity>(
    `INSERT INTO businesses (
      name, domain, normalized_domain, website_url, country_code, region, city, address,
      postal_code, latitude, longitude, industry, category, source_provider, source_provider_id,
      metadata, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *;`,
    [
      data.name,
      data.domain || null,
      data.normalized_domain || null,
      data.website_url || null,
      data.country_code.toUpperCase(),
      data.region || null,
      data.city || null,
      data.address || null,
      data.postal_code || null,
      data.latitude || null,
      data.longitude || null,
      data.industry || null,
      data.category || null,
      data.source_provider,
      data.source_provider_id,
      JSON.stringify(data.metadata || {}),
      data.status || 'DISCOVERED',
    ]
  );
  return { business: rows[0], isNew: true };
}

export async function getBusinesses(options: {
  countryCode?: string;
  category?: string;
  status?: BusinessStatus;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: BusinessEntity[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (options.countryCode) {
    conditions.push(`country_code = $${paramIdx++}`);
    params.push(options.countryCode.toUpperCase());
  }
  if (options.category) {
    conditions.push(`category ILIKE $${paramIdx++}`);
    params.push(`%${options.category}%`);
  }
  if (options.status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(options.status);
  }
  if (options.search) {
    conditions.push(`(name ILIKE $${paramIdx} OR domain ILIKE $${paramIdx} OR city ILIKE $${paramIdx})`);
    params.push(`%${options.search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM businesses ${whereClause};`,
    params
  );
  const total = parseInt(countRes[0]?.count || '0', 10);

  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;
  params.push(limit, offset);

  const items = await query<BusinessEntity>(
    `SELECT * FROM businesses ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++};`,
    params
  );

  return { items, total };
}

export async function getBusinessById(id: string): Promise<BusinessEntity | null> {
  const rows = await query<BusinessEntity>(`SELECT * FROM businesses WHERE id = $1 LIMIT 1;`, [id]);
  return rows[0] || null;
}

// ============================================================================
// 3. Contacts & Verification
// ============================================================================

export async function upsertContact(data: {
  business_id: string;
  email: string;
  raw_email?: string | null;
  name?: string | null;
  role_or_title?: string | null;
  phone?: string | null;
  source_url?: string | null;
  provenance?: string | null;
  syntax_valid?: boolean;
  mx_valid?: boolean | null;
  verification_status?: VerificationStatus;
  verification_confidence?: number | null;
  verification_details?: Record<string, any>;
  is_role_account?: boolean;
  is_disposable?: boolean;
  is_catchall?: boolean | null;
}): Promise<ContactEntity> {
  const normEmail = data.email.toLowerCase().trim();

  const rows = await query<ContactEntity>(
    `INSERT INTO contacts (
      business_id, email, raw_email, name, role_or_title, phone, source_url, provenance,
      syntax_valid, mx_valid, verification_status, verification_confidence, verification_details,
      is_role_account, is_disposable, is_catchall
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (business_id, email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, contacts.name),
      phone = COALESCE(EXCLUDED.phone, contacts.phone),
      role_or_title = COALESCE(EXCLUDED.role_or_title, contacts.role_or_title),
      mx_valid = COALESCE(EXCLUDED.mx_valid, contacts.mx_valid),
      verification_status = EXCLUDED.verification_status,
      verification_confidence = EXCLUDED.verification_confidence,
      verification_details = contacts.verification_details || EXCLUDED.verification_details,
      updated_at = NOW()
    RETURNING *;`,
    [
      data.business_id,
      normEmail,
      data.raw_email || data.email,
      data.name || null,
      data.role_or_title || null,
      data.phone || null,
      data.source_url || null,
      data.provenance || 'public_web',
      data.syntax_valid !== undefined ? data.syntax_valid : true,
      data.mx_valid ?? null,
      data.verification_status || 'UNKNOWN',
      data.verification_confidence ?? null,
      JSON.stringify(data.verification_details || {}),
      data.is_role_account || false,
      data.is_disposable || false,
      data.is_catchall ?? null,
    ]
  );
  return rows[0];
}

export async function getContactsForBusiness(businessId: string): Promise<ContactEntity[]> {
  return query<ContactEntity>(
    `SELECT * FROM contacts WHERE business_id = $1 ORDER BY created_at DESC;`,
    [businessId]
  );
}

// ============================================================================
// 4. Discovery Jobs
// ============================================================================

export async function createDiscoveryJob(data: {
  provider: string;
  country_code: string;
  region?: string | null;
  city?: string | null;
  category?: string | null;
  query?: string | null;
}): Promise<DiscoveryJobEntity> {
  const rows = await query<DiscoveryJobEntity>(
    `INSERT INTO discovery_jobs (provider, country_code, region, city, category, query, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
     RETURNING *;`,
    [
      data.provider,
      data.country_code.toUpperCase(),
      data.region || null,
      data.city || null,
      data.category || null,
      data.query || null,
    ]
  );
  return rows[0];
}

export async function updateDiscoveryJob(
  id: string,
  updates: Partial<DiscoveryJobEntity>
): Promise<DiscoveryJobEntity> {
  const setClauses: string[] = [];
  const params: any[] = [id];
  let idx = 2;

  for (const [key, val] of Object.entries(updates)) {
    if (key === 'id' || key === 'created_at') continue;
    if (key === 'cursor') {
      setClauses.push(`${key} = $${idx++}::jsonb`);
      params.push(JSON.stringify(val || {}));
    } else {
      setClauses.push(`${key} = $${idx++}`);
      params.push(val);
    }
  }

  setClauses.push('updated_at = NOW()');

  const rows = await query<DiscoveryJobEntity>(
    `UPDATE discovery_jobs SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *;`,
    params
  );
  return rows[0];
}

export async function getDiscoveryJobs(limit = 20): Promise<DiscoveryJobEntity[]> {
  return query<DiscoveryJobEntity>(
    `SELECT * FROM discovery_jobs ORDER BY created_at DESC LIMIT $1;`,
    [limit]
  );
}

// ============================================================================
// 5. Website Audits
// ============================================================================

export async function saveWebsiteAudit(data: Omit<WebsiteAuditEntity, 'id' | 'created_at'>): Promise<WebsiteAuditEntity> {
  const rows = await query<WebsiteAuditEntity>(
    `INSERT INTO website_audits (
      business_id, target_url, final_url, http_status, is_reachable, has_https,
      mobile_friendly, has_contact_page, has_booking_system, has_ecommerce,
      has_newsletter, has_live_chat, speed_index_ms, detected_technologies, signals, error, audited_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *;`,
    [
      data.business_id,
      data.target_url,
      data.final_url || null,
      data.http_status || null,
      data.is_reachable,
      data.has_https,
      data.mobile_friendly,
      data.has_contact_page,
      data.has_booking_system,
      data.has_ecommerce,
      data.has_newsletter,
      data.has_live_chat,
      data.speed_index_ms || null,
      JSON.stringify(data.detected_technologies || []),
      JSON.stringify(data.signals || {}),
      data.error || null,
      data.audited_at || new Date().toISOString(),
    ]
  );

  // Update business status to AUDITED
  await query(`UPDATE businesses SET status = 'AUDITED', updated_at = NOW() WHERE id = $1;`, [data.business_id]);

  return rows[0];
}

export async function getLatestAuditForBusiness(businessId: string): Promise<WebsiteAuditEntity | null> {
  const rows = await query<WebsiteAuditEntity>(
    `SELECT * FROM website_audits WHERE business_id = $1 ORDER BY audited_at DESC LIMIT 1;`,
    [businessId]
  );
  return rows[0] || null;
}

// ============================================================================
// 6. AI Analyses & Recommendations
// ============================================================================

export async function saveAIAnalysis(data: Omit<AIAnalysisEntity, 'id' | 'created_at'>): Promise<AIAnalysisEntity> {
  const rows = await query<AIAnalysisEntity>(
    `INSERT INTO ai_analyses (
      business_id, model_provider, model_name, business_summary, observed_digital_opportunity,
      recommended_service, evidence, confidence_level, suggested_subject, personalized_draft,
      unsupported_claim_warnings, prompt_tokens, completion_tokens, estimated_cost_usd
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;`,
    [
      data.business_id,
      data.model_provider,
      data.model_name,
      data.business_summary,
      data.observed_digital_opportunity,
      data.recommended_service,
      data.evidence,
      data.confidence_level,
      data.suggested_subject,
      data.personalized_draft,
      JSON.stringify(data.unsupported_claim_warnings || []),
      data.prompt_tokens || null,
      data.completion_tokens || null,
      data.estimated_cost_usd || null,
    ]
  );

  await query(`UPDATE businesses SET status = 'ENRICHED', updated_at = NOW() WHERE id = $1;`, [data.business_id]);

  return rows[0];
}

export async function getAIAnalysisForBusiness(businessId: string): Promise<AIAnalysisEntity | null> {
  const rows = await query<AIAnalysisEntity>(
    `SELECT * FROM ai_analyses WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1;`,
    [businessId]
  );
  return rows[0] || null;
}

// ============================================================================
// 7. Compliance & Suppression
// ============================================================================

export async function isSuppressed(email: string, domain?: string | null): Promise<boolean> {
  const normEmail = email.toLowerCase().trim();
  const checks = [`email = $1`];
  const params: any[] = [normEmail];

  if (domain) {
    checks.push(`domain = $2`);
    params.push(domain.toLowerCase().trim());
  }

  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM suppressions WHERE ${checks.join(' OR ')};`,
    params
  );
  return parseInt(rows[0]?.count || '0', 10) > 0;
}

export async function addSuppression(data: {
  email: string;
  domain?: string | null;
  reason: SuppressionReason;
  source: string;
  campaign_id?: string | null;
  metadata?: Record<string, any>;
}): Promise<SuppressionEntity> {
  const normEmail = data.email.toLowerCase().trim();
  const normDomain = data.domain ? data.domain.toLowerCase().trim() : normEmail.split('@')[1] || null;

  const rows = await query<SuppressionEntity>(
    `INSERT INTO suppressions (email, domain, reason, source, campaign_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET
       reason = EXCLUDED.reason,
       source = EXCLUDED.source,
       metadata = suppressions.metadata || EXCLUDED.metadata
     RETURNING *;`,
    [
      normEmail,
      normDomain,
      data.reason,
      data.source,
      data.campaign_id || null,
      JSON.stringify(data.metadata || {}),
    ]
  );
  return rows[0];
}

export async function saveComplianceEvidence(data: Omit<ComplianceEvidenceEntity, 'id' | 'created_at'>): Promise<ComplianceEvidenceEntity> {
  const rows = await query<ComplianceEvidenceEntity>(
    `INSERT INTO compliance_evidence (
      contact_id, business_id, jurisdiction, decision, legal_basis, reason,
      policy_version, evidence_snapshot, evaluated_at, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;`,
    [
      data.contact_id,
      data.business_id,
      data.jurisdiction,
      data.decision,
      data.legal_basis,
      data.reason,
      data.policy_version,
      JSON.stringify(data.evidence_snapshot || {}),
      data.evaluated_at || new Date().toISOString(),
      data.expires_at || null,
    ]
  );
  return rows[0];
}

// ============================================================================
// 8. Queue & Email Dispatch
// ============================================================================

export async function createQueuedEmail(data: Omit<EmailMessageEntity, 'id' | 'created_at' | 'updated_at'>): Promise<EmailMessageEntity> {
  const rows = await query<EmailMessageEntity>(
    `INSERT INTO email_messages (
      campaign_id, business_id, contact_id, ai_analysis_id, recipient_email, recipient_name,
      sender_email, sender_name, subject, body_html, body_text, unsubscribe_token, status,
      provider, attempts, max_attempts, scheduled_for
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *;`,
    [
      data.campaign_id || null,
      data.business_id,
      data.contact_id,
      data.ai_analysis_id || null,
      data.recipient_email.toLowerCase().trim(),
      data.recipient_name || null,
      data.sender_email,
      data.sender_name,
      data.subject,
      data.body_html,
      data.body_text,
      data.unsubscribe_token,
      data.status || 'DRAFT',
      data.provider || null,
      data.attempts || 0,
      data.max_attempts || 3,
      data.scheduled_for || new Date().toISOString(),
    ]
  );
  return rows[0];
}

export async function getDueQueuedEmails(batchSize = 10): Promise<EmailMessageEntity[]> {
  return query<EmailMessageEntity>(
    `SELECT * FROM email_messages 
     WHERE status = 'QUEUED' AND (scheduled_for IS NULL OR scheduled_for <= NOW())
     ORDER BY scheduled_for ASC
     LIMIT $1;`,
    [batchSize]
  );
}

export async function updateEmailStatus(
  id: string,
  status: EmailMessageStatus,
  extra: {
    provider_message_id?: string;
    error_message?: string;
    sent_at?: string;
    delivered_at?: string;
    bounced_at?: string;
  } = {}
): Promise<EmailMessageEntity> {
  const rows = await query<EmailMessageEntity>(
    `UPDATE email_messages SET 
      status = $1,
      provider_message_id = COALESCE($2, provider_message_id),
      error_message = COALESCE($3, error_message),
      sent_at = COALESCE($4, sent_at),
      delivered_at = COALESCE($5, delivered_at),
      bounced_at = COALESCE($6, bounced_at),
      updated_at = NOW()
     WHERE id = $7 RETURNING *;`,
    [
      status,
      extra.provider_message_id || null,
      extra.error_message || null,
      extra.sent_at || null,
      extra.delivered_at || null,
      extra.bounced_at || null,
      id,
    ]
  );
  return rows[0];
}

// ============================================================================
// 9. Analytics & Overview Metrics
// ============================================================================

export async function getOutreachAnalyticsSummary(): Promise<{
  totalBusinesses: number;
  totalAudited: number;
  totalContacts: number;
  validContacts: number;
  queuedEmails: number;
  sentEmails: number;
  deliveredEmails: number;
  bouncedEmails: number;
  suppressedEmails: number;
  killSwitchActive: boolean;
  testModeActive: boolean;
}> {
  const [bRes, cRes, eRes, sRes, settings] = await Promise.all([
    query<{ count: string; audited: string }>(
      `SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE status = 'AUDITED' OR status = 'ENRICHED') as audited FROM businesses;`
    ),
    query<{ total: string; valid: string }>(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE verification_status = 'VALID') as valid FROM contacts;`
    ),
    query<{ queued: string; sent: string; delivered: string; bounced: string }>(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'QUEUED') as queued,
        COUNT(*) FILTER (WHERE status = 'SENT') as sent,
        COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
        COUNT(*) FILTER (WHERE status = 'BOUNCED') as bounced
       FROM email_messages;`
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM suppressions;`),
    getOutreachSettings(),
  ]);

  return {
    totalBusinesses: parseInt(bRes[0]?.count || '0', 10),
    totalAudited: parseInt(bRes[0]?.audited || '0', 10),
    totalContacts: parseInt(cRes[0]?.total || '0', 10),
    validContacts: parseInt(cRes[0]?.valid || '0', 10),
    queuedEmails: parseInt(eRes[0]?.queued || '0', 10),
    sentEmails: parseInt(eRes[0]?.sent || '0', 10),
    deliveredEmails: parseInt(eRes[0]?.delivered || '0', 10),
    bouncedEmails: parseInt(eRes[0]?.bounced || '0', 10),
    suppressedEmails: parseInt(sRes[0]?.count || '0', 10),
    killSwitchActive: settings.global_kill_switch,
    testModeActive: settings.test_mode,
  };
}
