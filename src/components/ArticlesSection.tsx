'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FaClock,
  FaArrowRight,
  FaCalendarDays,
  FaBolt,
  FaBookOpen,
  FaArrowUpRightFromSquare,
  FaFeatherPointed,
} from 'react-icons/fa6';
import { Article, articlesList } from '../data/siteContent';

const DEFAULT_BLOG_FALLBACK = '/assets/blog/photo1.webp';
const DEFAULT_AUTHOR_AVATAR =
  'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg';

export interface ArticlesSectionProps {
  articles?: Article[];
  onSelectArticle?: (slug: string) => void;
}

export const ArticlesSection: React.FC<ArticlesSectionProps> = ({
  articles,
  onSelectArticle,
}) => {
  const sectionRef = useRef<HTMLElement>(null);

  // Use dynamic articles passed from server, fallback to static articlesList
  const displayArticles = articles && articles.length > 0 ? articles : articlesList;
  const featuredArticle = displayArticles[0];
  const companionArticles = displayArticles.slice(1, 4);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        gsap.fromTo(
          ['.editorial-featured-wrap', '.editorial-companion-card', '.articles-discovery-bar'],
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 82%',
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [displayArticles]);

  const handleArticleClick = (slug: string, e: React.MouseEvent) => {
    if (onSelectArticle) {
      e.preventDefault();
      onSelectArticle(slug);
    }
  };

  return (
    <section
      className="py-5"
      id="articles"
      ref={sectionRef}
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '500px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(212, 0, 39, 0.08) 0%, rgba(0, 242, 254, 0.03) 50%, transparent 75%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div className="container py-5" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-5 pb-2">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
            style={{
              background: 'rgba(212, 0, 39, 0.12)',
              border: '1px solid rgba(212, 0, 39, 0.3)',
            }}
          >
            <FaFeatherPointed size={12} style={{ color: '#d40027' }} />
            <span
              style={{
                color: '#d40027',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Architectural Essays &amp; Tech Dispatches // 2026
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(32px, 4vw, 50px)',
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            Read Between The Code
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.68)',
              fontSize: '16px',
              lineHeight: 1.6,
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            In-depth engineering breakdowns, Next.js optimization playbooks, AI agent orchestration, and actionable architecture blueprints written by practitioners.
          </p>
        </div>

        {/* 1. LUXURY EDITORIAL FEATURED BLOG (Magazine Cover Layout) */}
        {featuredArticle && (
          <div className="editorial-featured-wrap mb-5">
            <Link
              href={`/insights/${featuredArticle.slug}/`}
              onClick={(e) => handleArticleClick(featuredArticle.slug, e)}
              className="text-decoration-none d-block rounded-4 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #10121a 0%, #07080a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 0, 39, 0.15)',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 0, 39, 0.6)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 35px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(212, 0, 39, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 0, 39, 0.15)';
              }}
            >
              <div className="row g-0 align-items-stretch">
                {/* Left/Top: Image Column with Cinematic Gradient Mask */}
                <div className="col-lg-6 col-12 position-relative" style={{ minHeight: '360px', background: '#0a0b0e' }}>
                  <img
                    src={featuredArticle.image || DEFAULT_BLOG_FALLBACK}
                    alt={`${featuredArticle.title} - Featured Insight`}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      position: 'absolute',
                      inset: 0,
                    }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== DEFAULT_BLOG_FALLBACK && !target.src.endsWith(DEFAULT_BLOG_FALLBACK)) {
                        target.src = DEFAULT_BLOG_FALLBACK;
                      }
                    }}
                  />
                  {/* Cinematic gradient overlay to blend into the card */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to right, rgba(16, 18, 26, 0.1) 0%, rgba(16, 18, 26, 0.85) 100%)',
                      pointerEvents: 'none',
                    }}
                    className="d-none d-lg-block"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(16, 18, 26, 0.95) 0%, rgba(16, 18, 26, 0.2) 100%)',
                      pointerEvents: 'none',
                    }}
                    className="d-block d-lg-none"
                  />

                  {/* Top Left Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      zIndex: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(7, 8, 10, 0.88)',
                      border: '1px solid rgba(212, 0, 39, 0.5)',
                      color: '#ffffff',
                      padding: '5px 14px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <FaBolt size={10} style={{ color: '#d40027' }} />
                    <span>Featured Deep Dive</span>
                  </div>
                </div>

                {/* Right/Bottom: Content Column */}
                <div className="col-lg-6 col-12 d-flex flex-column justify-content-between p-4 p-md-5">
                  <div>
                    {/* Metadata Row */}
                    <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                      {featuredArticle.category && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#00f2fe',
                            background: 'rgba(0, 242, 254, 0.08)',
                            border: '1px solid rgba(0, 242, 254, 0.25)',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                          }}
                        >
                          {featuredArticle.category}
                        </span>
                      )}
                      {featuredArticle.date && (
                        <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)' }}>
                          <FaCalendarDays size={11} style={{ color: '#d40027' }} />
                          {featuredArticle.date}
                        </span>
                      )}
                      <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)' }}>
                        <FaClock size={11} style={{ color: '#d40027' }} />
                        {featuredArticle.readMins} read
                      </span>
                    </div>

                    {/* Headline */}
                    <h3
                      style={{
                        fontSize: 'clamp(22px, 2.5vw, 32px)',
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1.3,
                        marginBottom: '16px',
                      }}
                    >
                      {featuredArticle.title}
                    </h3>

                    {/* Excerpt */}
                    <p
                      style={{
                        fontSize: '14.5px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineHeight: 1.65,
                        marginBottom: '24px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {featuredArticle.description}
                    </p>
                  </div>

                  {/* Card Footer: Author + CTA */}
                  <div
                    className="pt-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
                    style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={featuredArticle.author?.avatar || DEFAULT_AUTHOR_AVATAR}
                        alt={featuredArticle.author?.name || 'Prince'}
                        loading="lazy"
                        decoding="async"
                        width="40"
                        height="40"
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1.5px solid rgba(212, 0, 39, 0.6)',
                        }}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (target.src !== DEFAULT_AUTHOR_AVATAR) {
                            target.src = DEFAULT_AUTHOR_AVATAR;
                          }
                        }}
                      />
                      <div>
                        <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>
                          {featuredArticle.author?.name || 'Prince'}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '11.5px' }}>
                          {featuredArticle.author?.role || 'Senior Full Stack Engineer'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill"
                      style={{
                        background: '#d40027',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        boxShadow: '0 4px 20px rgba(212, 0, 39, 0.4)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>Read Deep Dive</span>
                      <FaArrowRight size={11} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* 2. THREE COMPANION EDITORIAL CARDS (Clean, Razor-Thin Agency Cards) */}
        {companionArticles.length > 0 && (
          <div className="row g-4 mb-4">
            {companionArticles.map((article) => (
              <div key={article.slug} className="col-lg-4 col-md-6 col-12 d-flex">
                <Link
                  href={`/insights/${article.slug}/`}
                  onClick={(e) => handleArticleClick(article.slug, e)}
                  className="editorial-companion-card w-100 text-decoration-none d-flex flex-column justify-content-between rounded-4 overflow-hidden agency-card-dark"
                  style={{
                    background: '#07080a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', width: '100%', height: '190px', background: '#0e1017', overflow: 'hidden' }}>
                    <img
                      src={article.image || DEFAULT_BLOG_FALLBACK}
                      alt={`${article.title} - Engineering Insight`}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.4s ease',
                      }}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== DEFAULT_BLOG_FALLBACK && !target.src.endsWith(DEFAULT_BLOG_FALLBACK)) {
                          target.src = DEFAULT_BLOG_FALLBACK;
                        }
                      }}
                    />
                    {article.category && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#ffffff',
                          background: 'rgba(7, 8, 10, 0.85)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {article.category}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 d-flex flex-column justify-content-between flex-grow-1">
                    <div>
                      <div className="d-flex align-items-center gap-3 mb-2" style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        <span className="d-inline-flex align-items-center gap-1">
                          <FaClock size={10} style={{ color: '#d40027' }} />
                          {article.readMins} read
                        </span>
                        {article.date && <span>{article.date}</span>}
                      </div>

                      <h4
                        style={{
                          fontSize: '17px',
                          fontWeight: 700,
                          color: '#ffffff',
                          lineHeight: 1.35,
                          marginBottom: '10px',
                        }}
                      >
                        {article.title}
                      </h4>

                      <p
                        style={{
                          fontSize: '13px',
                          color: 'rgba(255, 255, 255, 0.65)',
                          lineHeight: 1.55,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {article.description}
                      </p>
                    </div>

                    <div
                      className="pt-3 mt-3 d-flex align-items-center justify-content-between"
                      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
                    >
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>
                        Read Article
                      </span>
                      <FaArrowRight size={11} style={{ color: '#00f2fe' }} />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Discovery Link */}
        <div className="text-center pt-3">
          <Link
            href="/insights/"
            className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill text-decoration-none"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '13.5px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            <span>Explore All {displayArticles.length} Architecture Insights</span>
            <FaArrowRight size={12} style={{ color: '#d40027' }} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;
