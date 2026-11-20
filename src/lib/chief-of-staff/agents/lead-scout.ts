import { query } from '../../outreach/db';
import { discoveryService } from '../../outreach/discovery/service';
import {
  logChiefActivity,
  incrementAgentStats,
  updateAgentExecutionTime,
  getAgentById,
} from '../db';
import {
  evaluateLeadContactChannels,
  ScoutTarget,
  LEAD_SCOUT_TARGET_ROTATION,
  GLOBAL_HUBS,
  CORE_CATEGORIES,
} from '../../outreach/qualification';
import { generateLeadProposal } from '../../outreach/proposal-generator';
import { getRelevantCompanyMemories, recordCompanyMemory } from '../../company/memory';
import { recordAgentLearning, createIndustryCategory, getIndustryCategories } from '../../company/db';

export { LEAD_SCOUT_TARGET_ROTATION, evaluateLeadContactChannels };
export type { ScoutTarget };

export async function resolveDynamicScoutTarget(): Promise<ScoutTarget> {
  try {
    const categories = await query<{
      name: string;
      slug: string;
      last_scanned_at: string | null;
    }>(
      `SELECT name, slug, last_scanned_at 
       FROM industry_categories 
       WHERE status = 'active' 
       ORDER BY last_scanned_at ASC NULLS FIRST, created_at ASC 
       LIMIT 1;`
    );

    const chosenCategory = categories.length > 0
      ? categories[0]
      : CORE_CATEGORIES[Math.floor(Math.random() * CORE_CATEGORIES.length)];

    const now = new Date();
    const daySeed = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const randomOffset = Math.floor(Math.random() * GLOBAL_HUBS.length);
    const chosenHub = GLOBAL_HUBS[(daySeed + randomOffset) % GLOBAL_HUBS.length];

    return {
      country: chosenHub.country,
      city: chosenHub.city,
      category: chosenCategory.name,
      categorySlug: chosenCategory.slug,
    };
  } catch (err) {
    console.warn('[resolveDynamicScoutTarget] Falling back to static target:', err);
    const chosenHub = GLOBAL_HUBS[Math.floor(Math.random() * GLOBAL_HUBS.length)];
    const chosenCat = CORE_CATEGORIES[Math.floor(Math.random() * CORE_CATEGORIES.length)];
    return {
      country: chosenHub.country,
      city: chosenHub.city,
      category: chosenCat.name,
      categorySlug: chosenCat.slug,
    };
  }
}

export interface LeadScoutResult {
  scanTarget: ScoutTarget;
  leadsDiscovered: number;
  duplicatesSkipped: number;
  qualifiedLeads: number;
  draftsCreated: number;
  newCategoriesProposed: number;
  summary: string;
}

