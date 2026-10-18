'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FaMagnifyingGlass,
  FaXmark,
  FaFire,
  FaFilm,
  FaArrowLeft,
  FaBookmark,
  FaClapperboard,
  FaGlobe,
  FaCalendarDays,
  FaShieldHalved,
  FaCircleCheck,
} from 'react-icons/fa6';
import { TMDBMovie, GENRE_MAP, VERIFIED_MOVIES_DATASET } from '@/lib/tmdb';
import { MovieCard } from './MovieCard';
import { TrailerModal } from './TrailerModal';

export type MovieCategory =
  | 'trending'
  | 'now_playing'
  | 'bollywood'
  | 'south_indian'
  | 'hollywood'
  | 'upcoming'
  | 'watchlist';

export interface MovieZoneViewProps {
  initialMovies?: TMDBMovie[];
}

const POPULAR_GENRES = [
  { id: 0, name: 'All Genres' },
  { id: 28, name: 'Action' },
  { id: 53, name: 'Thriller' },
  { id: 35, name: 'Comedy' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
  { id: 10749, name: 'Romance' },
  { id: 16, name: 'Animation' },
  { id: 18, name: 'Drama' },
  { id: 12, name: 'Adventure' },
];

const SOUTH_LANGUAGES = [
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
];

const WATCHLIST_STORAGE_KEY = 'heyprince_movie_watchlist';

export const MovieZoneView: React.FC<MovieZoneViewProps> = ({
  initialMovies = [],
}) => {
  const [category, setCategory] = useState<MovieCategory>('trending');
  const [southLang, setSouthLang] = useState<'ta' | 'te' | 'ml' | 'kn'>('ta');
  const [selectedGenre, setSelectedGenre] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [movies, setMovies] = useState<TMDBMovie[]>(initialMovies.length > 0 ? initialMovies : VERIFIED_MOVIES_DATASET);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<TMDBMovie[]>([]);

  // Trailer Modal State
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<TMDBMovie | null>(null);
  const [activeTrailerKey, setActiveTrailerKey] = useState<string | null>(null);

  // Load Watchlist from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWatchlist(parsed);
        }
      }
    } catch {}
  }, []);

  // Save Watchlist to localStorage
  const handleToggleWatchlist = useCallback((movie: TMDBMovie) => {
    setWatchlist((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      let updated: TMDBMovie[];
      if (exists) {
        updated = prev.filter((m) => m.id !== movie.id);
      } else {
        updated = [movie, ...prev];
      }
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const isWatchlisted = useCallback(
    (movieId: number) => watchlist.some((m) => m.id === movieId),
    [watchlist]
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch movies based on filters
  useEffect(() => {
    if (category === 'watchlist') {
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchMovies = async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedQuery.trim().length > 0) {
          params.set('search', debouncedQuery.trim());
        } else {
          params.set('category', category);
          if (category === 'south_indian') {
            params.set('language', southLang);
          }
          if (selectedGenre !== 0) {
            params.set('genre', String(selectedGenre));
          }
        }

        const res = await fetch(`/api/movies?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        if (isMounted && data.success && Array.isArray(data.movies)) {
          setMovies(data.movies);
        }
      } catch (err) {
        console.warn('Could not load live movies from TMDB API route, using fallback dataset:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMovies();

    return () => {
      isMounted = false;
    };
  }, [category, debouncedQuery, selectedGenre, southLang]);

  // Handle trailer click: fetch trailer key if not already embedded
  const handlePlayTrailer = async (movie: TMDBMovie) => {
    setActiveTrailerMovie(movie);
    setActiveTrailerKey(null);
    setTrailerModalOpen(true);

    try {
      const res = await fetch(`/api/movies/${movie.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.movie && data.movie.videos && data.movie.videos.results) {
          const trailer = data.movie.videos.results.find(
            (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
          );
          if (trailer) {
            setActiveTrailerKey(trailer.key);
          }
        }
      }
    } catch {}
  };

  // Filtered list to display
  const displayedMovies = useMemo(() => {
    if (category === 'watchlist') {
      if (selectedGenre === 0) return watchlist;
      return watchlist.filter(
        (m) =>
          m.genre_ids?.includes(selectedGenre) ||
          m.genres?.some((g) => g.id === selectedGenre)
      );
    }
    return movies;
  }, [category, movies, selectedGenre, watchlist]);

  return (
    <div className="movie-zone-page">
      {/* Background Ambient Glow Accent */}
      <div className="movie-ambient-overlay" aria-hidden="true" />

      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="movie-zone-breadcrumb">
          <Link href="/" className="gaming-back-btn">
            <FaArrowLeft />
            <span>Return to Portfolio</span>
          </Link>
          <div className="movie-live-pill">
            <span className="live-pulse-dot" />
            <span>Official TMDB Movie Hub • Powered by TMDB &amp; JustWatch</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="movie-hero-wrap text-center">
          <h1 className="movie-main-title">
            HeyPrince <span className="text-red">Movie Zone</span> 🎬
          </h1>
          <p className="movie-hero-desc">
            Discover current theatrical hits, trending blockbusters, upcoming releases,
            Bollywood, South Indian cinema, and verified &quot;Where to Watch&quot; streaming availability.
          </p>

          {/* Search Bar */}
          <div className="movie-search-box-wrap">
            <div className="movie-search-box">
              <FaMagnifyingGlass className="search-icon" />
              <input
                type="text"
                className="movie-search-input"
                placeholder="Search movies by title (e.g. Kalki, Dune, Stree, Avatar)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <FaXmark />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================================================
            CATEGORY SELECTION TABS
            ========================================================================== */}
        {!searchQuery && (
          <div className="movie-category-tabs">
            <button
              type="button"
              className={`movie-cat-tab ${category === 'trending' ? 'active' : ''}`}
              onClick={() => {
                setCategory('trending');
                setSelectedGenre(0);
              }}
            >
              <FaFire /> <span>Trending Now</span>
            </button>

            <button
              type="button"
              className={`movie-cat-tab ${category === 'now_playing' ? 'active' : ''}`}
              onClick={() => {
                setCategory('now_playing');
                setSelectedGenre(0);
              }}
            >
              <FaClapperboard /> <span>Now In Theatres</span>
            </button>

            <button
              type="button"
              className={`movie-cat-tab ${category === 'bollywood' ? 'active' : ''}`}
              onClick={() => {
                setCategory('bollywood');
                setSelectedGenre(0);
              }}
            >
              <span>🇮🇳 Bollywood &amp; Hindi</span>
            </button>

            <button
              type="button"
              className={`movie-cat-tab ${category === 'south_indian' ? 'active' : ''}`}
              onClick={() => {
                setCategory('south_indian');
                setSelectedGenre(0);
              }}
            >
              <span>🌴 South Indian Cinema</span>
            </button>

            <button
              type="button"
              className={`movie-cat-tab ${category === 'hollywood' ? 'active' : ''}`}
              onClick={() => {
                setCategory('hollywood');
                setSelectedGenre(0);
              }}
            >
              <FaGlobe /> <span>Hollywood</span>
            </button>

            <button
              type="button"
              className={`movie-cat-tab ${category === 'upcoming' ? 'active' : ''}`}
              onClick={() => {
                setCategory('upcoming');
                setSelectedGenre(0);
              }}
            >
              <FaCalendarDays /> <span>Upcoming</span>
            </button>

            <button
              type="button"
              className={`movie-cat-tab watchlist-tab ${category === 'watchlist' ? 'active' : ''}`}
              onClick={() => {
                setCategory('watchlist');
                setSelectedGenre(0);
              }}
            >
              <FaBookmark /> <span>My Watchlist ({watchlist.length})</span>
            </button>
          </div>
        )}

        {/* Sub-Language Selector for South Indian Cinema */}
        {!searchQuery && category === 'south_indian' && (
          <div className="south-lang-pill-row">
            <span className="filter-label">Language:</span>
            {SOUTH_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`south-lang-pill ${southLang === lang.code ? 'active' : ''}`}
                onClick={() => setSouthLang(lang.code as any)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}

        {/* Genre Filter Pill Row */}
        {!searchQuery && category !== 'watchlist' && (
          <div className="movie-genre-filter-row">
            {POPULAR_GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`genre-filter-pill ${selectedGenre === g.id ? 'active' : ''}`}
                onClick={() => setSelectedGenre(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Active Filter or Search Banner */}
        {searchQuery && (
          <div className="search-status-banner">
            <span>
              Search results for <strong>&quot;{searchQuery}&quot;</strong> ({displayedMovies.length} found)
            </span>
            <button
              type="button"
              className="banner-clear-link"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </button>
          </div>
        )}

        {/* ==========================================================================
            MOVIES GRID DISPLAY
            ========================================================================== */}
        {loading ? (
          <div className="movies-grid-loading">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="movie-skeleton-card" />
            ))}
          </div>
        ) : displayedMovies.length > 0 ? (
          <div className="movies-deck-grid">
            {displayedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isWatchlisted={isWatchlisted(movie.id)}
                onToggleWatchlist={handleToggleWatchlist}
                onPlayTrailer={handlePlayTrailer}
              />
            ))}
          </div>
        ) : (
          <div className="movies-empty-state">
            <FaFilm size={48} className="empty-icon text-red" />
            <h3>No movies found</h3>
            <p>
              {category === 'watchlist'
                ? "Your watchlist is currently empty. Click the bookmark icon on any movie to save it here!"
                : 'Try adjusting your search query, genre filter, or category.'}
            </p>
            {category === 'watchlist' && (
              <button
                type="button"
                className="portal-btn mt-3"
                onClick={() => setCategory('trending')}
              >
                Explore Trending Movies
              </button>
            )}
          </div>
        )}

        {/* ==========================================================================
            OFFICIAL TMDB & JUSTWATCH ATTRIBUTION BANNER
            ========================================================================== */}
        <div className="movie-attribution-card">
          <div className="attribution-content">
            <div className="d-flex align-items-center gap-3">
              <span className="tmdb-pill-badge">TMDB OFFICIAL API</span>
              <span className="justwatch-pill-badge">JUSTWATCH POWERED</span>
            </div>
            <p className="attribution-text">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
              Where to Watch regional streaming data is powered by JustWatch via TMDB.
              HeyPrince does not host, stream, scrape, or distribute unauthorized video files.
            </p>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
        videoKey={activeTrailerKey}
        movieTitle={activeTrailerMovie?.title || 'Movie'}
      />
    </div>
  );
};

export default MovieZoneView;

