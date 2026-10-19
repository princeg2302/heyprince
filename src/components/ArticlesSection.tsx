'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaClock, FaArrowRight } from 'react-icons/fa6';
import { articlesList } from '../data/siteContent';

export interface ArticlesSectionProps {
  onSelectArticle?: (slug: string) => void;
}

export const ArticlesSection: React.FC<ArticlesSectionProps> = ({ onSelectArticle }) => {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);

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
          '.article-card',
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.5,
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
  }, []);

  const handleArticleClick = (slug: string, e: React.MouseEvent) => {
    if (onSelectArticle) {
      e.preventDefault();
      onSelectArticle(slug);
    }
  };

  return (
    <section className="section-articles" id="articles" ref={sectionRef}>
      <div className="container">
        <div className="section-heading-group text-center">
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
            In-depth engineering breakdowns, web development trends, IT provider selection frameworks, and career insights. Actionable strategies, real production benchmarks, and architectural wisdom for modern teams.
          </p>
          <Link
            className="portal-btn mx-auto"
            href="/insights/freelancing-tips-it-professionals-2026/"
            onClick={(e) => handleArticleClick('freelancing-tips-it-professionals-2026', e)}
          >
            <span className="mr-right">Stories Worth Scrolling</span>
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

        <div className="article-cards-sliding">
          <div className="article-cards-grid">
            {articlesList.map((article) => (
              <article className="article-card" key={article.slug}>
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
                      alt={`${article.title} - IT & Web Engineering Insight by Prince`}
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
                    <span className="read-more-link">
                      Read Full Story <FaArrowRight size={12} className="arrow-icon" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;