export async function runLeadScoutDiscovery(options?: {
  target?: ScoutTarget;
  limit?: number;
  forceRun?: boolean;
}): Promise<LeadScoutResult> {
  const startTime = Date.now();

  // 1. Retrieve Historical Memory & Lessons to avoid repetitive mistakes
  const memories = await getRelevantCompanyMemories({
    department: 'Sales',
    employeeId: 'liam_thorne',
    limit: 5,
  });

  // 2. Resolve Dynamic Target across industries and global/Indian hubs
  const target = options?.target || (await resolveDynamicScoutTarget());

  // 3. Dynamic Category Discovery & Market Segment Expansion
  let newCategoriesProposed = 0;
  try {
    const existingCategories = await getIndustryCategories('active');
    const existingSlugs = new Set(existingCategories.map((c) => c.slug));

    // Potential emerging high-demand sectors
    const candidateExpansions = [
      {
        id: 'fintech_wealthtech',
        name: 'FinTech & WealthTech Platforms',
        slug: 'fintech-wealthtech-platforms',
        relevance: 'High security and compliance needs, sub-second latency requirements for client dashboards.',
        services: ['Next.js Financial Portals', 'SOC2/GDPR Security Hardening', 'Database Optimization'],
        demand: 'high',
      },
      {
        id: 'logistics_supplychain',
        name: 'Logistics, Freight & Supply Chain Tech',
        slug: 'logistics-supply-chain-tech',
        relevance: 'Legacy enterprise desktop software struggling with mobile driver interfaces and real-time tracking.',
        services: ['Real-Time Next.js Dashboards', 'Edge API Caching', 'Cloud Modernization'],
        demand: 'high',
      },
      {
        id: 'renewable_cleantech',
        name: 'Renewable Energy & Solar Installers',
        slug: 'renewable-clean-energy-tech',
        relevance: 'High customer acquisition spend; requires instant solar savings calculator funnels and booking flows.',
        services: ['Interactive Calculator Web Apps', 'High-Converting Landing Pages', 'WhatsApp Automation'],
        demand: 'medium',
      },
      {
        id: 'ai_b2b_startups',
        name: 'AI Startups & Applied Agent Builders',
        slug: 'ai-startups-agent-builders',
        relevance: 'Rapidly growing seed/Series-A startups needing reliable full-stack frontend engineering and vector architectures.',
        services: ['AI Agent Frontends', 'Vercel Edge Integration', 'Custom Vector RAG Pipelines'],
        demand: 'urgent',
      },
    ];

    for (const exp of candidateExpansions) {
      if (!existingSlugs.has(exp.slug)) {
        await createIndustryCategory({
          id: exp.id,
          name: exp.name,
          slug: exp.slug,
          commercial_relevance: exp.relevance,
          heyprince_services: exp.services,
          estimated_demand: exp.demand,
          status: 'active',
          discovered_by: 'liam_thorne',
          evidence: {
            reason: 'Autonomous market analysis by Liam Thorne (Sales & Growth Scout)',
            discoveredAt: new Date().toISOString(),
          },
        });
        newCategoriesProposed++;
        break; // Add at most 1 per cycle to keep expansion measured and high-signal
      }
    }
  } catch (catErr) {
    console.warn('[LeadScout] Dynamic category expansion notice:', catErr);
  }

  // 4. Discover Real Businesses via discoveryService
  const discoveryResult = await discoveryService.executeJob({
    provider: 'openstreetmap',
    countryCode: target.country,
    city: target.city,
    category: target.category,
    limit: options?.limit || 12,
    triggerSource: 'automated',
  });

  const newDiscoveredCount = discoveryResult.totalInserted;
  const duplicatesSkipped = discoveryResult.totalDuplicates;

  // 5. Find candidate businesses for research & proposal preparation (scored >= 0.50)
  const candidateBusinesses = await query<{
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
    LIMIT 6;
  `);

  let draftsCreated = 0;
  let qualifiedLeads = 0;

  for (const biz of candidateBusinesses) {
    const meta = biz.metadata || {};
    if (meta.lifecycle_status === 'Qualified' || meta.is_qualified) {
      qualifiedLeads++;
    }

    const proposalRes = await generateLeadProposal(biz.id);
    if (proposalRes.success) {
      draftsCreated++;
    }
  }

  const duration = Date.now() - startTime;
  const summary = `Lead Scout cycle completed for ${target.city}, ${target.country} (${target.category}): Discovered ${newDiscoveredCount} unique prospect(s), rejected ${duplicatesSkipped} duplicate(s), identified ${qualifiedLeads} qualified lead(s), and created ${draftsCreated} tailored proposal(s).`;

  // 6. Record Persistent Agent Learning and Company Memory
  try {
    await recordAgentLearning({
      agent_id: 'liam_thorne',
      learning_type: 'market_observation',
      topic_or_entity: `${target.city} - ${target.category}`,
      lesson: `Discovery yield in ${target.city} (${target.category}): ${newDiscoveredCount} unique, ${duplicatesSkipped} duplicates.`,
      actionable_directive:
        duplicatesSkipped > 5
          ? `Rotate away from ${target.category} in ${target.city} to adjacent hub to maximize unique discoveries.`
          : `Category ${target.category} shows high discovery viability. Continue quarterly cadence.`,
      source_reference: `discovery_job_${discoveryResult.job.id}`,
    });

    await recordCompanyMemory({
      scope: 'department',
      department: 'Sales',
      employeeId: 'liam_thorne',
      category: 'market_intelligence',
      insight: `Scanned ${target.city} (${target.category}): ${newDiscoveredCount} new unique leads, ${draftsCreated} proposals prepared.`,
      confidenceScore: 0.95,
    });
  } catch (memErr) {
    console.warn('[LeadScout] Memory recording notice:', memErr);
  }

  await updateAgentExecutionTime('lead_scout', new Date(), new Date(Date.now() + 24 * 3600 * 1000));
  await incrementAgentStats('lead_scout', true, draftsCreated);

  await logChiefActivity(
    'lead_scout',
    'success',
    'Completed automated Lead Scout run',
    {
      targetCity: target.city,
      targetCountry: target.country,
      targetCategory: target.category,
      newDiscoveredCount,
      duplicatesSkipped,
      qualifiedLeads,
      draftsCreated,
      newCategoriesProposed,
      durationMs: duration,
    }
  );

  return {
    scanTarget: target,
    leadsDiscovered: newDiscoveredCount,
    duplicatesSkipped,
    qualifiedLeads,
    draftsCreated,
    newCategoriesProposed,
    summary,
  };
}

export async function shouldLeadScoutRunToday(): Promise<boolean> {
  const agent = await getAgentById('lead_scout');
  if (!agent || agent.status !== 'enabled') return false;
  if (!agent.last_run_at) return true;

  const lastRun = new Date(agent.last_run_at);
  const now = new Date();
  const diffHours = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

  return diffHours >= 20;
}
