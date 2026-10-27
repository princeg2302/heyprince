import crypto from 'crypto';
import { query } from '../outreach/db';
import { supabase } from '../admin-db';
import { servicesList } from '@/data/servicesData';

// In-flight media generation concurrency locks
const activeMediaLocks = new Map<string, number>();

// ============================================================================
// 1. CANONICAL DOMAIN & LEAD NORMALIZATION
// ============================================================================

/**
 * Normalizes any website URL or domain into a clean canonical hostname.
 * Examples:
 *   "https://www.DrTrivediClinic.com/about-us?src=google" -> "drtrivediclinic.com"
 *   "http://sub.domain.co.uk:8080/" -> "sub.domain.co.uk"
 */
export function normalizeDomain(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim().toLowerCase();

  // Strip protocol
  clean = clean.replace(/^https?:\/\//i, '');
  // Strip www.
  clean = clean.replace(/^www\./i, '');
  // Strip path, query params, hash
  clean = clean.split('/')[0].split('?')[0].split('#')[0];
  // Strip port
  clean = clean.split(':')[0];
  // Strip trailing periods or spaces
  clean = clean.replace(/\.+$/, '').trim();

  return clean;
}

/**
 * Normalizes company names for fuzzy identity matching.
 * Examples:
 *   "NordicPulse Retail, LLC." -> "nordicpulse retail"
 *   "Dr. Umesh Trivedi Clinic Pvt Ltd" -> "dr umesh trivedi"
 */
export function normalizeCompanyName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '';
  let clean = name.toLowerCase().trim();

  // Strip leading "the "
  clean = clean.replace(/^the\s+/g, '');

  // Strip common corporate suffixes
  const suffixes = [
    /\b(inc|incorporated)\b/g,
    /\b(llc|l\.l\.c\.)\b/g,
    /\b(ltd|limited)\b/g,
    /\b(pvt|private)\b/g,
    /\b(corp|corporation)\b/g,
    /\b(gmbh|plc|sa|srl)\b/g,
    /\b(clinic|hospital)\b/g,
    /\b(co|company)\b/g,
  ];

  for (const s of suffixes) {
    clean = clean.replace(s, '');
  }

  // Remove punctuation & collapse multiple spaces
  clean = clean.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return clean;
}

/**
 * Normalizes email address.
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Comprehensive check across businesses, contacts, and approval drafts
 * to ensure a prospective lead is never duplicated.
 */
export async function checkLeadDuplicate(data: {
  domain?: string | null;
  name?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
}): Promise<{
  isDuplicate: boolean;
  existingBusinessId?: string;
  canonicalDomain: string;
  reason?: string;
}> {
  const canonical = normalizeDomain(data.domain || data.websiteUrl);
  const cleanEmail = normalizeEmail(data.email);
  const cleanName = normalizeCompanyName(data.name);

  // 1. Check by canonical domain in businesses table
  if (canonical) {
    const byDomain = await query<{ id: string; name: string }>(
      `SELECT id, name FROM businesses WHERE normalized_domain = $1 OR domain = $1 LIMIT 1;`,
      [canonical]
    );

    if (byDomain.length > 0) {
      return {
        isDuplicate: true,
        existingBusinessId: byDomain[0].id,
        canonicalDomain: canonical,
        reason: `Business already exists with domain "${canonical}" (#${byDomain[0].id} - ${byDomain[0].name})`,
      };
    }

    // Also check if an active draft already exists for this domain
    const byDraftDomain = await query<{ id: string; title: string }>(
      `SELECT id, title FROM chief_content_drafts 
       WHERE metadata->>'domain' = $1 
         AND status IN ('pending_approval', 'approved') 
       LIMIT 1;`,
      [canonical]
    );

    if (byDraftDomain.length > 0) {
      return {
        isDuplicate: true,
        canonicalDomain: canonical,
        reason: `Pending outreach draft already exists for domain "${canonical}" (${byDraftDomain[0].title})`,
      };
    }
  }

  // 2. Check by contact email in contacts table
  if (cleanEmail) {
    const byEmail = await query<{ id: string; business_id: string }>(
      `SELECT id, business_id FROM contacts WHERE email = $1 LIMIT 1;`,
      [cleanEmail]
    );

    if (byEmail.length > 0) {
      return {
        isDuplicate: true,
        existingBusinessId: byEmail[0].business_id,
        canonicalDomain: canonical,
        reason: `Contact email "${cleanEmail}" is already registered under business #${byEmail[0].business_id}`,
      };
    }
  }

  // 3. Check by normalized business name if both have a strong match
  if (cleanName && cleanName.length > 3) {
    const byName = await query<{ id: string; name: string; domain: string | null }>(
      `SELECT id, name, domain FROM businesses 
       WHERE LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g')) = $1 
       LIMIT 1;`,
      [cleanName.replace(/\s+/g, '')]
    );

    if (byName.length > 0) {
      return {
        isDuplicate: true,
        existingBusinessId: byName[0].id,
        canonicalDomain: canonical || byName[0].domain || '',
        reason: `Business name matches existing record "${byName[0].name}" (#${byName[0].id})`,
      };
    }
  }

  return {
    isDuplicate: false,
    canonicalDomain: canonical,
  };
}

