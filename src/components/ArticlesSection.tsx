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
} from 'react-icons/fa6';
import { Article, articlesList } from '../data/siteContent';

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
          ['.article-spotlight-card', '.article-card', '.articles-discovery-bar'],
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 85%',
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
    <section className="section-articles" id="articles" ref={sectionRef}>
      <div className="container">
        {/* Section Header */}
        <div className="section-heading-group text-center">
          <div className="articles-eyebrow-pill">
            <span className="pulse-dot" />
            <span>ARCHITECTURAL ESSAYS &amp; TECH DISPATCHES // 2026</span>
          </div>

          <h2>
            Read This <br />
            Between{' '}
            <span className="word text-red" suppressHydrationWarning>
              <span suppressHydrationWarning>B</span>
              <span suppressHydrationWarning>i</span>
              <span suppressHydrationWarning>T</span>
              <span suppressHydrationWarning>e</span>
              <span suppressHydrationWarning>S</span>
            </span>
          </h2>
          <p>
            In-depth engineering breakdowns, Next-Gen AI developments, IT strategy playbooks, and unfiltered developer culture essays. Actionable blueprints and architectural wisdom for modern engineering teams.
          </p>

          <Link
            className="portal-btn mx-auto"
            href="/insights/"
            onClick={(e) => handleArticleClick(featuredArticle?.slug || 'freelancing-tips-it-professionals-2026', e)}
          >
            <span className="mr-right">Stories Worth Scrolling ({displayArticles.length})</span>
            <span className="arrow">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="white" />
                <path
                  d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                  fill="#000"
                />
              </svg>
            </span>
          </Link>
        </div>

        {/* Modern Showcase Container */}
        <div className="article-cards-sliding">
          {/* 1. Hero Spotlight Article (The #1 Latest Post) */}
          {featuredArticle && (
            <article className="article-spotlight-card">
              <Link
                className="spotlight-link"
                href={`/insights/${featuredArticle.slug}/`}
                onClick={(e) => handleArticleClick(featuredArticle.slug, e)}
                aria-label={`Read featured article: ${featuredArticle.title}`}
              >
                <div className="spotlight-img-wrap">
                  <img
                    className="spotlight-img"
                    src={featuredArticle.image}
                    alt={`${featuredArticle.title} - Latest Engineering Insight by Prince`}
                    loading="lazy"
                    decoding="async"
                    width="800"
                    height="500"
                  />
                  <span className="spotlight-badge-latest">
                    <FaBolt size={10} style={{ color: '#ff3355' }} />
                    <span>Latest Drop // 2026</span>
                  </span>
                </div>

                <div className="spotlight-body">
                  <div className="spotlight-meta-row">
                    {featuredArticle.category && (
                      <span className="spotlight-category">
                        {featuredArticle.category}
                      </span>
                    )}
                    {featuredArticle.date && (
                      <span className="spotlight-date">
                        <FaCalendarDays size={11} aria-hidden="true" style={{ color: '#ff3355' }} />
                        {featuredArticle.date}
                      </span>
                    )}
                    <span className="spotlight-read">
                      <FaClock size={11} aria-hidden="true" style={{ color: '#ff3355' }} />
                      {featuredArticle.readMins} read
                    </span>
                  </div>

                  <h3 className="spotlight-title">{featuredArticle.title}</h3>

                  <p className="spotlight-excerpt">{featuredArticle.description}</p>

                  <div className="spotlight-footer">
                    <div className="spotlight-author">
                      <img
                        className="spotlight-author-avatar"
                        src={featuredArticle.author?.avatar || 'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg'}
                        alt={featuredArticle.author?.name || 'Prince'}
                        loading="lazy"
                        decoding="async"
                        width="38"
                        height="38"
                      />
                      <div>
                        <div className="spotlight-author-name">{featuredArticle.author?.name || 'Prince'}</div>
                        <div className="spotlight-author-role">{featuredArticle.author?.role || 'Senior Full Stack Engineer'}</div>
                      </div>
                    </div>

                    <span className="spotlight-cta-btn">
                      Read Deep Dive <FaArrowRight size={11} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          )}

          {/* 2. Companion 3-Column Modern Grid (Next 3 Latest Articles) */}
          {companionArticles.length > 0 && (
            <div className="article-companion-grid">
              {companionArticles.map((article) => (
                <article className="article-card modern-companion-card" key={article.slug}>
                  <Link
                    className="article-link"
                    href={`/insights/${article.slug}/`}
                    onClick={(e) => handleArticleClick(article.slug, e)}
                    aria-label={`Read article: ${article.title}`}
                  >
                    <div className="article-img-wrap">
                      <img
                        className="card-img"
                        src={article.image}
                        alt={`${article.title} - Engineering Insight by Prince`}
                        loading="lazy"
                        decoding="async"
                        width="600"
                        height="375"
                      />
                      {article.category && (
                        <span className="article-category-badge">{article.category}</span>
                      )}
                    </div>

                    <div className="card-body">
                      <div className="article-meta-row">
                        <span className="read-mins">
                          <FaClock size={11} aria-hidden="true" />
                          {article.readMins} read
                        </span>
                        {article.date && <span className="article-date">{article.date}</span>}
                      </div>

                      <h3 className="card-title">{article.title}</h3>

                      <p className="card-content">{article.description}</p>

                      <div className="companion-card-footer">
                        <div className="companion-author">
                          <img
                            className="companion-author-avatar"
                            src={article.author?.avatar || 'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg'}
                            alt={article.author?.name || 'Prince'}
                            width="24"
                            height="24"
                          />
                          <span className="companion-author-name">{article.author?.name || 'Prince'}</span>
                        </div>

                        <span className="read-more-link">
                          Read Story <FaArrowRight size={11} className="arrow-icon" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* 3. Modern Discovery Bar */}
          <div className="articles-discovery-bar">
            <div className="discovery-left">
              <FaBookOpen className="discovery-icon" aria-hidden="true" />
              <span>
                Exploring {displayArticles.length}+ technical breakdowns, AI automations, and IT strategy playbooks.
              </span>
            </div>

            <Link href="/insights/" className="discovery-btn">
              <span>View All Articles &amp; Archive</span>
              <FaArrowRight size={11} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;
