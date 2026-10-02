import React, { useState, useEffect, useRef } from 'react';
import { articlesList, Article } from '../data/siteContent';
import {
  FaArrowLeft,
  FaClock,
  FaCalendarDays,
  FaUser,
  FaHeart,
  FaShareNodes,
  FaLinkedinIn,
  FaXTwitter,
  FaWhatsapp,
  FaCheck,
  FaLightbulb,
  FaBookmark,
} from 'react-icons/fa6';

export interface SingleBlogPageProps {
  slug: string;
  onNavigateHome: () => void;
  onNavigateArticles: () => void;
  onSelectArticle: (slug: string) => void;
}

export const SingleBlogPage: React.FC<SingleBlogPageProps> = ({
  slug,
  onNavigateHome,
  onNavigateArticles,
  onSelectArticle,
}) => {
  // Find article matching slug or default to first
  const article: Article =
    articlesList.find((a) => a.slug === slug) || articlesList[0];

  // Persistent dynamic likes with localStorage
  const storageKey = `heyprince_likes_${article.slug}`;
  const [likes, setLikes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) : 42;
    } catch {
      return 42;
    }
  });

  const [hasLiked, setHasLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${storageKey}_user`) === 'true';
    } catch {
      return false;
    }
  });

  const [copied, setCopied] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Filter dynamic related articles (excluding current article)
  const relatedArticles = articlesList.filter((a) => a.slug !== article.slug).slice(0, 3);

  // CRITICAL: Scroll immediately to top on mount and whenever slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slug]);

  // High-performance GPU-accelerated scroll reading progress indicator
  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
      const clamped = Math.min(1, Math.max(0, progress));
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${clamped})`;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [slug]);

  const handleLike = () => {
    if (hasLiked) {
      const newCount = likes - 1;
      setLikes(newCount);
      setHasLiked(false);
      try {
        localStorage.setItem(storageKey, newCount.toString());
        localStorage.setItem(`${storageKey}_user`, 'false');
      } catch {}
    } else {
      const newCount = likes + 1;
      setLikes(newCount);
      setHasLiked(true);
      try {
        localStorage.setItem(storageKey, newCount.toString());
        localStorage.setItem(`${storageKey}_user`, 'true');
      } catch {}
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareUrl = encodeURIComponent(currentUrl);
  const shareText = encodeURIComponent(`${article.title} — By Prince`);

  return (
    <article className="single-blog-page">
      {/* Top Reading Progress Bar */}
      <div
        ref={progressBarRef}
        className="reading-progress-bar"
        aria-hidden="true"
      />

      <div className="container">
        {/* Navigation & Breadcrumbs */}
        <div className="blog-header-nav">
          <button
            type="button"
            className="btn-back-home"
            onClick={onNavigateArticles}
            aria-label="Back to Articles"
          >
            <FaArrowLeft />
            <span>Back to Articles</span>
          </button>

          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
            >
              Home
            </a>
            <span className="breadcrumb-sep">/</span>
            <a
              href="/#articles"
              onClick={(e) => {
                e.preventDefault();
                onNavigateArticles();
              }}
            >
              Insights
            </a>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{article.title.slice(0, 32)}...</span>
          </nav>
        </div>

        {/* Article Hero */}
        <header className="blog-hero text-center">
          <span className="blog-tag-badge">
            {article.category || (article.tags && article.tags[0]) || 'Tech Insight'}
          </span>
          <h1 className="blog-main-title">{article.title}</h1>

          <div className="blog-meta-row justify-content-center">
            <div className="meta-item">
              <FaUser size={14} />
              <span>{article.author?.name || 'Prince'}</span>
            </div>
            <div className="meta-item">
              <FaCalendarDays size={14} />
              <span>{article.date || '2026 Edition'}</span>
            </div>
            <div className="meta-item">
              <FaClock size={14} />
              <span>{article.readMins} Read</span>
            </div>
            <div className="meta-item">
              <FaBookmark size={14} />
              <span>Verified Tech Guide</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="blog-featured-img-wrap">
          <img
            src={article.image}
            alt={article.title}
            className="blog-featured-img"
          />
        </div>

        {/* Article Body Content */}
        <div className="blog-content-layout">
          <div className="blog-main-body">
            {/* Intro Lead */}
            <p
              className="lead-paragraph"
              style={{
                fontSize: '20px',
                lineHeight: 1.75,
                color: '#e2e2e8',
                marginBottom: '36px',
                fontWeight: 400,
              }}
            >
              {article.description}
            </p>

            {/* Dynamic Structured Sections */}
            {article.sections && article.sections.length > 0 ? (
              article.sections.map((section, idx) => (
                <section className="blog-section-block" key={idx}>
                  <h2 className="blog-section-heading">{section.heading}</h2>

                  {section.paragraphs &&
                    section.paragraphs.map((p, pIdx) => (
                      <p className="blog-paragraph" key={pIdx}>
                        {p}
                      </p>
                    ))}

                  {/* Bullet Highlights */}
                  {section.bulletPoints && section.bulletPoints.length > 0 && (
                    <ul className="blog-key-points-list">
                      {section.bulletPoints.map((pt, ptIdx) => (
                        <li key={ptIdx}>
                          <span className="point-bullet">
                            <FaCheck />
                          </span>
                          <span className="point-text">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Pull Quote */}
                  {section.quote && (
                    <blockquote className="blog-pullquote">
                      &ldquo;{section.quote}&rdquo;
                    </blockquote>
                  )}

                  {/* Pro Tip Callout Box */}
                  {section.proTip && (
                    <aside className="blog-pro-tip">
                      <div className="tip-icon">
                        <FaLightbulb />
                      </div>
                      <div className="tip-content">
                        <strong>PRO TIP: </strong>
                        {section.proTip}
                      </div>
                    </aside>
                  )}
                </section>
              ))
            ) : (
              <section className="blog-section-block">
                <h2 className="blog-section-heading">Architectural Overview</h2>
                <p className="blog-paragraph">
                  Modern engineering demands an uncompromising balance of blistering execution speed,
                  accessibility, and maintainable software patterns. Prioritize modular components and
                  streamlined assets to deliver uncompromised digital experiences.
                </p>
              </section>
            )}

            {/* Article Footer & Dynamic Tags */}
            <footer className="blog-article-footer">
              <div className="article-tags-wrap">
                {article.tags &&
                  article.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="blog-tag-pill">
                      #{tag}
                    </span>
                  ))}
              </div>

              {/* Social Interactions */}
              <div className="article-social-actions">
                <button
                  type="button"
                  className={`like-btn ${hasLiked ? 'liked' : ''}`}
                  onClick={handleLike}
                  aria-label={hasLiked ? 'Unlike article' : 'Like article'}
                >
                  <FaHeart color={hasLiked ? '#d40027' : '#ffffff'} />
                  <span>{likes} Likes</span>
                </button>

                <div className="share-links-group">
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginRight: '6px' }}>
                    Share:
                  </span>
                  <a
                    className="share-btn twitter"
                    href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on X"
                  >
                    <FaXTwitter size={14} />
                  </a>
                  <a
                    className="share-btn whatsapp"
                    href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on WhatsApp"
                  >
                    <FaWhatsapp size={14} />
                  </a>
                  <a
                    className="share-btn linkedin"
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on LinkedIn"
                  >
                    <FaLinkedinIn size={14} />
                  </a>
                  <button
                    type="button"
                    className={`share-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopyLink}
                    title="Copy article link"
                    aria-label="Copy link"
                  >
                    <FaShareNodes size={14} />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </footer>

            {/* Dynamic Author Bio Box */}
            <aside className="author-bio-card">
              <img
                src={
                  article.author?.avatar ||
                  'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp'
                }
                alt={article.author?.name || 'Prince'}
                className="author-avatar"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="author-info">
                <h4>{article.author?.name || 'Prince'}</h4>
                <p className="author-title">
                  {article.author?.role || 'Full-Stack Web Developer & IT Consultant'}
                </p>
                <p className="author-bio">
                  I design and engineer lightning-fast digital products with clean code, modern UX, and
                  robust architectures. Dedicated to building scalable web applications and sharing practical
                  engineering discoveries.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Dynamic Related Posts Section */}
        {relatedArticles.length > 0 && (
          <section className="related-posts-section">
            <h3 className="related-title">Continue Reading</h3>
            <div className="related-grid">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.slug}
                  className="related-card"
                  onClick={() => onSelectArticle(rel.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectArticle(rel.slug);
                  }}
                >
                  <div className="related-img-wrap">
                    <img src={rel.image} alt={rel.title} className="related-img" />
                  </div>
                  <div className="related-body">
                    <span className="related-mins">{rel.readMins} Read</span>
                    <h4 className="related-post-title">{rel.title}</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      {rel.description.slice(0, 90)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default SingleBlogPage;