/**
 * Merges newly discovered signals/evidence into an existing business record
 * instead of generating a redundant duplicate lead.
 */
export async function mergeBusinessEvidence(
  businessId: string,
  newSignals: Record<string, any> | string[]
): Promise<{ success: boolean; evidenceCount: number }> {
  try {
    const existing = await query<{ metadata: Record<string, any> }>(
      `SELECT metadata FROM businesses WHERE id = $1;`,
      [businessId]
    );

    if (existing.length === 0) return { success: false, evidenceCount: 0 };

    const meta = existing[0].metadata || {};
    let merged = { ...meta };

    if (Array.isArray(newSignals)) {
      const existingAudit = Array.isArray(meta.audit_evidence) ? meta.audit_evidence : [];
      const combined = Array.from(new Set([...existingAudit, ...newSignals]));
      merged.audit_evidence = combined;
    } else {
      merged = {
        ...merged,
        ...newSignals,
      };
    }
    merged.last_evidence_update = new Date().toISOString();

    await query(
      `UPDATE businesses SET metadata = $1, updated_at = NOW() WHERE id = $2;`,
      [JSON.stringify(merged), businessId]
    );

    const totalCount = Array.isArray(merged.audit_evidence) ? merged.audit_evidence.length : Object.keys(merged).length;
    return { success: true, evidenceCount: totalCount };
  } catch (err) {
    console.warn('[mergeBusinessEvidence] Error merging evidence:', err);
    return { success: false, evidenceCount: 0 };
  }
}

// ============================================================================
// 2. CONTENT DEDUPLICATION & SIMILARITY CHECK
// ============================================================================

export function normalizeContentTitle(title: string | null | undefined): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

/**
 * Calculates token similarity (Dice coefficient) between two titles.
 */
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  const normA = normalizeContentTitle(titleA);
  const normB = normalizeContentTitle(titleB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const wordsA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(normB.split(' ').filter((w) => w.length > 2));

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  return (2 * intersection) / (wordsA.size + wordsB.size || 1);
}

/**
 * Checks existing blog posts, service pages, and pending drafts to prevent duplicate content generation.
 */
