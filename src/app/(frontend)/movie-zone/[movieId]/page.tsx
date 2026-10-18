import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { MovieDetailsView } from '@/components';
import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';

interface MovieDetailsPageProps {
  params: Promise<{ movieId: string }>;
}

export async function generateMetadata({
  params,
}: MovieDetailsPageProps): Promise<Metadata> {
  const { movieId } = await params;
  const movie = await getMovieDetails(movieId);

  if (!movie) {
    return {
      title: 'Movie Not Found | HeyPrince Movie Zone',
      description: 'The requested movie could not be found.',
    };
  }

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : '';
  const title = `${movie.title}${releaseYear ? ` (${releaseYear})` : ''} — Ratings, Trailer & Where to Watch | HeyPrince Movie Zone`;
  const description =
    movie.overview?.slice(0, 160) ||
    `Explore verified ratings, official trailer, cast, and where to watch streaming availability for ${movie.title}.`;

  const ogImage = movie.backdrop_path
    ? getTMDBImageUrl(movie.backdrop_path, 'w1280')
    : movie.poster_path
    ? getTMDBImageUrl(movie.poster_path, 'w500')
    : 'https://heyprince.in/assets/og-image.png';

  return {
    title,
    description,
    alternates: {
      canonical: `https://heyprince.in/movie-zone/${movie.id}/`,
    },
    openGraph: {
      title,
      description,
      url: `https://heyprince.in/movie-zone/${movie.id}/`,
      type: 'video.movie',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: movie.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function MovieDetailsPage({ params }: MovieDetailsPageProps) {
  const { movieId } = await params;
  const movie = await getMovieDetails(movieId);

  if (!movie) {
    notFound();
  }

  const director = movie.credits?.crew?.find((c) => c.job === 'Director');
  const trailer = movie.videos?.results?.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    alternateName: movie.original_title,
    description: movie.overview,
    datePublished: movie.release_date,
    image: movie.poster_path ? getTMDBImageUrl(movie.poster_path, 'w500') : undefined,
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    director: director ? { '@type': 'Person', name: director.name } : undefined,
    actor: movie.credits?.cast?.slice(0, 5).map((actor) => ({
      '@type': 'Person',
      name: actor.name,
    })),
    aggregateRating: movie.vote_average
      ? {
          '@type': 'AggregateRating',
          ratingValue: movie.vote_average,
          bestRating: '10',
          ratingCount: movie.vote_count || 1,
        }
      : undefined,
    trailer: trailer
      ? {
          '@type': 'VideoObject',
          name: `${movie.title} Official Trailer`,
          embedUrl: `https://www.youtube.com/embed/${trailer.key}`,
          thumbnailUrl: `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`,
          uploadDate: movie.release_date,
          description: `Official trailer for ${movie.title}`,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <MovieDetailsView movie={movie} />
    </>
  );
}

