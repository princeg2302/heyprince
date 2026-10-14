import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  getDailyNewsSettings,
  getDailyNewsSources,
  getRecentDailyRuns,
} from '@/lib/daily-news/db';
import { isAIConfigured, getAIProviderConfig } from '@/lib/daily-news/ai-provider';
import { getActiveLinkedInConnection } from '@/lib/linkedin/client';
import { query } from '@/lib/outreach/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [settings, sources, recentRuns, linkedInConn] = await Promise.all([
      getDailyNewsSettings(),
      getDailyNewsSources(),
      getRecentDailyRuns(15),
      getActiveLinkedInConnection(),
    ]);

    // Aggregate summary stats
    const statsRows = await query(`
      SELECT 
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
        COUNT(*) FILTER (WHERE website_status = 'published') as published_articles,
        COUNT(*) FILTER (WHERE linkedin_status = 'published') as linkedin_shares,
        COALESCE(SUM(items_discovered), 0) as total_items_discovered
      FROM daily_news_runs;
    `);

    const stats = statsRows[0] || {
      total_runs: 0,
      successful_runs: 0,
      published_articles: 0,
      linkedin_shares: 0,
      total_items_discovered: 0,
    };

    const aiConfig = getAIProviderConfig();

    return NextResponse.json({
      success: true,
      settings,
      sources,
      recentRuns,
      ai: {
        isConfigured: isAIConfigured(),
        provider: aiConfig.provider,
        model: aiConfig.model,
      },
      linkedin: {
        isConnected: Boolean(linkedInConn),
        personUrn: linkedInConn?.person_urn || null,
        name: linkedInConn?.name || null,
        avatarUrl: linkedInConn?.avatar_url || null,
        needsPersonUrn: linkedInConn?.person_urn?.includes('UNKNOWN'),
      },
      stats: {
        totalRuns: parseInt(stats.total_runs || '0', 10),
        successfulRuns: parseInt(stats.successful_runs || '0', 10),
        publishedArticles: parseInt(stats.published_articles || '0', 10),
        linkedinShares: parseInt(stats.linkedin_shares || '0', 10),
        totalItemsDiscovered: parseInt(stats.total_items_discovered || '0', 10),
        activeSourcesCount: sources.filter((s) => s.isActive).length,
      },
    });
  } catch (err: any) {
    console.error('[DailyNewsStatusAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