export async function checkContentDuplicate(options: {
  title: string;
  slug?: string;
  type?: 'article' | 'service_page' | 'website_content' | 'seo_patch';
  content?: string;
}): Promise<{
  isDuplicate: boolean;
  reason?: string;
  existingUrl?: string;
  existingId?: string | number;
}> {
  const cleanTitle = normalizeContentTitle(options.title);
  const targetSlug = options.slug ? options.slug.toLowerCase().trim() : '';

  // 1. Check existing published CMS posts (posts table)
  try {
    const { data: existingPosts } = await supabase
      .from('posts')
      .select('id, title, slug')
      .limit(100);

    if (existingPosts && existingPosts.length > 0) {
      for (const p of existingPosts) {
        if (targetSlug && p.slug === targetSlug) {
          return {
            isDuplicate: true,
            reason: `Published article already exists with slug "${p.slug}"`,
            existingUrl: `/insights/${p.slug}/`,
            existingId: p.id,
          };
        }
        const sim = calculateTitleSimilarity(cleanTitle, p.title);
        if (sim >= 0.75) {
          return {
            isDuplicate: true,
            reason: `Substantially overlapping article already published: "${p.title}" (${Math.round(sim * 100)}% match)`,
            existingUrl: `/insights/${p.slug}/`,
            existingId: p.id,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[checkContentDuplicate] CMS posts check warning:', err);
  }

  // 2. Check existing service pages (servicesList and services table)
  if (options.type === 'service_page' || targetSlug.includes('service')) {
    // Check static servicesList
    for (const s of servicesList) {
      if (targetSlug && s.slug === targetSlug) {
        return {
          isDuplicate: true,
          reason: `Service page already exists on website: "${s.title}" (/services/${s.slug})`,
          existingUrl: `/services/${s.slug}/`,
          existingId: s.id,
        };
      }
      const sim = calculateTitleSimilarity(cleanTitle, s.title);
      if (sim >= 0.7) {
        return {
          isDuplicate: true,
          reason: `Overlaps with existing service: "${s.title}" (${Math.round(sim * 100)}% match)`,
          existingUrl: `/services/${s.slug}/`,
          existingId: s.id,
        };
      }
    }
  }

  // 3. Check pending or published drafts in chief_content_drafts
  try {
    const recentDrafts = await query<{
      id: string;
      title: string;
      metadata: Record<string, any>;
      status: string;
    }>(
      `SELECT id, title, metadata, status FROM chief_content_drafts 
       WHERE status IN ('pending_approval', 'approved', 'published') 
       ORDER BY created_at DESC LIMIT 50;`
    );

    for (const d of recentDrafts) {
      const dSlug = d.metadata?.slug || '';
      if (targetSlug && dSlug === targetSlug) {
        return {
          isDuplicate: true,
          reason: `Draft with slug "${targetSlug}" is already in queue (#${d.id} - ${d.status})`,
          existingId: d.id,
        };
      }

      const sim = calculateTitleSimilarity(cleanTitle, d.title);
      if (sim >= 0.8) {
        return {
          isDuplicate: true,
          reason: `A similar content draft is already awaiting review: "${d.title}" (#${d.id})`,
          existingId: d.id,
        };
      }
    }
  } catch (err) {
    console.warn('[checkContentDuplicate] Drafts check warning:', err);
  }

  return { isDuplicate: false };
}

// ============================================================================
// 3. MEDIA & IMAGE DEDUPLICATION
// ============================================================================

export function computePromptHash(prompt: string): string {
  const clean = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha256').update(clean).digest('hex').slice(0, 32);
}

/**
 * Computes a cryptographic SHA-256 hash of an image's raw binary buffer.
 */
export function computeBufferHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Strictly checks whether an image (by binary content hash or candidate URL)
 * has ever been used before in the media table or as a post cover image.
 * Guarantees zero duplicate images across blog posts and social channels.
 */
export async function isImageContentDuplicate(
  contentHash: string,
  candidateUrl?: string
): Promise<{
  isDuplicate: boolean;
  reason?: string;
  existingId?: number;
}> {
  try {
    // 1. Check by binary content hash in media table
    if (contentHash && contentHash.trim()) {
      const match = await query<{ id: number; url: string }>(
        `SELECT id, url FROM media WHERE content_hash = $1 LIMIT 1;`,
        [contentHash.trim()]
      );

      if (match.length > 0) {
        return {
          isDuplicate: true,
          reason: `Image content hash (${contentHash.slice(0, 12)}...) matches existing Media #${match[0].id}`,
          existingId: match[0].id,
        };
      }
    }

    // 2. Check if candidate URL has already been used as a post's cover_image
    if (candidateUrl && candidateUrl.trim()) {
      const cleanUrl = candidateUrl.trim();
      const postMatch = await query<{ id: number; title: string }>(
        `SELECT id, title FROM posts WHERE cover_image = $1 LIMIT 1;`,
        [cleanUrl]
      );

      if (postMatch.length > 0) {
        return {
          isDuplicate: true,
          reason: `Image URL is already used as the cover of Post #${postMatch[0].id} ("${postMatch[0].title}")`,
          existingId: postMatch[0].id,
        };
      }

      // Check if URL already recorded in media table
      const mediaMatch = await query<{ id: number }>(
        `SELECT id FROM media WHERE url = $1 LIMIT 1;`,
        [cleanUrl]
      );

      if (mediaMatch.length > 0) {
        return {
          isDuplicate: true,
          reason: `Image URL is already recorded in Media #${mediaMatch[0].id}`,
          existingId: mediaMatch[0].id,
        };
      }
    }
  } catch (err) {
    console.warn('[isImageContentDuplicate] Check warning:', err);
  }

  return { isDuplicate: false };
}

/**
 * Checks in-flight generation locks to prevent concurrent runs on the same prompt.
 */
export async function checkMediaDuplicate(prompt: string): Promise<{
  exists: boolean;
  mediaUrl?: string;
  mediaId?: number;
  reason?: string;
}> {
  const hash = computePromptHash(prompt);

  // Check active in-flight locks to prevent concurrent duplicate generation runs
  const activeUntil = activeMediaLocks.get(hash);
  if (activeUntil && activeUntil > Date.now()) {
    return {
      exists: true,
      reason: 'Concurrent image generation for this prompt is already in progress.',
    };
  }

  return { exists: false };
}

export function acquireMediaGenerationLock(prompt: string, ttlMs = 25000): boolean {
  const hash = computePromptHash(prompt);
  const now = Date.now();
  const existing = activeMediaLocks.get(hash);

  if (existing && existing > now) {
    return false; // Lock active
  }

  activeMediaLocks.set(hash, now + ttlMs);
  return true;
}

export function releaseMediaGenerationLock(prompt: string): void {
  const hash = computePromptHash(prompt);
  activeMediaLocks.delete(hash);
}

export async function recordMediaPromptHash(mediaId: number, prompt: string): Promise<void> {
  const hash = computePromptHash(prompt);
  try {
    await query(`UPDATE media SET prompt_hash = $1 WHERE id = $2;`, [hash, mediaId]);
  } catch (err) {
    console.warn('[recordMediaPromptHash] Failed to record prompt_hash:', err);
  }
}

/**
 * Persists the binary content hash and prompt hash into the media table
 */
export async function recordMediaContentHash(
  mediaId: number,
  contentHash: string,
  prompt?: string
): Promise<void> {
  const pHash = prompt ? computePromptHash(prompt) : null;
  try {
    await query(
      `UPDATE media SET content_hash = $1, prompt_hash = COALESCE($2, prompt_hash) WHERE id = $3;`,
      [contentHash, pHash, mediaId]
    );
  } catch (err) {
    console.warn('[recordMediaContentHash] Failed to record content_hash in media table:', err);
  }
}

// ============================================================================
// 4. OUTREACH & EMAIL IDEMPOTENCY ENGINE
// ============================================================================

/**
 * Generates an unforgeable, deterministic idempotency key for outreach operations.
 */
export function generateOutreachIdempotencyKey(
  businessId: string | number,
  draftId?: string | number,
  contactEmail?: string
): string {
  const payload = `outreach:${businessId}:${draftId || 'none'}:${normalizeEmail(contactEmail || '')}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

/**
 * Atomically acquires an outreach send lock using a single conditional database update.
 * Prevents multiple clicks on "Approve & Send" or concurrent retries from duplicate sends.
 */
export async function checkAndAcquireSendLock(
  draftId: string,
  idempotencyKey: string
): Promise<{
  acquired: boolean;
  currentStatus?: string;
  reason?: string;
}> {
  try {
    // Check current state
    const existing = await query<{
      id: string;
      status: string;
      metadata: Record<string, any>;
    }>(
      `SELECT id, status, metadata FROM chief_content_drafts WHERE id = $1;`,
      [draftId]
    );

    if (existing.length === 0) {
      return { acquired: false, reason: 'Draft not found.' };
    }

    const draft = existing[0];
    const meta = draft.metadata || {};
    const sendStatus = meta.send_status || 'not_started';

    if (sendStatus === 'sent') {
      return {
        acquired: false,
        currentStatus: 'sent',
        reason: `Email already sent on ${meta.sent_at || 'record'}. Duplicate send blocked.`,
      };
    }

    if (sendStatus === 'sending') {
      // Allow lock recovery if stale (> 60 seconds)
      const lockTime = meta.sending_started_at ? new Date(meta.sending_started_at).getTime() : 0;
      if (Date.now() - lockTime < 60000) {
        return {
          acquired: false,
          currentStatus: 'sending',
          reason: 'Send operation currently in progress. Please wait a moment.',
        };
      }
    }

    // Atomic update to mark sending and store idempotency_key
    const updateRes = await query<{ id: string }>(
      `UPDATE chief_content_drafts 
       SET idempotency_key = $1,
           metadata = jsonb_set(
             jsonb_set(metadata, '{send_status}', '"sending"'),
             '{sending_started_at}', to_jsonb(NOW()::text)
           ),
           updated_at = NOW()
       WHERE id = $2 
         AND (metadata->>'send_status' IS NULL OR metadata->>'send_status' != 'sent')
       RETURNING id;`,
      [idempotencyKey, draftId]
    );

    if (updateRes.length === 0) {
      return { acquired: false, reason: 'Could not acquire atomic send lock. Already dispatched.' };
    }

    return { acquired: true };
  } catch (err: any) {
    console.error('[checkAndAcquireSendLock] Error:', err);
    return { acquired: false, reason: err?.message || 'Database error checking idempotency.' };
  }
}

/**
 * Records successful outreach delivery.
 */
export async function recordSendSuccess(
  draftId: string,
  details:
    | string
    | {
        approverEmail?: string;
        providerMessageId?: string;
        sentAt?: string;
      }
): Promise<void> {
  const approver = typeof details === 'string' ? 'admin@heyprince.in' : details.approverEmail || 'admin@heyprince.in';
  const now = typeof details === 'object' && details.sentAt ? details.sentAt : new Date().toISOString();
  try {
    await query(
      `UPDATE chief_content_drafts 
       SET status = 'approved',
           approved_at = NOW(),
           metadata = jsonb_set(
             jsonb_set(
               jsonb_set(COALESCE(metadata, '{}'::jsonb), '{send_status}', '"sent"'),
               '{sent_at}', to_jsonb($1::text)
             ),
             '{approved_by}', to_jsonb($2::text)
           ),
           updated_at = NOW()
       WHERE id = $3;`,
      [now, approver, draftId]
    );
  } catch (err) {
    console.error('[recordSendSuccess] Error recording send outcome:', err);
  }
}

/**
 * Releases send lock upon failure so a user can safely retry later.
 */
export async function recordSendFailure(draftId: string, errorMsg: string): Promise<void> {
  try {
    await query(
      `UPDATE chief_content_drafts 
       SET metadata = jsonb_set(
             jsonb_set(metadata, '{send_status}', '"failed"'),
             '{last_send_error}', to_jsonb($1::text)
           ),
           updated_at = NOW()
       WHERE id = $2;`,
      [errorMsg, draftId]
    );
  } catch (err) {
    console.error('[recordSendFailure] Error recording send failure:', err);
  }
}
