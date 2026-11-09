import { query } from '../outreach/db';
import { CompanyEmployee } from './types';

export interface ToolExecutionResult {
  toolName: string;
  executedBy: string;
  timestamp: string;
  isLive: boolean;
  data: Record<string, any>;
  summary: string;
}

/**
 * 1. Website Guardian Tool: Real HTTP probe of heyprince.in routes
 */
export async function auditLiveWebsiteLatency(
  executorId: string = 'david_chen',
  targetRoutes: string[] = ['/', '/about/', '/services/', '/insights/', '/contact/']
): Promise<ToolExecutionResult> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://heyprince.in').replace(/\/$/, '');
  const results: Array<{ route: string; status: number; ok: boolean; responseTimeMs: number }> = [];

  for (const route of targetRoutes) {
    const fullUrl = `${baseUrl}${route}`;
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'HeyPrince-Company-SRE/1.0 (+https://heyprince.in)',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - start;
      results.push({
        route,
        status: res.status,
        ok: res.ok,
        responseTimeMs: elapsed,
      });
    } catch {
      results.push({
        route,
        status: 0,
        ok: false,
        responseTimeMs: Date.now() - start,
      });
    }
  }

  const successful = results.filter((r) => r.ok);
  const avgLatency = successful.length > 0
    ? Math.round(successful.reduce((acc, r) => acc + r.responseTimeMs, 0) / successful.length)
    : 0;
  const slowRoutes = results.filter((r) => r.responseTimeMs > 1500 || !r.ok);

  return {
    toolName: 'website_latency_probe',
    executedBy: executorId,
    timestamp: new Date().toISOString(),
    isLive: true,
    data: {
      baseUrl,
      routesAudited: results.length,
      averageLatencyMs: avgLatency,
      allRoutes: results,
      slowOrFailingCount: slowRoutes.length,
      fastestRoute: results.reduce((prev, curr) => (curr.responseTimeMs < prev.responseTimeMs ? curr : prev), results[0]),
    },
    summary: `Live HTTP audit across ${results.length} routes: Average latency ${avgLatency}ms. ${slowRoutes.length === 0 ? 'All routes healthy within baseline.' : `${slowRoutes.length} route(s) flagged.`}`,
  };
}

/**
 * 2. Elena Rostova Tool: Real Database SEO Audit of Live Posts & Meta Tags
 */
export async function auditLiveDatabaseSeo(
  executorId: string = 'elena_rostova'
): Promise<ToolExecutionResult> {
  const posts = await query<{
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    seo_title: string | null;
    seo_description: string | null;
    published_at: string | null;
  }>(`
    SELECT id, title, slug, excerpt, seo_title, seo_description, published_at
    FROM posts
    WHERE status = 'published'
    ORDER BY published_at DESC
    LIMIT 25;
  `);

  let missingMetaDesc = 0;
  let shortTitles = 0;
  let longTitles = 0;
  const issues: Array<{ slug: string; issue: string }> = [];

  for (const p of posts) {
    const title = p.seo_title || p.title || '';
    const desc = p.seo_description || p.excerpt || '';

    if (title.length < 35) {
      shortTitles++;
      issues.push({ slug: p.slug, issue: `Short title (${title.length} chars)` });
    } else if (title.length > 65) {
      longTitles++;
      issues.push({ slug: p.slug, issue: `Long title (${title.length} chars)` });
    }

    if (!desc || desc.trim().length === 0) {
      missingMetaDesc++;
      issues.push({ slug: p.slug, issue: 'Missing meta description' });
    }
  }

  return {
    toolName: 'database_seo_audit',
    executedBy: executorId,
    timestamp: new Date().toISOString(),
    isLive: true,
    data: {
      totalPublishedAudited: posts.length,
      missingMetaDescriptionCount: missingMetaDesc,
      shortTitlesCount: shortTitles,
      longTitlesCount: longTitles,
      topSampleIssues: issues.slice(0, 5),
    },
    summary: `Live SEO audit of ${posts.length} published articles: ${missingMetaDesc} missing meta descriptions, ${shortTitles} short titles (<35 chars), ${longTitles} titles exceeding SERP width (>65 chars).`,
  };
}

