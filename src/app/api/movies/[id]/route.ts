import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Movie ID required' }, { status: 400 });
    }

    const movie = await getMovieDetails(id);
    if (!movie) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      movie,
    });
  } catch (error: any) {
    console.error('Movie details API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}

