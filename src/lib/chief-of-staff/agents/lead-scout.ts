import { query, getContactsForBusiness } from '../../outreach/db';
import { discoveryService } from '../../outreach/discovery/service';
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
} from '../../deduplication';
import {
  LEAD_SCOUT_TARGET_ROTATION,
  evaluateLeadContactChannels,
  ScoutTarget,
} from '../../outreach/qualification';

export { LEAD_SCOUT_TARGET_ROTATION, evaluateLeadContactChannels };
export type { ScoutTarget };

export interface LeadScoutResult {
  scanTarget: ScoutTarget;
  leadsDiscovered: number;
  draftsCreated: number;
  summary: string;
}

export async function runLeadScoutDiscovery(options?: {
  targetOverride?: ScoutTarget;
  skipDiscoveryScan?: boolean;
}): Promise<LeadScoutResult> {
  const startTime = Date.now();
  const agent = await getAgentById('lead_scout');
  const mode = agent?.mode || 'prepare';

  // 1. Pick target from rotation
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const target = options?.targetOverride || LEAD_SCOUT_TARGET_ROTATION[dayOfYear % LEAD_SCOUT_TARGET_ROTATION.length];

  await logChiefActivity(
    'lead_scout',
    'info',
    `Started automated Lead Scout discovery in ${target.city}, ${target.country} (${target.category})`,
    { target, mode }
  );

  let newDiscoveredCount = 0;

  // 2. Execute automated web discovery using legitimate public OpenStreetMap data
  if (!options?.skipDiscoveryScan) {
    try {
      const discoveryResult = await discoveryService.executeJob({
        provider: 'openstreetmap',
        countryCode: target.country,
        city: target.city,
        category: target.category,
        region: target.region,
        limit: 15,
        triggerSource: 'automated',
      });
      newDiscoveredCount = discoveryResult.totalInserted;
    } catch (discoveryErr: any) {
      console.warn('[LeadScout] Automated discovery scan note:', discoveryErr?.message);
    }
  }

  // 3. Find uncontacted candidate businesses for research & proposal preparation
  const uncontactedBusinesses = await query<{
    id: string;
    name: string;
    domain: string | null;
    normalized_domain: string | null;
    industry: string | null;
    category: string | null;
    website_url: string | null;
    metadata: Record<string, any> | null;
  }>(`
    SELECT b.id, b.name, b.domain, b.normalized_domain, b.industry, b.category, b.website_url, b.metadata 
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

    // 4. Fetch primary contacts
    let contactsList: any[] = [];
    try {
      contactsList = await getContactsForBusiness(biz.id);
    } catch (contactErr) {
      console.warn(`[LeadScout] Note fetching contacts for biz #${biz.id}:`, contactErr);
    }

    const channelEval = evaluateLeadContactChannels({
      website_url: biz.website_url,
      domain: canonical,
      metadata: meta,
      contacts: contactsList,
    });

    // If business has ZERO contact points (no website, no email, no phone), mark and skip outreach
    if (!channelEval.isQualified) {
      await query(
        `UPDATE businesses SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{outreach_status}', '"no_available_channel"'::jsonb) WHERE id = $1;`,
        [biz.id]
      );
      continue;
    }

    const primaryContact = contactsList[0];
    const primaryContactEmail = primaryContact?.email || undefined;
    const primaryContactName = primaryContact?.name || undefined;

    // 5. Assess technical opportunity fit & evidence
    let calculatedScore = 74;
    const evidenceList: string[] = [];
    let likelyNeeds = 'Frontend modernization and performance optimization';
    let recommendedService = 'Next.js Architecture & Speed Optimization';

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
      evidenceList.push('Legacy web architecture with modernization opportunities for speed, SEO, and bookings');
    }

    calculatedScore = Math.min(Math.max(calculatedScore, 65), 98);
    const confidenceLevel = Math.round(calculatedScore * 0.95);

    // 6. Generate Channel-Specific Messaging
    const targetRecipient = primaryContactName || biz.name;
    const emailSubject = `Quick technical optimization idea for ${biz.name} (${canonical || 'your website'})`;
    
    let emailBody = `Hi ${targetRecipient} Team,\n\nI was analyzing high-growth web platforms in the ${biz.industry || biz.category || 'digital business'} space and spent some time reviewing ${canonical || 'your website'}.\n\nYour business has strong momentum, but I noticed a couple of technical bottlenecks that might be impacting customer conversion and Google Core Web Vitals rankings:\n`;
    for (const ev of evidenceList) {
      emailBody += `• ${ev}\n`;
    }
    emailBody += `\nI specialize in sub-second Next.js web applications, full-stack cloud engineering, and WordPress/WooCommerce speed optimization.\n\nWould you be open to a 2-minute video breakdown showing exactly where the performance gains are?\n\nBest regards,\nPrince\nSenior Full Stack Engineer & IT Consultant\nhttps://heyprince.in`;

    let whatsappPitch = `Hello ${targetRecipient} Team! 👋 I analyzed ${canonical || 'your website'} and found high-impact speed & booking improvements that could boost your conversions. Would you be open to a quick 2-min breakdown? — Prince (https://heyprince.in)`;

    // 7. Generate deterministic idempotency key to prevent duplicate sends
    const idempotencyKey = generateOutreachIdempotencyKey(
      biz.id,
      `outreach_${biz.id}`,
      primaryContactEmail || channelEval.whatsappUrl || biz.name
    );

    const opportunityTitle = `Outreach Proposal: ${biz.name} (${canonical || 'Website'})`;
    const opportunityExcerpt = `${recommendedService} • Recommended Channel: ${channelEval.bestChannel.toUpperCase()} (Score: ${calculatedScore}/100)`;

    // 8. Submit complete review item to central AI Approvals
    await createContentDraft({
      agentId: 'lead_scout',
      draftType: 'outreach_proposal',
      title: opportunityTitle,
      excerpt: opportunityExcerpt,
      content: channelEval.bestChannel === 'whatsapp' ? whatsappPitch : emailBody,
      idempotency_key: idempotencyKey,
      target_url: biz.website_url || `https://${canonical}`,
      metadata: {
        businessId: biz.id,
        companyName: biz.name,
        domain: canonical,
        websiteUrl: biz.website_url || `https://${canonical}`,
        contactEmail: primaryContactEmail,
        contactName: primaryContactName,
        phone: meta.phone || null,
        whatsappUrl: channelEval.whatsappUrl,
        recommendedChannel: channelEval.bestChannel,
        isQualified: channelEval.isQualified,
        contactChannels: {
          website: channelEval.hasWebsite,
          email: channelEval.hasEmail,
          phone: channelEval.hasPhone,
          whatsapp: channelEval.isWhatsAppEligible,
        },
        leadScore: calculatedScore,
        confidenceLevel,
        evidence: evidenceList,
        likelyNeeds,
        recommendedService,
        proposedNextAction:
          channelEval.bestChannel === 'whatsapp'
            ? 'Send 1-on-1 Strategy Pitch via WhatsApp'
            : 'Send 1-on-1 Strategy Pitch via Email',
        personalizedEmailSubject: emailSubject,
        personalizedEmailBody: emailBody,
        personalizedWhatsAppMessage: whatsappPitch,
        send_status: 'pending',
      },
      status: 'pending_approval',
    });

    draftsCreated++;
  }

  const duration = Date.now() - startTime;
  const summary = `Automated Lead Scout scan completed for ${target.city}, ${target.country} (${target.category}). Discovered ${newDiscoveredCount} new prospect(s) and prepared ${draftsCreated} tailored outreach proposal(s) awaiting AI Approval.`;

  await updateAgentExecutionTime('lead_scout', new Date(), new Date(Date.now() + 24 * 3600 * 1000));
  await incrementAgentStats('lead_scout', true, draftsCreated);

  await logChiefActivity(
    'lead_scout',
    'success',
    'Completed automated Lead Scout run',
    {
      targetCity: target.city,
      targetCountry: target.country,
      newDiscoveredCount,
      draftsCreated,
      durationMs: duration,
    }
  );

  return {
    scanTarget: target,
    leadsDiscovered: newDiscoveredCount,
    draftsCreated,
    summary,
  };
}
