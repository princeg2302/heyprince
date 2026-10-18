import { NextRequest, NextResponse } from 'next/server';
import {
  getTrendingMovies,
  getNowPlayingMovies,
  getPopularMovies,
  getUpcomingMovies,
  getIndianMovies,
  getSouthIndianMovies,
  getHollywoodMovies,
  getMoviesByGenre,
  searchMovies,
  TMDBMovie,
} from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'trending';
    const query = searchParams.get('search');
    const genre = searchParams.get('genre');
    const language = searchParams.get('language');
    const page = parseInt(searchParams.get('page') || '1', 10);

    let movies: TMDBMovie[] = [];

    if (query && query.trim().length > 0) {
      movies = await searchMovies(query, page);
    } else if (genre && !isNaN(parseInt(genre, 10))) {
      movies = await getMoviesByGenre(parseInt(genre, 10), page);
    } else {
      switch (category) {
        case 'now_playing':
          movies = await getNowPlayingMovies(page);
          break;
        case 'popular':
          movies = await getPopularMovies(page);
          break;
        case 'upcoming':
          movies = await getUpcomingMovies(page);
          break;
        case 'bollywood':
          movies = await getIndianMovies(language || 'hi', page);
          break;
        case 'south_indian':
          movies = await getSouthIndianMovies((language as 'ta' | 'te' | 'ml' | 'kn') || 'ta', page);
          break;
        case 'hollywood':
          movies = await getHollywoodMovies(page);
          break;
        case 'trending':
        default:
          movies = await getTrendingMovies('week');
          break;
      }
    }

    const hasApiKey = Boolean(process.env.TMDB_API_KEY || process.env.TMDB_ACCESS_TOKEN || process.env.NEXT_PUBLIC_TMDB_API_KEY);

    return NextResponse.json({
      success: true,
      category,
      count: movies.length,
      hasApiKey,
      movies,
    });
  } catch (error: any) {
    console.error('Movies API route error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}

