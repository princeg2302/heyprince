import { NextRequest, NextResponse } from 'next/server';
import { getPostsPaginated } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50) : 9;

    const cursorPublishedAt = searchParams.get('cursorPublishedAt') || undefined;
    const cursorSlug = searchParams.get('cursorSlug') || undefined;
    const category = searchParams.get('category') || undefined;
    const period = searchParams.get('period') || undefined;
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as 'newest' | 'oldest') || 'newest';

    const result = await getPostsPaginated({
      limit,
      cursorPublishedAt,
      cursorSlug,
      category,
      period,
      search,
      sort,
    });

    return NextResponse.json(
      {
        success: true,
        posts: result.posts,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        totalCount: result.totalCount,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to fetch paginated posts.',
      },
      { status: 500 }
    );
  }
}
