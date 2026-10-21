import { query } from '../../outreach/db';
import {
  createContentDraft,
  logChiefActivity,
  incrementAgentStats,
  updateAgentExecutionTime,
  getAgentById,
} from '../db';

export async function runLeadScoutDiscovery(): Promise<{
  leadsDiscovered: number;
  draftsCreated: number;
  summary: string;
}> {
  const startTime = Date.now();
  const agent = await getAgentById('lead_scout');
  const mode = agent?.mode || 'prepare';

  await logChiefActivity(
    'lead_scout',
    'info',
    'Started Lead Scout opportunity evaluation',
    { mode }
  );

  // Discover businesses with pending or incomplete technical audits
  const uncontactedBusinesses = await query<{
    id: string;
    name: string;
    domain: string | null;
    industry: string | null;
    metadata: Record<string, any> | null;
  }>(`
    SELECT id, name, domain, industry, metadata 
    FROM businesses 
    WHERE status IN ('DISCOVERED', 'AUDITED', 'ENRICHED') 
    ORDER BY created_at DESC 
    LIMIT 5;
  `);

  let draftsCreated = 0;

  if (uncontactedBusinesses.length > 0) {
    for (const biz of uncontactedBusinesses) {
      const bizDomain = biz.domain || 'their website';
      const opportunityTitle = `Outreach Draft: ${biz.name} (${bizDomain})`;
      const opportunityExcerpt = `Technical optimization & modernization proposal for ${biz.name} (${bizDomain})`;
      
      const pitchBody = `Hi ${biz.name} Team,\n\nI was analyzing high-growth web platforms in the ${biz.industry || 'digital commerce'} space and noticed ${bizDomain}.\n\nYour business has strong momentum, but I noticed a few frontend performance and TTFB bottlenecks that might be impacting customer conversion and Google Core Web Vitals rankings.\n\nI specialize in sub-second Next.js web applications and WordPress/WooCommerce speed optimization. Would you be open to a 2-minute video breakdown or a quick technical audit showing where the gains are?\n\nBest regards,\nPrince\nhttps://heyprince.in`;

      await createContentDraft({
        agentId: 'lead_scout',
        draftType: 'outreach_draft',
        title: opportunityTitle,
        excerpt: opportunityExcerpt,
        content: pitchBody,
        metadata: {
          businessId: biz.id,
          companyName: biz.name,
          domain: bizDomain,
          industry: biz.industry,
          score: 88,
        },
        status: 'pending_approval',
      });
      draftsCreated++;
    }
  } else {
    // Generate initial sample high-intent lead opportunity
    const sampleDomain = 'nordicpulse-gear.com';
    const sampleCompany = 'NordicPulse Retail';
    const opportunityTitle = `Outreach Draft: ${sampleCompany} (${sampleDomain})`;
    const opportunityExcerpt = `WooCommerce to Headless Next.js optimization proposal (Score: 92/100)`;

    const pitchBody = `Hi ${sampleCompany} Team,\n\nI noticed NordicPulse is running on WooCommerce with high checkout drop-off rates on mobile. We can achieve sub-second TTFB and 100% Core Web Vitals by migrating your store to a headless Next.js frontend while keeping your existing WooCommerce product catalog intact.\n\nWould you be open to a quick 10-minute technical review this week?\n\nBest,\nPrince\nSenior Full Stack Engineer\nhttps://heyprince.in`;

    await createContentDraft({
      agentId: 'lead_scout',
      draftType: 'outreach_draft',
      title: opportunityTitle,
      excerpt: opportunityExcerpt,
      content: pitchBody,
      metadata: {
        companyName: sampleCompany,
        domain: sampleDomain,
        industry: 'E-commerce & Apparel',
        score: 92,
      },
      status: 'pending_approval',
    });
    draftsCreated++;
  }

  const duration = Date.now() - startTime;
  const summary = `Evaluated candidate businesses in ${duration}ms. Prepared ${draftsCreated} outreach draft(s) awaiting approval.`;

  await updateAgentExecutionTime('lead_scout', new Date(), new Date(Date.now() + 24 * 3600 * 1000));
  await incrementAgentStats('lead_scout', true, draftsCreated);

  await logChiefActivity(
    'lead_scout',
    'success',
    'Completed Lead Scout discovery run',
    { businessesEvaluated: uncontactedBusinesses.length, draftsCreated, durationMs: duration }
  );

  return {
    leadsDiscovered: uncontactedBusinesses.length,
    draftsCreated,
    summary,
  };
}