/**
 * 3. Liam Thorne Tool: Real Business Lead Intelligence & Discovery
 */
export async function auditLiveLeadIntelligence(
  executorId: string = 'liam_thorne'
): Promise<ToolExecutionResult> {
  const [totalBiz, statusBreakdown, topIndustries] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) as count FROM businesses;`),
    query<{ status: string; count: string }>(`
      SELECT status, COUNT(*) as count
      FROM businesses
      GROUP BY status
      ORDER BY count DESC;
    `),
    query<{ industry: string; count: string }>(`
      SELECT COALESCE(industry, category, 'General') as industry, COUNT(*) as count
      FROM businesses
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 5;
    `),
  ]);

  const total = Number(totalBiz[0]?.count || 0);

  return {
    toolName: 'lead_intelligence_audit',
    executedBy: executorId,
    timestamp: new Date().toISOString(),
    isLive: true,
    data: {
      totalBusinessesDiscovered: total,
      pipelineBreakdown: statusBreakdown.reduce((acc, row) => ({ ...acc, [row.status]: Number(row.count) }), {}),
      topTargetIndustries: topIndustries.map((r) => ({ industry: r.industry, count: Number(r.count) })),
    },
    summary: `Live lead database analysis: ${total} tracked businesses across pipeline. Top sectors: ${topIndustries.map((i) => `${i.industry} (${i.count})`).join(', ') || 'Technology, Agencies'}.`,
  };
}

/**
 * 4. Marcus Sterling & Alex Vance Tool: Content Catalog & Services Matrix
 */
export async function getLiveCompanyOverviewMetrics(
  executorId: string = 'alex_vance'
): Promise<ToolExecutionResult> {
  const [postsCount, servicesList, tasksCount, proposalsCount] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) as count FROM posts WHERE status = 'published';`),
    query<{ title: string; slug: string }>(`SELECT title, slug FROM services ORDER BY id ASC;`),
    query<{ status: string; count: string }>(`
      SELECT status, COUNT(*) as count
      FROM company_tasks
      GROUP BY status;
    `),
    query<{ status: string; count: string }>(`
      SELECT status, COUNT(*) as count
      FROM company_proposals
      GROUP BY status;
    `),
  ]);

  return {
    toolName: 'company_portfolio_metrics',
    executedBy: executorId,
    timestamp: new Date().toISOString(),
    isLive: true,
    data: {
      publishedInsightsCount: Number(postsCount[0]?.count || 0),
      activeServicesCount: servicesList.length,
      services: servicesList.map((s) => s.title),
      tasksBreakdown: tasksCount.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {}),
      proposalsBreakdown: proposalsCount.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {}),
    },
    summary: `HeyPrince.in operations overview: ${postsCount[0]?.count || 0} published engineering articles, ${servicesList.length} active service offerings, and real-time task pipeline.`,
  };
}

/**
 * Execute tool dynamically based on department or context
 */
export async function executeRelevantAgentTool(
  employee: CompanyEmployee,
  topicOrObjective: string
): Promise<ToolExecutionResult | null> {
  const queryLower = (topicOrObjective || '').toLowerCase();

  try {
    if (employee.department === 'Infrastructure' || queryLower.includes('latency') || queryLower.includes('speed') || queryLower.includes('cwv') || queryLower.includes('uptime')) {
      return await auditLiveWebsiteLatency(employee.id);
    }

    if (employee.department === 'Growth' || queryLower.includes('seo') || queryLower.includes('keyword') || queryLower.includes('traffic') || queryLower.includes('meta')) {
      return await auditLiveDatabaseSeo(employee.id);
    }

    if (employee.department === 'Sales' || queryLower.includes('lead') || queryLower.includes('client') || queryLower.includes('revenue') || queryLower.includes('outreach')) {
      return await auditLiveLeadIntelligence(employee.id);
    }

    if (employee.department === 'Executive' || employee.department === 'Editorial' || queryLower.includes('growth') || queryLower.includes('service') || queryLower.includes('company')) {
      return await getLiveCompanyOverviewMetrics(employee.id);
    }
  } catch (err) {
    console.warn(`[ToolExecution] Failed to execute tool for ${employee.id}:`, err);
  }

  return null;
}
