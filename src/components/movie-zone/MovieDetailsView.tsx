'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaStar,
  FaPlay,
  FaBookmark,
  FaRegBookmark,
  FaClock,
  FaCalendarDays,
  FaTv,
  FaFilm,
  FaArrowUpRightFromSquare,
  FaCircleCheck,
  FaUsers,
  FaShieldHalved,
} from 'react-icons/fa6';
import {
  TMDBMovieDetails,
  getTMDBImageUrl,
  LANGUAGE_LABELS,
  RegionalWatchProviders,
} from '@/lib/tmdb';

export interface MovieDetailsViewProps {
  movie: TMDBMovieDetails;
}

const WATCHLIST_STORAGE_KEY = 'heyprince_movie_watchlist';

export const MovieDetailsView: React.FC<MovieDetailsViewProps> = ({ movie }) => {
  const [region, setRegion] = useState<'IN' | 'US'>('IN');
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Watchlist state sync
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          setIsWatchlisted(list.some((m: any) => m.id === movie.id));
        }
      }
    } catch {}
  }, [movie.id]);

  const toggleWatchlist = () => {
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      let list: any[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      const exists = list.some((m) => m.id === movie.id);
      let updated: any[];
      if (exists) {
        updated = list.filter((m) => m.id !== movie.id);
        setIsWatchlisted(false);
      } else {
        updated = [movie, ...list];
        setIsWatchlisted(true);
      }
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const backdropUrl = getTMDBImageUrl(movie.backdrop_path, 'w1280');
  const posterUrl = getTMDBImageUrl(movie.poster_path, 'w500');

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  // Format runtime: e.g. 138 => "2h 18m"
  const formattedRuntime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;

  // Find official trailer from videos
  const trailerVideo = movie.videos?.results?.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  // Streaming watch providers
  const providersData = movie['watch/providers']?.results;
  const currentProviders: RegionalWatchProviders | undefined =
    region === 'IN' ? providersData?.IN : providersData?.US;

  // Top 6 cast members
  const topCast = movie.credits?.cast?.slice(0, 6) || [];

  // Director
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');

  return (
    <div className="movie-details-page">
      {/* Dynamic Backdrop Hero with Gradient Vignette */}
      <div
        className="movie-backdrop-hero"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 12, 18, 0.45) 0%, rgba(10, 12, 18, 0.95) 75%, #0a0c12 100%), url(${backdropUrl})`,
        }}
      >
        <div className="container">
          {/* Back Navigation Button */}
          <div className="movie-details-nav-row">
            <Link href="/movie-zone" className="gaming-back-btn">
              <FaArrowLeft />
              <span>Back to Movie Zone</span>
            </Link>
            <div className="movie-live-pill">
              <span className="live-pulse-dot" />
              <span>TMDB Verified Metadata</span>
            </div>
          </div>

          <div className="movie-hero-grid">
            {/* Poster Column */}
            <div className="movie-hero-poster-col">
              <div className="movie-hero-poster-card">
                <img
                  src={posterUrl}
                  alt={`${movie.title} poster`}
                  className="movie-hero-poster-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
            </div>

            {/* Info Column */}
            <div className="movie-hero-info-col">
              {movie.certification && (
                <span className="movie-cert-badge">{movie.certification}</span>
              )}

              <h1 className="movie-details-title">{movie.title}</h1>

              {movie.original_title && movie.original_title !== movie.title && (
                <p className="movie-original-title">
                  Original title: <em>{movie.original_title}</em>
                </p>
              )}

              {movie.tagline && (
                <p className="movie-details-tagline">&ldquo;{movie.tagline}&rdquo;</p>
              )}

              {/* Meta Pills Bar */}
              <div className="movie-details-meta-bar">
                <div className="meta-item rating-item">
                  <FaStar className="star-icon text-amber" />
                  <span className="rating-val">
                    {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                  </span>
                  <span className="vote-count">({movie.vote_count?.toLocaleString()} votes)</span>
                </div>

                {releaseYear && (
                  <div className="meta-item">
                    <FaCalendarDays />
                    <span>{movie.release_date}</span>
                  </div>
                )}

                {formattedRuntime && (
                  <div className="meta-item">
                    <FaClock />
                    <span>{formattedRuntime}</span>
                  </div>
                )}

                <div className="meta-item">
                  <span>Language: {LANGUAGE_LABELS[movie.original_language] || movie.original_language?.toUpperCase()}</span>
                </div>
              </div>

              {/* Genres Row */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="movie-details-genres-row">
                  {movie.genres.map((g) => (
                    <span key={g.id} className="details-genre-badge">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="movie-details-actions">
                {trailerVideo && (
                  <a
                    href="#official-trailer-section"
                    className="portal-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('official-trailer-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <FaPlay size={13} className="me-2" />
                    <span>Watch Trailer</span>
                  </a>
                )}

                <button
                  type="button"
                  className={`details-watchlist-btn ${isWatchlisted ? 'active' : ''}`}
                  onClick={toggleWatchlist}
                >
                  {isWatchlisted ? (
                    <>
                      <FaCircleCheck className="text-green me-2" />
                      <span>In Your Watchlist</span>
                    </>
                  ) : (
                    <>
                      <FaBookmark className="me-2" />
                      <span>Add to Watchlist</span>
                    </>
                  )}
                </button>
              </div>

              {/* Overview / Synopsis */}
              <div className="movie-synopsis-wrap">
                <h3 className="section-sub-title">Synopsis</h3>
                <p className="movie-synopsis-text">
                  {movie.overview || 'No synopsis provided for this title.'}
                </p>
              </div>

              {director && (
                <div className="movie-director-row">
                  <span className="director-label">Directed by:</span>
                  <strong className="director-name">{director.name}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container movie-body-container">
        {/* ==========================================================================
            WHERE TO WATCH SECTION (VERIFIED LEGITIMATE STREAMING PROVIDERS)
            ========================================================================== */}
        <section className="movie-section where-to-watch-section">
          <div className="section-header-row">
            <div>
              <span className="section-pill-tag">VERIFIED LEGAL AVAILABILITY</span>
              <h2 className="movie-section-title">
                <FaTv className="text-red me-2" /> Where to Watch
              </h2>
            </div>

            {/* Region Selector */}
            <div className="region-selector-tabs">
              <button
                type="button"
                className={`region-tab-btn ${region === 'IN' ? 'active' : ''}`}
                onClick={() => setRegion('IN')}
              >
                🇮🇳 India
              </button>
              <button
                type="button"
                className={`region-tab-btn ${region === 'US' ? 'active' : ''}`}
                onClick={() => setRegion('US')}
              >
                🇺🇸 United States
              </button>
            </div>
          </div>

          <div className="where-to-watch-card">
            {currentProviders && (currentProviders.flatrate || currentProviders.rent || currentProviders.buy) ? (
              <div className="providers-grid">
                {/* Subscription Streaming (Flatrate) */}
                {currentProviders.flatrate && currentProviders.flatrate.length > 0 && (
                  <div className="provider-category-box">
                    <div className="provider-cat-title">
                      <span className="cat-badge badge-stream">Stream</span>
                      <span>Subscription Platforms</span>
                    </div>
                    <div className="provider-logos-row">
                      {currentProviders.flatrate.map((p) => (
                        <div key={p.provider_id} className="provider-item" title={p.provider_name}>
                          <img
                            src={getTMDBImageUrl(p.logo_path, 'w92' as any)}
                            alt={p.provider_name}
                            className="provider-logo-img"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="provider-name">{p.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rent or Buy */}
                {((currentProviders.rent && currentProviders.rent.length > 0) ||
                  (currentProviders.buy && currentProviders.buy.length > 0)) && (
                  <div className="provider-category-box">
                    <div className="provider-cat-title">
                      <span className="cat-badge badge-rent">Rent / Buy</span>
                      <span>Digital Stores</span>
                    </div>
                    <div className="provider-logos-row">
                      {[...(currentProviders.rent || []), ...(currentProviders.buy || [])]
                        // deduplicate by provider_id
                        .filter(
                          (v, i, a) => a.findIndex((t) => t.provider_id === v.provider_id) === i
                        )
                        .map((p) => (
                          <div key={p.provider_id} className="provider-item" title={p.provider_name}>
                            <img
                              src={getTMDBImageUrl(p.logo_path, 'w92' as any)}
                              alt={p.provider_name}
                              className="provider-logo-img"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className="provider-name">{p.provider_name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="provider-unavailable-box">
                <p>
                  Currently not streaming digitally in{' '}
                  <strong>{region === 'IN' ? 'India' : 'the United States'}</strong>.
                  Check back soon for digital OTT release date announcements.
                </p>
              </div>
            )}

            <div className="providers-footer">
              <p className="providers-legal-note">
                <FaShieldHalved className="me-2 text-green" />
                Data provided by <strong>JustWatch</strong> via TMDB. HeyPrince links directly to authorized, legal streaming platforms.
              </p>
              {currentProviders?.link && (
                <a
                  href={currentProviders.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="justwatch-external-link"
                >
                  <span>View Full Schedule on JustWatch</span>
                  <FaArrowUpRightFromSquare size={12} />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            OFFICIAL TRAILER SECTION (DIRECT IN-PAGE EMBED)
            ========================================================================== */}
        {trailerVideo && (
          <section id="official-trailer-section" className="movie-section trailer-section">
            <span className="section-pill-tag">OFFICIAL PREVIEW</span>
            <h2 className="movie-section-title">
              <FaFilm className="text-red me-2" /> Official Trailer
            </h2>

            <div className="trailer-embed-container">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerVideo.key}?rel=0`}
                title={`${movie.title} Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="trailer-page-iframe"
              />
            </div>
          </section>
        )}

        {/* ==========================================================================
            TOP BILLED CAST SECTION
            ========================================================================== */}
        {topCast.length > 0 && (
          <section className="movie-section cast-section">
            <span className="section-pill-tag">CREDITS</span>
            <h2 className="movie-section-title">
              <FaUsers className="text-red me-2" /> Top Billed Cast
            </h2>

            <div className="cast-members-grid">
              {topCast.map((actor) => (
                <div key={actor.id} className="cast-card">
                  <div className="cast-photo-wrap">
                    <img
                      src={getTMDBImageUrl(actor.profile_path, 'w185')}
                      alt={actor.name}
                      className="cast-photo-img"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div className="cast-info">
                    <h4 className="cast-actor-name">{actor.name}</h4>
                    <p className="cast-character-name">{actor.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==========================================================================
            FOOTER ATTRIBUTION
            ========================================================================== */}
        <div className="movie-attribution-card mt-5">
          <div className="attribution-content">
            <div className="d-flex align-items-center gap-3">
              <span className="tmdb-pill-badge">TMDB OFFICIAL API</span>
              <span className="justwatch-pill-badge">JUSTWATCH POWERED</span>
            </div>
            <p className="attribution-text">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
              Movie posters, backdrops, synopses, and metadata are courtesy of The Movie Database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsView;
