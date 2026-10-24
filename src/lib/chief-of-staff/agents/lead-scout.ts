import { query } from '../../outreach/db';
import { discoveryService } from '../../outreach/discovery/service';
import {
  logChiefActivity,
  incrementAgentStats,
  updateAgentExecutionTime,
  getAgentById,
} from '../db';
import {
  LEAD_SCOUT_TARGET_ROTATION,
  evaluateLeadContactChannels,
  ScoutTarget,
} from '../../outreach/qualification';
import { generateLeadProposal } from '../../outreach/proposal-generator';

export { LEAD_SCOUT_TARGET_ROTATION, evaluateLeadContactChannels };
export type { ScoutTarget };

export interface LeadScoutResult {
  scanTarget: ScoutTarget;
  leadsDiscovered: number;
  draftsCreated: number;
  summary: string;
}

export async function runLeadScoutDiscovery(options?: {
  target?: ScoutTarget;
  limit?: number;
  forceRun?: boolean;
}): Promise<LeadScoutResult> {
  const startTime = Date.now();

  // 1. Resolve Target Rotation
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const target = options?.target || LEAD_SCOUT_TARGET_ROTATION[dayOfYear % LEAD_SCOUT_TARGET_ROTATION.length];

  // 2. Discover Real Businesses via discoveryService
  const discoveryResult = await discoveryService.executeJob({
    provider: 'openstreetmap',
    countryCode: target.country,
    city: target.city,
    category: target.category,
    limit: options?.limit || 10,
    triggerSource: 'automated',
  });

  const newDiscoveredCount = discoveryResult.totalInserted;

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
    const proposalRes = await generateLeadProposal(biz.id);
    if (proposalRes.success) {
      draftsCreated++;
    }
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

export async function shouldLeadScoutRunToday(): Promise<boolean> {
  const agent = await getAgentById('lead_scout');
  if (!agent || agent.status !== 'enabled') return false;
  if (!agent.last_run_at) return true;

  const lastRun = new Date(agent.last_run_at);
  const now = new Date();
  const diffHours = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

  return diffHours >= 20;
}
