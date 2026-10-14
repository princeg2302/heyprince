import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  getDailyNewsSources,
  addDailyNewsSource,
  updateDailyNewsSource,
  deleteDailyNewsSource,
} from '@/lib/daily-news/db';
import { fetchFeed } from '@/lib/daily-news/rss-collector';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const sources = await getDailyNewsSources();
  return NextResponse.json({ success: true, sources });
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Action 1: Test feed live
    if (body.action === 'test') {
      const url = body.url?.trim();
      if (!url) {
        return NextResponse.json({ success: false, error: 'Feed URL is required' }, { status: 400 });
      }

      const tempSource = {
        id: 0,
        name: body.name || 'Test Source',
        url,
        feedType: (body.feedType as any) || 'rss',
        category: body.category || 'Tech',
        isActive: true,
        lastStatus: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testRes = await fetchFeed(tempSource, 7000);
      if (testRes.error) {
        return NextResponse.json({ success: false, error: testRes.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        storiesFound: testRes.stories.length,
        sampleHeadlines: testRes.stories.slice(0, 3).map((s) => s.headline),
      });
    }

    // Action 2: Add new source
    if (!body.name || !body.url) {
      return NextResponse.json(
        { success: false, error: 'Source name and URL are required.' },
        { status: 400 }
      );
    }

    const created = await addDailyNewsSource({
      name: body.name,
      url: body.url,
      category: body.category,
      feedType: body.feedType,
    });

    return NextResponse.json({ success: true, source: created });
  } catch (err: any) {
    console.error('[DailyNewsSourcesAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save source' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Valid id required' }, { status: 400 });
    }

    await updateDailyNewsSource(id, body.updates);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DailyNewsSourcesAPI] Update error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '', 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Valid id is required' }, { status: 400 });
    }

    await deleteDailyNewsSource(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DailyNewsSourcesAPI] Delete error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Delete failed' },
      { status: 500 }
    );
  }
}

