import type { Metadata } from 'next';
import React from 'react';
import { MovieZoneView } from '@/components';
import { getTrendingMovies } from '@/lib/tmdb';

export const metadata: Metadata = {
  title: 'Movie Zone — Discover Latest Blockbusters, Bollywood & Theatrical Releases | HeyPrince',
  description:
    'Explore latest theatrical releases, trending blockbusters, upcoming movies, Bollywood, South Indian cinema (Tamil, Telugu, Malayalam), official trailers, verified ratings, and where to watch streaming availability.',
  keywords: [
    'Movie Zone',
    'Latest Movies Online',
    'Bollywood Movies',
    'South Indian Cinema',
    'Upcoming Movie Releases',
    'Where to Watch Movies',
    'Movie Trailers',
    'TMDB Movie Discovery',
    'HeyPrince Movie Zone',
  ],
  alternates: {
    canonical: 'https://heyprince.in/movie-zone/',
  },
  openGraph: {
    title: 'Movie Zone — Discover Latest Blockbusters & Streaming Availability | HeyPrince',
    description:
      'Explore current theatrical releases, trending movies, Bollywood, South Indian cinema, trailers, ratings, and verified where to watch streaming availability.',
    url: 'https://heyprince.in/movie-zone/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movie Zone — Discover Latest Blockbusters & Streaming Availability | HeyPrince',
    description:
      'Explore current theatrical releases, trending movies, Bollywood, South Indian cinema, trailers, ratings, and verified where to watch streaming availability.',
  },
};

export default async function MovieZonePage() {
  const initialMovies = await getTrendingMovies('week');

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'HeyPrince Movie Zone — Discover Blockbusters & Theatrical Releases',
    description:
      'Explore latest theatrical releases, trending movies, Bollywood, South Indian cinema, trailers, and where to watch legal streaming availability.',
    url: 'https://heyprince.in/movie-zone/',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: initialMovies.slice(0, 10).map((movie, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Movie',
          name: movie.title,
          url: `https://heyprince.in/movie-zone/${movie.id}`,
          datePublished: movie.release_date,
          aggregateRating: movie.vote_average
            ? {
                '@type': 'AggregateRating',
                ratingValue: movie.vote_average,
                bestRating: '10',
                ratingCount: movie.vote_count || 1,
              }
            : undefined,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <MovieZoneView initialMovies={initialMovies} />
    </>
  );
}

