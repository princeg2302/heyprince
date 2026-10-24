import { query, getContactsForBusiness } from '../../outreach/db';
import {
  createContentDraft,
  logChiefActivity,
  incrementAgentStats,
  updateAgentExecutionTime,
  getAgentById,
} from '../db';
import {
  normalizeDomain,
  generateOutreachIdempotencyKey,
  checkLeadDuplicate,
} from '../../deduplication';

export interface LeadScoutResult {
  leadsDiscovered: number;
  draftsCreated: number;
  summary: string;
}

export async function runLeadScoutDiscovery(): Promise<LeadScoutResult> {
  const startTime = Date.now();
  const agent = await getAgentById('lead_scout');
  const mode = agent?.mode || 'prepare';

  await logChiefActivity(
    'lead_scout',
    'info',
    'Started Lead Intelligence prospect evaluation and proposal generation',
    { mode }
  );

  // 1. Discover businesses that haven't had an outreach proposal created yet
  const uncontactedBusinesses = await query<{
    id: string;
    name: string;
    domain: string | null;
    normalized_domain: string | null;
    industry: string | null;
    website_url: string | null;
    metadata: Record<string, any> | null;
  }>(`
    SELECT b.id, b.name, b.domain, b.normalized_domain, b.industry, b.website_url, b.metadata 
    FROM businesses b
    WHERE b.status IN ('DISCOVERED', 'AUDITED', 'ENRICHED')
      AND NOT EXISTS (
        SELECT 1 FROM chief_content_drafts d 
        WHERE d.metadata->>'businessId' = b.id::text
           OR (b.normalized_domain IS NOT NULL AND d.metadata->>'domain' = b.normalized_domain)
           OR (b.domain IS NOT NULL AND d.metadata->>'domain' = b.domain)
      )
    ORDER BY b.created_at DESC 
    LIMIT 10;
  `);

  let draftsCreated = 0;

  for (const biz of uncontactedBusinesses) {
    const rawDomain = biz.domain || biz.website_url || 'their-website.com';
    const canonical = normalizeDomain(rawDomain);
    const meta = biz.metadata || {};

    // 2. Fetch primary contact if available
    let primaryContactEmail: string | undefined;
    let primaryContactName: string | undefined;

    try {
      const contacts = await getContactsForBusiness(biz.id);
      if (contacts && contacts.length > 0) {
        primaryContactEmail = contacts[0].email;
        primaryContactName = contacts[0].name || undefined;
      }
    } catch (contactErr) {
      console.warn(`[LeadScout] Note fetching contacts for biz #${biz.id}:`, contactErr);
    }

    // 3. Assess technical opportunity fit & evidence
    let calculatedScore = 72; // baseline fit
    const evidenceList: string[] = [];
    let likelyNeeds = 'Frontend modernization and performance optimization';
    let recommendedService = 'Next.js Frontend Architecture & Performance Tuning';

    const ttfb = meta.ttfb ? Number(meta.ttfb) : null;
    if (ttfb && ttfb > 700) {
      calculatedScore += 12;
      evidenceList.push(`High Server TTFB latency (${ttfb}ms) causing page lag and cart abandonment`);
      likelyNeeds = 'Edge caching and server-side response optimization';
      recommendedService = 'Sub-Second Next.js Speed Optimization';
    }

    const tech = meta.techStack ? String(meta.techStack).toLowerCase() : '';
    if (tech.includes('wordpress') || tech.includes('woocommerce') || tech.includes('wp')) {
      calculatedScore += 10;
      evidenceList.push('Monolithic WordPress/WooCommerce stack detected with database-heavy plugin overhead');
      likelyNeeds = 'Migration to headless architecture while preserving product catalog';
      recommendedService = 'WooCommerce to Headless Next.js Migration';
    } else if (tech.includes('shopify') || tech.includes('liquid')) {
      calculatedScore += 8;
      evidenceList.push('Shopify Liquid theme with heavy third-party app scripts impacting Core Web Vitals');
      likelyNeeds = 'Headless Shopify Hydrogen / Next.js storefront';
      recommendedService = 'Headless Shopify Next.js Storefront';
    }

    if (meta.hasMobileIssues || meta.mobileFriendly === false) {
      calculatedScore += 8;
      evidenceList.push('Mobile viewport layout shifts causing Google Core Web Vitals penalties');
    }

    if (evidenceList.length === 0) {
      evidenceList.push('Legacy web architecture with modernization opportunities for speed and SEO rankings');
    }

    calculatedScore = Math.min(Math.max(calculatedScore, 65), 98);
    const confidenceLevel = Math.round(calculatedScore * 0.95);

    // 4. Generate high-conviction personalized outreach proposal
    const targetRecipient = primaryContactName || biz.name;
    const personalizedSubject = `Quick technical optimization idea for ${biz.name} (${canonical || 'your website'})`;
    
    let personalizedBody = `Hi ${targetRecipient} Team,\n\nI was analyzing high-growth web platforms in the ${biz.industry || 'digital business'} space and spent some time on ${canonical || 'your website'}.\n\nYour business has strong momentum, but I noticed a couple of technical bottlenecks that might be impacting customer conversion and Google Core Web Vitals rankings:\n`;
    for (const ev of evidenceList) {
      personalizedBody += `• ${ev}\n`;
    }
    personalizedBody += `\nI specialize in sub-second Next.js web applications, full-stack cloud engineering, and WordPress/WooCommerce speed optimization.\n\nWould you be open to a 2-minute video breakdown showing exactly where the performance gains are?\n\nBest regards,\nPrince\nSenior Full Stack Engineer & IT Consultant\nhttps://heyprince.in`;

    // 5. Generate deterministic idempotency key to prevent duplicate sends
    const idempotencyKey = generateOutreachIdempotencyKey(
      biz.id,
      `outreach_${biz.id}`,
      primaryContactEmail
    );

    const opportunityTitle = `Outreach Proposal: ${biz.name} (${canonical || 'Website'})`;
    const opportunityExcerpt = `${recommendedService} (Score: ${calculatedScore}/100 • Confidence: ${confidenceLevel}%)`;

    // 6. Submit complete review item to chief_content_drafts
    await createContentDraft({
      agentId: 'lead_scout',
      draftType: 'outreach_proposal',
      title: opportunityTitle,
      excerpt: opportunityExcerpt,
      content: personalizedBody,
      idempotency_key: idempotencyKey,
      target_url: biz.website_url || `https://${canonical}`,
      metadata: {
        businessId: biz.id,
        companyName: biz.name,
        domain: canonical,
        websiteUrl: biz.website_url || `https://${canonical}`,
        contactEmail: primaryContactEmail,
        contactName: primaryContactName,
        leadScore: calculatedScore,
        confidenceLevel,
        evidence: evidenceList,
        likelyNeeds,
        recommendedService,
        proposedNextAction: 'Send 1-on-1 Strategy Video Pitch via Email',
        personalizedEmailSubject: personalizedSubject,
        personalizedEmailBody: personalizedBody,
        send_status: 'pending',
      },
      status: 'pending_approval',
    });

    draftsCreated++;
  }

  const duration = Date.now() - startTime;
  const summary = `Evaluated candidate businesses in ${duration}ms. Prepared ${draftsCreated} outreach proposal(s) awaiting AI approval.`;

  await updateAgentExecutionTime('lead_scout', new Date(), new Date(Date.now() + 24 * 3600 * 1000));
  await incrementAgentStats('lead_scout', true, draftsCreated);

  await logChiefActivity(
    'lead_scout',
    'success',
    'Completed Lead Intelligence evaluation run',
    { businessesEvaluated: uncontactedBusinesses.length, draftsCreated, durationMs: duration }
  );

  return {
    leadsDiscovered: uncontactedBusinesses.length,
    draftsCreated,
    summary,
  };
}
