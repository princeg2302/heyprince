'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FaSearch,
  FaCalendarAlt,
  FaTimes,
  FaSortAmountDown,
  FaSortAmountUp,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  FaClock,
  FaArrowRight,
  FaFilter,
  FaLayerGroup,
  FaRotateRight,
} from 'react-icons/fa6';
import { Article } from '@/data/siteContent';

const DEFAULT_BLOG_FALLBACK = '/assets/blog/photo1.webp';
const PAGE_SIZE = 9;

interface InsightsListingClientProps {
  initialPosts: Article[];
  totalCount?: number;
}

export function InsightsListingClient({ initialPosts, totalCount }: InsightsListingClientProps) {
  const searchParams = useSearchParams();

  // Initialize filters from URL parameters if available
  const urlCategory = searchParams.get('category') || 'all';
  const urlPeriod = searchParams.get('period') || 'all';
  const urlSort = (searchParams.get('sort') as 'newest' | 'oldest') || 'newest';
  const urlQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(urlPeriod);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(urlSort);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);

  // Paginated articles state
  const [posts, setPosts] = useState<Article[]>(() => initialPosts.slice(0, PAGE_SIZE));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(() => {
    if (typeof totalCount === 'number') {
      return totalCount > initialPosts.slice(0, PAGE_SIZE).length;
    }
    return initialPosts.length >= PAGE_SIZE;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination Cursor
  const [nextCursor, setNextCursor] = useState<{ publishedAt?: string; slug?: string } | null>(() => {
    const initialSlice = initialPosts.slice(0, PAGE_SIZE);
    if (initialSlice.length >= PAGE_SIZE) {
      const last = initialSlice[initialSlice.length - 1];
      return {
        publishedAt: (last as any).publishedAtIso || last.date,
        slug: last.slug,
      };
    }
    return null;
  });

  // Concurrency & Observer Locks
  const isLoadingRef = useRef<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Sync state to URL without full page reload
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedPeriod && selectedPeriod !== 'all') params.set('period', selectedPeriod);
    if (sortOrder && sortOrder !== 'newest') params.set('sort', sortOrder);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());

    const newQueryString = params.toString();
    const newPath = newQueryString ? `/insights/?${newQueryString}` : '/insights/';

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newPath);
    }
  }, [selectedCategory, selectedPeriod, sortOrder, searchQuery]);

  // Fetch a page of posts from the feed API
  const fetchPostsBatch = useCallback(
    async (isReset: boolean, cursor?: { publishedAt?: string; slug?: string } | null) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.set('limit', String(PAGE_SIZE));
        queryParams.set('sort', sortOrder);

        if (selectedCategory !== 'all') {
          queryParams.set('category', selectedCategory);
        }
        if (selectedPeriod !== 'all') {
          queryParams.set('period', selectedPeriod);
        }
        if (searchQuery.trim()) {
          queryParams.set('q', searchQuery.trim());
        }
        if (cursor?.publishedAt) {
          queryParams.set('cursorPublishedAt', cursor.publishedAt);
        }
        if (cursor?.slug) {
          queryParams.set('cursorSlug', cursor.slug);
        }

        const res = await fetch(`/api/insights/feed?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.success || !Array.isArray(data.posts)) {
          throw new Error(data.error || 'Invalid API response format.');
        }

        const newPosts: Article[] = data.posts;
        const newHasMore: boolean = Boolean(data.hasMore);
        const newCursor = data.nextCursor || null;

        if (isReset) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => {
            const existingSlugs = new Set(prev.map((p) => p.slug));
            const unique = newPosts.filter((p) => !existingSlugs.has(p.slug));
            return [...prev, ...unique];
          });
        }

        setHasMore(newHasMore);
        setNextCursor(newCursor);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load posts. Please try again.');
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [selectedCategory, selectedPeriod, sortOrder, searchQuery]
  );

  // When filters or search criteria change, reset list and fetch page 1
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If initial URL had active filters different from default, fetch matching results
      if (urlCategory !== 'all' || urlPeriod !== 'all' || urlSort !== 'newest' || urlQuery !== '') {
        fetchPostsBatch(true, null);
      }
      return;
    }

    fetchPostsBatch(true, null);
  }, [selectedCategory, selectedPeriod, sortOrder, searchQuery, fetchPostsBatch, urlCategory, urlPeriod, urlSort, urlQuery]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoading) {
      return;
    }

    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingRef.current) {
          fetchPostsBatch(false, nextCursor);
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.05,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, nextCursor, fetchPostsBatch]);

  // Derived filter categories from initial list
  const categories = useMemo(() => {
    const catSet = new Set<string>();
    initialPosts.forEach((p) => {
      if (p.category) catSet.add(p.category);
    });
    return Array.from(catSet).sort();
  }, [initialPosts]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    initialPosts.forEach((post) => {
      const dateObj = new Date(post.date);
      if (!isNaN(dateObj.getTime())) {
        years.add(dateObj.getFullYear().toString());
      }
    });
    return Array.from(years).sort().reverse();
  }, [initialPosts]);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedPeriod !== 'all' ||
    searchQuery.trim().length > 0 ||
    sortOrder !== 'newest';

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedPeriod('all');
    setSortOrder('newest');
    setSearchQuery('');
  };

  const handleRetry = () => {
    fetchPostsBatch(false, nextCursor);
  };

  return (
    <div className="insights-filter-container mb-5">
      {/* Search and Secondary Filter Controls */}
      <div
        style={{
          background: 'rgba(14, 16, 23, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '24px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div className="row g-3 align-items-center">
          {/* Keyword Search Input */}
          <div className="col-lg-5 col-md-6 col-12">
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px',
                transition: 'border-color 0.2s ease',
              }}
            >
              <FaSearch style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.85rem' }} />
              <input
                type="text"
                placeholder="Search articles by title or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  padding: '9px 10px',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Date / Time Period Filter */}
          <div className="col-lg-4 col-md-3 col-6">
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px',
              }}
            >
              <FaCalendarAlt style={{ color: '#d40027', fontSize: '0.82rem', marginRight: '8px' }} />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                aria-label="Filter by date period"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  padding: '9px 0',
                  cursor: 'pointer',
                }}
              >
                <option value="all" style={{ background: '#0e1017' }}>All Dates</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} style={{ background: '#0e1017' }}>
                    Year {yr}
                  </option>
                ))}
                <option value="last30" style={{ background: '#0e1017' }}>Last 30 Days</option>
                <option value="last90" style={{ background: '#0e1017' }}>Last 90 Days</option>
              </select>
            </div>
          </div>

          {/* Date Sort Order */}
          <div className="col-lg-3 col-md-3 col-6">
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0 12px',
              }}
            >
              {sortOrder === 'newest' ? (
                <FaSortAmountDown style={{ color: '#d40027', fontSize: '0.82rem', marginRight: '8px' }} />
              ) : (
                <FaSortAmountUp style={{ color: '#d40027', fontSize: '0.82rem', marginRight: '8px' }} />
              )}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                aria-label="Sort by publication date"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  padding: '9px 0',
                  cursor: 'pointer',
                }}
              >
                <option value="newest" style={{ background: '#0e1017' }}>Newest First</option>
                <option value="oldest" style={{ background: '#0e1017' }}>Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Navigation Row */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.74rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginRight: '6px',
              flexShrink: 0,
            }}
          >
            <FaLayerGroup size={12} style={{ color: '#d40027' }} />
            <span>Category:</span>
          </div>

          {/* All Categories Pill */}
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              background: selectedCategory === 'all' ? '#d40027' : 'rgba(255, 255, 255, 0.05)',
              color: selectedCategory === 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
              border: selectedCategory === 'all' ? '1px solid #d40027' : '1px solid rgba(255, 255, 255, 0.08)',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: selectedCategory === 'all' ? '0 0 14px rgba(212, 0, 39, 0.45)' : 'none',
              flexShrink: 0,
            }}
          >
            All Insights
          </button>

          {/* Category Filter Pills */}
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isSelected ? '#d40027' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                  border: isSelected ? '1px solid #d40027' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 14px rgba(212, 0, 39, 0.45)' : 'none',
                  flexShrink: 0,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '0 4px',
          fontSize: '0.82rem',
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        <div>
          Showing <strong style={{ color: '#ffffff' }}>{posts.length}</strong> engineering articles
          {selectedCategory !== 'all' && (
            <span style={{ color: '#d40027', fontWeight: 600 }}> in {selectedCategory}</span>
          )}
          {selectedPeriod !== 'all' && (
            <span style={{ color: '#38bdf8' }}>
              {' '}
              {selectedPeriod === 'last30'
                ? 'Last 30 Days'
                : selectedPeriod === 'last90'
                ? 'Last 90 Days'
                : `Year ${selectedPeriod}`}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAllFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#d40027',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
            }}
          >
            <FaTimes size={10} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Articles Grid */}
      {posts.length > 0 ? (
        <div className="row g-4 justify-content-center">
          {posts.map((post) => (
            <div key={post.slug} className="col-lg-4 col-md-6 col-12 d-flex">
              <div
                className="card article-card insight-card w-100 d-flex flex-column"
                style={{
                  background: '#0e1017',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  minWidth: 0,
                }}
              >
                <Link
                  className="insight-card-link d-flex flex-column h-100"
                  href={`/insights/${post.slug}/`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16 / 10',
                      overflow: 'hidden',
                      background: '#13151f',
                    }}
                  >
                    <img
                      className="card-img"
                      src={post.image || DEFAULT_BLOG_FALLBACK}
                      alt={`${post.title} - Engineering Insight by Prince`}
                      loading="lazy"
                      decoding="async"
                      width="600"
                      height="375"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== DEFAULT_BLOG_FALLBACK && !target.src.endsWith(DEFAULT_BLOG_FALLBACK)) {
                          target.src = DEFAULT_BLOG_FALLBACK;
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                    />
                  </div>

                  <div className="card-body d-flex flex-column flex-grow-1 p-4" style={{ minWidth: 0 }}>
                    {/* Category & Read Time Row */}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span
                        className="read-mins"
                        style={{
                          fontSize: '11px',
                          color: '#d40027',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <FaClock size={10} />
                        {post.readMins} read
                      </span>

                      <span
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: 600,
                        }}
                      >
                        {post.category || 'Engineering'}
                      </span>
                    </div>

                    {/* Published Date */}
                    {post.date && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.4)',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <FaCalendarAlt size={9} />
                        <span>{post.date}</span>
                      </div>
                    )}

                    <h2
                      className="card-title"
                      style={{
                        fontSize: '19px',
                        fontWeight: 700,
                        lineHeight: 1.35,
                        color: '#ffffff',
                        marginBottom: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.title}
                    </h2>

                    <p
                      className="card-content"
                      style={{
                        fontSize: '13.5px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineHeight: 1.6,
                        marginBottom: '20px',
                        flex: '1 0 auto',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.description}
                    </p>

                    <div className="mt-auto pt-2">
                      <span
                        className="read-more-link"
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        Read Full Story <FaArrowRight size={11} style={{ color: '#d40027' }} />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        /* Empty State */
        <div
          style={{
            background: 'rgba(14, 16, 23, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '50px 24px',
            textAlign: 'center',
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(212, 0, 39, 0.1)',
              color: '#d40027',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              marginBottom: '16px',
            }}
          >
            <FaFilter />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            No Articles Found
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
            No engineering insights matched your selected category and date criteria. Try adjusting your filters or resetting them to view all posts.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            style={{
              background: '#d40027',
              border: 'none',
              color: '#ffffff',
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : null}

      {/* Infinite Scroll Sentinel */}
      {hasMore && <div ref={sentinelRef} style={{ height: '40px', margin: '20px 0' }} />}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center py-4 my-3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(18, 20, 29, 0.9)',
              border: '1px solid rgba(255, 51, 85, 0.3)',
              borderRadius: '999px',
              padding: '10px 24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 51, 85, 0.2)',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ff3355',
                display: 'inline-block',
                boxShadow: '0 0 10px #ff3355',
                animation: 'pulse 1.2s infinite',
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.04em' }}>
              Loading Next 9 Engineering Dispatches...
            </span>
          </div>
        </div>
      )}

      {/* Error State with Retry Button */}
      {errorMessage && !isLoading && (
        <div className="text-center py-4 my-3">
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(28, 12, 16, 0.95)',
              border: '1px solid rgba(255, 51, 85, 0.5)',
              borderRadius: '16px',
              padding: '18px 28px',
              maxWidth: '480px',
              margin: '0 auto',
            }}
          >
            <span style={{ color: '#ff6b81', fontSize: '0.86rem' }}>
              {errorMessage}
            </span>
            <button
              type="button"
              onClick={handleRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#d40027',
                border: 'none',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212, 0, 39, 0.4)',
              }}
            >
              <FaRotateRight size={12} />
              <span>Retry Loading</span>
            </button>
          </div>
        </div>
      )}

      {/* End of List Message */}
      {!hasMore && posts.length > 0 && !isLoading && (
        <div className="text-center py-5 my-3">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(15, 17, 24, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              padding: '10px 26px',
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
            }}
          >
            <FaCheckCircle style={{ color: '#22c55e' }} size={13} />
            <span>You have caught up with all {posts.length} engineering insights // 2026 Edition</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default InsightsListingClient;
