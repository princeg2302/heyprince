'use client';

import React from 'react';
import Link from 'next/link';
import { FaStar, FaBookmark, FaRegBookmark, FaPlay } from 'react-icons/fa6';
import { TMDBMovie, GENRE_MAP, getTMDBImageUrl } from '@/lib/tmdb';

export interface MovieCardProps {
  movie: TMDBMovie;
  isWatchlisted: boolean;
  onToggleWatchlist: (movie: TMDBMovie) => void;
  onPlayTrailer?: (movie: TMDBMovie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isWatchlisted,
  onToggleWatchlist,
  onPlayTrailer,
}) => {
  const posterUrl = getTMDBImageUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  // Extract top 2 genres
  const genres =
    movie.genres && movie.genres.length > 0
      ? movie.genres.slice(0, 2).map((g) => g.name)
      : movie.genre_ids && movie.genre_ids.length > 0
      ? movie.genre_ids.slice(0, 2).map((id) => GENRE_MAP[id] || 'Film')
      : [];

  const langCode = (movie.original_language || 'en').toUpperCase();

  return (
    <div className="movie-card">
      <div className="movie-poster-wrap">
        <Link href={`/movie-zone/${movie.id}`} className="poster-link-block">
          <img
            src={posterUrl}
            alt={`${movie.title} poster`}
            className="movie-poster-img"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
            }}
          />
        </Link>

        {/* Ambient Top Badges */}
        <div className="movie-poster-overlay-top">
          <span className="movie-rating-badge">
            <FaStar className="star-icon" />
            <span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
          </span>

          <span className="movie-lang-badge">{langCode}</span>
        </div>

        {/* Watchlist Quick Button */}
        <button
          type="button"
          className={`movie-watchlist-btn ${isWatchlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWatchlist(movie);
          }}
          title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          aria-label={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {isWatchlisted ? <FaBookmark /> : <FaRegBookmark />}
        </button>

        {/* Hover Trailer Quick Trigger */}
        {onPlayTrailer && (
          <button
            type="button"
            className="movie-quick-trailer-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlayTrailer(movie);
            }}
            title="Watch Official Trailer"
          >
            <FaPlay size={12} />
            <span>Trailer</span>
          </button>
        )}
      </div>

      <div className="movie-card-info">
        <div className="movie-meta-row">
          {releaseYear && <span className="movie-year">{releaseYear}</span>}
          {genres.length > 0 && (
            <span className="movie-genres-pill">{genres.join(' • ')}</span>
          )}
        </div>

        <h3 className="movie-title">
          <Link href={`/movie-zone/${movie.id}`} title={movie.title}>
            {movie.title}
          </Link>
        </h3>
      </div>
    </div>
  );
};

