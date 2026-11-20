import { query } from '../../outreach/db';
import {
  recordSeoRecommendation,
  logChiefActivity,
  createContentDraft,
  incrementAgentStats,
  updateAgentExecutionTime,
  getAgentById,
} from '../db';
import { ChiefSeoRecommendation } from '../types';
import { recordAgentLearning, getIndustryCategories } from '../../company/db';
import { recordCompanyMemory } from '../../company/memory';

export async function runSeoGrowthAudit(): Promise<{
  recommendationsCount: number;
  recommendations: Partial<ChiefSeoRecommendation>[];
  summary: string;
}> {
  const startTime = Date.now();
  const agent = await getAgentById('seo_growth');
  const mode = agent?.mode || 'prepare';

  await logChiefActivity(
    'seo_growth',
    'info',
    'Started SEO & Semantic Intelligence audit (Elena Rostova)',
    { mode }
  );

  const recommendations: Partial<ChiefSeoRecommendation>[] = [];

  // 1. Audit Real Live Posts for Metadata, CTR & Snippet Optimization
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
    LIMIT 30;
  `);

  for (const post of posts) {
    const pageUrl = `/insights/${post.slug}/`;
    const title = post.seo_title || post.title || '';
    const desc = post.seo_description || post.excerpt || '';

    // Title length check
    if (title.length < 30) {
      recommendations.push({
        page_url: pageUrl,
        issue: `Under-optimized Title on /insights/${post.slug}`,
        evidence: `Title "${title}" is ${title.length} characters (target: 45-60 chars).`,
        suggested_change: `Expand title to include primary architectural keyword & brand: "${title} | Full-Stack Insights - HeyPrince"`,
        expected_benefit: 'Improves CTR in Google SERPs by matching full search intent.',
        risk_level: 'low',
      });
    } else if (title.length > 65) {
      recommendations.push({
        page_url: pageUrl,
        issue: `Title Truncation on /insights/${post.slug}`,
        evidence: `Title "${title}" is ${title.length} characters, which Google cuts off on mobile and desktop snippets.`,
        suggested_change: `Front-load key technologies and trim title to under 60 chars.`,
        expected_benefit: 'Prevents awkward ellipsis truncation in search cards.',
        risk_level: 'low',
      });
    }

    // Meta description check
    if (!desc || desc.trim().length === 0) {
      recommendations.push({
        page_url: pageUrl,
        issue: `Missing Meta Description on /insights/${post.slug}`,
        evidence: `Post lacks an explicit meta description, forcing search engines to generate an arbitrary snippet.`,
        suggested_change: `Author a high-CTR 140-155 character meta snippet highlighting practical takeaways and architecture patterns.`,
        expected_benefit: 'Directly boosts organic search click-through rate by up to 25%.',
        risk_level: 'low',
      });
    } else if (desc.length < 80) {
      recommendations.push({
        page_url: pageUrl,
        issue: `Short Meta Description on /insights/${post.slug}`,
        evidence: `Meta description is only ${desc.length} chars (target: 130-155 chars).`,
        suggested_change: `Enrich description with secondary search keywords and an explicit call-to-action.`,
        expected_benefit: 'Maximizes snippet visibility and improves CTR.',
        risk_level: 'low',
      });
    }
  }

  // 2. Dynamic Content Gap & Internal Linking Opportunities
  try {
    const activeCategories = await getIndustryCategories('active');
    const existingTitles = posts.map((p) => p.title.toLowerCase());

    for (const cat of activeCategories.slice(0, 4)) {
      const hasCoverage = existingTitles.some((t) => t.includes(cat.name.toLowerCase().split(' ')[0]));
      if (!hasCoverage) {
        recommendations.push({
          page_url: `/services/${cat.slug}/`,
          issue: `Content Gap: No dedicated engineering guide for ${cat.name}`,
          evidence: `Category "${cat.name}" has high commercial relevance (${cat.commercial_relevance}) but lacks a corresponding deep-dive insight.`,
          suggested_change: `Collaborate with Marcus Sterling to research and publish a technical case study targeting ${cat.name}.`,
          expected_benefit: `Captures high-intent organic commercial queries for ${cat.name}.`,
          risk_level: 'low',
        });
      }
    }
  } catch (catErr) {
    console.warn('[SeoGrowth] Dynamic gap analysis notice:', catErr);
  }

  // Record top recommendations to database
  let savedCount = 0;
  for (const rec of recommendations.slice(0, 10)) {
    if (rec.page_url && rec.issue && rec.evidence && rec.suggested_change && rec.expected_benefit) {
      await recordSeoRecommendation({
        pageUrl: rec.page_url,
        issue: rec.issue,
        evidence: rec.evidence,
        suggestedChange: rec.suggested_change,
        expectedBenefit: rec.expected_benefit,
        riskLevel: rec.risk_level || 'low',
      });
      savedCount++;
    }
  }

  // Record Agent Learning & Department Memory
  try {
    await recordAgentLearning({
      agent_id: 'elena_rostova',
      learning_type: 'performance_metric',
      topic_or_entity: 'Organic Search Footprint',
      lesson: `Audited ${posts.length} published articles. Found ${recommendations.length} SEO optimization opportunities.`,
      actionable_directive:
        recommendations.length > 5
          ? 'Prioritize meta description patches for recently published articles with under-length snippets.'
          : 'Published articles adhere closely to SEO length and title standards. Focus on internal linking.',
    });

    await recordCompanyMemory({
      scope: 'department',
      department: 'Growth',
      employeeId: 'elena_rostova',
      category: 'learning',
      insight: `Elena Rostova SEO audit: ${recommendations.length} actionable opportunities across ${posts.length} audited pages.`,
      confidenceScore: 0.95,
    });
  } catch (memErr) {
    console.warn('[SeoGrowth] Memory recording notice:', memErr);
  }

  const duration = Date.now() - startTime;
  const summary = `SEO Audit by Elena Rostova: Analyzed ${posts.length} published pages, generated ${recommendations.length} actionable optimizations (${savedCount} recorded in database).`;

  await updateAgentExecutionTime('seo_growth', new Date());
  await incrementAgentStats('seo_growth', true, recommendations.length);

  await logChiefActivity('seo_growth', 'success', summary, {
    postsAudited: posts.length,
    recommendationsCount: recommendations.length,
    durationMs: duration,
  });

  return {
    recommendationsCount: recommendations.length,
    recommendations,
    summary,
  };
}
