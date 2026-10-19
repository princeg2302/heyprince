'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FaSearch,
  FaCalendarAlt,
  FaClock,
  FaArrowRight,
  FaFilter,
  FaTimes,
  FaSortAmountDown,
  FaSortAmountUp,
  FaLayerGroup,
} from 'react-icons/fa';
import { Article } from '@/data/siteContent';

interface InsightsListingClientProps {
  initialPosts: Article[];
}

export function InsightsListingClient({ initialPosts }: InsightsListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL parameters if available
  const urlCategory = searchParams.get('category') || 'all';
  const urlPeriod = searchParams.get('period') || 'all';
  const urlSort = (searchParams.get('sort') as 'newest' | 'oldest') || 'newest';
  const urlQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(urlPeriod);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(urlSort);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);

  // Extract unique categories with post counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialPosts.forEach((post) => {
      const cat = post.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [initialPosts]);

  const categories = useMemo(() => {
    return Object.keys(categoryCounts).sort();
  }, [categoryCounts]);

  // Extract available years for the date filter
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

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    const now = new Date();

    return initialPosts
      .filter((post) => {
        // 1. Category filter
        if (selectedCategory !== 'all') {
          const postCat = (post.category || 'General').toLowerCase();
          if (postCat !== selectedCategory.toLowerCase()) return false;
        }

        // 2. Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchDesc = post.description.toLowerCase().includes(q);
          const matchTags = post.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTags) return false;
        }

        // 3. Date / Period filter
        if (selectedPeriod !== 'all') {
          const postDate = new Date(post.date);
          if (isNaN(postDate.getTime())) return true; // keep if undated

          if (selectedPeriod === 'last30') {
            const diffDays = (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24);
            if (diffDays > 30) return false;
          } else if (selectedPeriod === 'last90') {
            const diffDays = (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24);
            if (diffDays > 90) return false;
          } else {
            // Filter by specific Year (e.g. '2026', '2025')
            if (postDate.getFullYear().toString() !== selectedPeriod) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [initialPosts, selectedCategory, selectedPeriod, sortOrder, searchQuery]);

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

          {/* Date Sort Order (Newest vs Oldest) */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '6px', flexShrink: 0 }}>
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
            All Insights ({initialPosts.length})
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
                {cat} ({categoryCounts[cat] || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Status & Count Bar */}
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
          Showing <strong style={{ color: '#ffffff' }}>{filteredPosts.length}</strong> of{' '}
          <strong>{initialPosts.length}</strong> engineering articles
          {selectedCategory !== 'all' && (
            <span style={{ color: '#d40027', fontWeight: 600 }}> • in {selectedCategory}</span>
          )}
          {selectedPeriod !== 'all' && (
            <span style={{ color: '#38bdf8' }}> • {selectedPeriod === 'last30' ? 'Last 30 Days' : selectedPeriod === 'last90' ? 'Last 90 Days' : `Year ${selectedPeriod}`}</span>
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
      {filteredPosts.length > 0 ? (
        <div className="row g-4 justify-content-center">
          {filteredPosts.map((post) => (
            <div key={post.slug} className="col-lg-4 col-md-6 col-12 d-flex">
              <div
                className="card article-card insight-card w-100 d-flex flex-column"
                style={{
                  background: '#0e1017',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
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
                      height: '220px',
                      overflow: 'hidden',
                      background: '#13151f',
                    }}
                  >
                    <img
                      className="card-img"
                      src={post.image}
                      alt={`${post.title} - Engineering Insight by Prince`}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                    />
                  </div>

                  <div className="card-body d-flex flex-column flex-grow-1 p-4">
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
      ) : (
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
            className="hpa-btn hpa-btn-primary"
            style={{
              background: '#d40027',
              borderColor: '#d40027',
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
      )}
    </div>
  );
}

export default InsightsListingClient;

