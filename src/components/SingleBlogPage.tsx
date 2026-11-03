'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { articlesList, Article } from '../data/siteContent';
import {
  FaArrowLeft,
  FaArrowRight,
  FaClock,
  FaCalendarDays,
  FaHeart,
  FaShareNodes,
  FaLinkedinIn,
  FaInstagram,
  FaWhatsapp,
  FaCheck,
  FaLightbulb,
  FaBookmark,
  FaListUl,
  FaCircleCheck,
  FaFolderOpen,
  FaRegComments,
} from 'react-icons/fa6';
import { DiscussionSection, CommentItem } from './discussions/DiscussionSection';

export interface SingleBlogPageProps {
  slug: string;
  post?: Article;
  initialComments?: CommentItem[];
  initialCommentCount?: number;
  initialLikes?: number;
  onNavigateHome?: () => void;
  onNavigateArticles?: () => void;
  onSelectArticle?: (slug: string) => void;
  onNavigateContact?: () => void;
}

export const SingleBlogPage: React.FC<SingleBlogPageProps> = ({
  slug,
  post,
  initialComments = [],
  initialCommentCount,
  initialLikes,
  onNavigateHome,
  onNavigateArticles,
  onSelectArticle,
  onNavigateContact,
}) => {
  const router = useRouter();

  const handleHome = () => {
    if (onNavigateHome) onNavigateHome();
    else router.push('/');
  };

  const handleArticles = () => {
    if (onNavigateArticles) onNavigateArticles();
    else router.push('/insights');
  };

  const handleSelectArticle = (newSlug: string) => {
    if (onSelectArticle) onSelectArticle(newSlug);
    else router.push(`/insights/${newSlug}/`);
  };

  const handleContact = () => {
    if (onNavigateContact) onNavigateContact();
    else router.push('/contact/');
  };

  // Find article matching slug or default to passed post or first
  const article: Article =
    post || articlesList.find((a) => a.slug === slug) || articlesList[0];

  const DEFAULT_AUTHOR_AVATAR =
    'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg';

  const [authorAvatar, setAuthorAvatar] = useState<string>(
    article.author?.avatar || DEFAULT_AUTHOR_AVATAR
  );
  const [authorName, setAuthorName] = useState<string>(
    article.author?.name || 'Prince'
  );
  const [authorRole, setAuthorRole] = useState<string>(
    article.author?.role || 'Senior Full Stack Engineer & IT Consultant'
  );

  useEffect(() => {
    if (article.author?.avatar) setAuthorAvatar(article.author.avatar);
    if (article.author?.name) setAuthorName(article.author.name);
    if (article.author?.role) setAuthorRole(article.author.role);
  }, [article.author?.avatar, article.author?.name, article.author?.role]);

  // Live dynamic hydration from /api/author for real-time profile picture sync
  useEffect(() => {
    let isMounted = true;
    fetch('/api/author', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data) {
          if (data.avatar) setAuthorAvatar(data.avatar);
          if (data.name) setAuthorName(data.name);
          if (data.role) setAuthorRole(data.role);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Live dynamic social links hydration from /api/social-links
  const [socialLinks, setSocialLinks] = useState<{
    linkedin?: string;
    instagram?: string;
    whatsapp?: string;
    github?: string;
  }>({
    linkedin: 'https://www.linkedin.com/in/mr-goyal/',
    instagram: 'https://www.instagram.com/heyprince.in/',
    whatsapp: 'https://wa.me/919120900010',
    github: 'https://github.com/princeg2302',
  });

  useEffect(() => {
    let isMounted = true;
    fetch('/api/social-links', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data.socialLinks) {
          setSocialLinks((prev) => ({
            ...prev,
            ...data.socialLinks,
          }));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time dynamic blog likes backed by Supabase PostgreSQL
  const [likes, setLikes] = useState<number>(initialLikes ?? 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/blog/likes?slug=${encodeURIComponent(article.slug)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setLikes(data.count ?? 0);
          setHasLiked(Boolean(data.hasLiked));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [article.slug]);

  const [copied, setCopied] = useState(false);
  const [readProgressPct, setReadProgressPct] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Filter dynamic related articles (excluding current article)
  const relatedArticles = articlesList.filter((a) => a.slug !== article.slug).slice(0, 3);

  // Derive Table of Contents from structured sections
  const sectionsList = useMemo(() => {
    if (!article.sections || article.sections.length === 0) return [];
    return article.sections.map((sec, idx) => ({
      id: `section-${idx + 1}`,
      rawHeading: sec.heading,
      title: sec.heading.replace(/^\d+[\.\)]\s*/, '').trim(),
    }));
  }, [article.sections]);

  // Scroll-Spy for Table of Contents
  const [activeSection, setActiveSection] = useState<string>(
    sectionsList.length > 0 ? sectionsList[0].id : ''
  );

  // Extract distinct categories and counts from all published articles
  const categoriesMap = useMemo(() => {
    const map: Record<string, number> = {};
    articlesList.forEach((a) => {
      const cat = a.category || (a.tags && a.tags[0]) || 'Tech Insights';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  // Scroll immediately to top on mount before paint and whenever slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slug]);

  // High-performance GPU-accelerated scroll reading progress & TOC tracking
  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
      const clamped = Math.min(1, Math.max(0, progress));
      setReadProgressPct(clamped * 100);

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${clamped})`;
      }

      // Track active section for TOC scroll-spy
      if (sectionsList.length > 0) {
        const scrollPos = window.scrollY + 180;
        let current = sectionsList[0].id;
        for (const sec of sectionsList) {
          const el = document.getElementById(sec.id);
          if (el && el.offsetTop <= scrollPos) {
            current = sec.id;
          }
        }
        setActiveSection(current);
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
  }, [slug, sectionsList]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 110;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/insights?category=${encodeURIComponent(categoryName)}`);
  };

  const handleLike = async () => {
    // Optimistic UI toggle
    const nextState = !hasLiked;
    const nextCount = nextState ? likes + 1 : Math.max(0, likes - 1);
    setHasLiked(nextState);
    setLikes(nextCount);

    try {
      const res = await fetch('/api/blog/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: article.slug }),
      });
      const data = await res.json();
      if (data.success) {
        setLikes(data.count);
        setHasLiked(data.hasLiked);
      }
    } catch {
      // Rollback on network failure
      setHasLiked(!nextState);
      setLikes(likes);
    }
  };

  const handleCopyLink = () => {
    const urlToCopy =
      typeof window !== 'undefined'
        ? window.location.href
        : `https://heyprince.in/insights/${article.slug}/`;
    if (navigator?.clipboard) {
      navigator.clipboard
        .writeText(urlToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  const canonicalUrl = `https://heyprince.in/insights/${article.slug}/`;
  const shareUrl = encodeURIComponent(canonicalUrl);
  const shareText = encodeURIComponent(`${article.title} — By Prince`);

  const renderFormattedText = (text: string) => {
    if (!text) return null;

    // Pattern 1: Source citation format "Publisher/Title — URL" or "Title -- URL"
    const sourceMatch = text.match(/^(.*?)\s*(?:—|--)\s*(https?:\/\/[^\s]+)$/);
    if (sourceMatch) {
      const title = sourceMatch[1].trim();
      const rawUrl = sourceMatch[2].trim();
      let domain = '';
      try {
        domain = new URL(rawUrl).hostname.replace('www.', '');
      } catch {}

      return (
        <span className="blog-source-citation">
          <span className="source-citation-text">{title}</span>
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="blog-source-badge"
            title={`Open source: ${rawUrl}`}
          >
            <span>{domain ? `${domain} ↗` : 'Source ↗'}</span>
          </a>
        </span>
      );
    }

    // Pattern 2: Tokenize markdown links [label](url) and bare URLs
    const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }

      if (match[0].startsWith('[')) {
        // Markdown link
        const label = match[2];
        const url = match[3];
        const isContact = url.startsWith('/contact');
        const matchedArticle = articlesList.find((a) => url.includes(a.slug));
        const isExternal = url.startsWith('http://') || url.startsWith('https://');

        if (isExternal) {
          parts.push(
            <a
              key={match.index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="blog-inline-link blog-external-link"
              title={url}
            >
              <span>{label}</span>
              <span className="link-ext-arrow" aria-hidden="true"> ↗</span>
            </a>
          );
        } else {
          parts.push(
            <a
              key={match.index}
              href={url}
              className="blog-inline-link"
              onClick={(e) => {
                if (isContact) {
                  e.preventDefault();
                  handleContact();
                } else if (matchedArticle) {
                  e.preventDefault();
                  handleSelectArticle(matchedArticle.slug);
                }
              }}
            >
              {label}
            </a>
          );
        }
      } else {
        // Bare URL
        const rawUrl = match[0];
        let display = rawUrl;
        try {
          const u = new URL(rawUrl);
          const domain = u.hostname.replace('www.', '');
          display = domain + (u.pathname.length > 22 ? u.pathname.slice(0, 22) + '…' : u.pathname);
        } catch {}

        parts.push(
          <a
            key={match.index}
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="blog-inline-link blog-bare-url"
            title={rawUrl}
          >
            <span>{display}</span>
            <span className="link-ext-arrow" aria-hidden="true"> ↗</span>
          </a>
        );
      }

      lastIdx = tokenRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  const totalCommentCount =
    initialCommentCount ?? (initialComments ? initialComments.length : 0);

  return (
    <article className="single-blog-page">
      {/* Top Reading Progress Bar */}
      <div
        ref={progressBarRef}
        className="reading-progress-bar"
        aria-hidden="true"
      />

      <div className="container blog-page-container">
        {/* Navigation & Breadcrumbs */}
        <div className="blog-header-nav">
          <button
            type="button"
            className="btn-back-home"
            onClick={handleArticles}
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
                handleHome();
              }}
            >
              Home
            </a>
            <span className="breadcrumb-sep">/</span>
            <a
              href="/insights"
              onClick={(e) => {
                e.preventDefault();
                handleArticles();
              }}
            >
              Insights
            </a>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current" title={article.title}>
              {article.title}
            </span>
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
              <img
                src={authorAvatar}
                alt={authorName}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== DEFAULT_AUTHOR_AVATAR) {
                    target.src = DEFAULT_AUTHOR_AVATAR;
                  }
                }}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'inline-block',
                }}
              />
              <span>{authorName}</span>
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
            alt={`${article.title} - Article by Prince`}
            className="blog-featured-img"
            fetchPriority="high"
            decoding="async"
            width="1200"
            height="630"
          />
        </div>

        {/* ===================================================================== */}
        {/* 3-COLUMN RESPONSIVE LAYOUT GRID: Left TOC | Center Main | Right Author */}
        {/* ===================================================================== */}
        <div className="blog-layout-grid">
          {/* 1. LEFT STICKY SIDEBAR: Table of Contents & Progress */}
          <aside className="blog-sidebar-left" aria-label="Table of Contents">
            <div className="sticky-rail-box">
              {sectionsList.length > 0 && (
                <div className="sidebar-widget toc-sidebar-widget">
                  <div className="widget-header">
                    <FaListUl className="widget-icon" />
                    <h4 className="widget-title">Table of Contents</h4>
                  </div>

                  <nav className="toc-nav" aria-label="Article sections">
                    <ul className="toc-list">
                      {sectionsList.map((sec, idx) => (
                        <li
                          key={sec.id}
                          className={`toc-item ${activeSection === sec.id ? 'active' : ''}`}
                        >
                          <a
                            href={`#${sec.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToSection(sec.id);
                            }}
                            className="toc-link"
                          >
                            <span className="toc-step">{idx + 1}</span>
                            <span className="toc-title">{sec.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* Reading Progress Gauge */}
                  <div className="toc-reading-progress">
                    <div className="toc-progress-labels">
                      <span>Reading Progress</span>
                      <span className="toc-progress-pct">{Math.round(readProgressPct)}%</span>
                    </div>
                    <div className="toc-progress-bar-bg">
                      <div
                        className="toc-progress-bar-fill"
                        style={{ width: `${Math.round(readProgressPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Jump to Community Comments */}
                  <a
                    href="#discussion-section"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('discussion-section');
                    }}
                    className="toc-discuss-jump-btn"
                  >
                    <FaRegComments size={14} />
                    <span>Join Discussion</span>
                    <span className="discuss-count-badge">{totalCommentCount}</span>
                  </a>
                </div>
              )}
            </div>
          </aside>

          {/* 2. CENTER MAIN COLUMN: Article Content & Live Discussion */}
          <main className="blog-main-content">
            {/* Intro Lead */}
            <p className="lead-paragraph">
              {article.description}
            </p>

            {/* Dynamic Structured Sections */}
            {article.sections && article.sections.length > 0 ? (
              article.sections.map((section, idx) => {
                const secId = `section-${idx + 1}`;
                return (
                  <section className="blog-section-block" id={secId} key={idx}>
                    <h2 className="blog-section-heading">
                      <a
                        href={`#${secId}`}
                        className="heading-anchor-link"
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(secId);
                        }}
                      >
                        {section.heading}
                      </a>
                    </h2>

                    {section.paragraphs &&
                      section.paragraphs.map((p, pIdx) => {
                        const trimmed = p.trim();
                        const imgMatch = trimmed.match(
                          /^!\[([^\]]*)\]\(([^)"\s]+)(?:\s+"([^"]*)")?\)$/
                        );
                        if (imgMatch) {
                          const altText = imgMatch[1];
                          const srcUrl = imgMatch[2];
                          const captionText = imgMatch[3] || altText;

                          // Defensive deduplication
                          if (
                            article.image &&
                            (srcUrl.trim().toLowerCase() === article.image.trim().toLowerCase() ||
                              srcUrl.split('?')[0] === article.image.split('?')[0])
                          ) {
                            return null;
                          }

                          return (
                            <figure className="blog-content-image-wrap" key={pIdx}>
                              <img
                                src={srcUrl}
                                alt={altText || article.title}
                                className="blog-content-image"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              {captionText && (
                                <figcaption className="blog-content-image-caption">
                                  <span>✦</span> {captionText}
                                </figcaption>
                              )}
                            </figure>
                          );
                        }

                        return (
                          <p className="blog-paragraph" key={pIdx}>
                            {renderFormattedText(p)}
                          </p>
                        );
                      })}

                    {/* Bullet Highlights */}
                    {section.bulletPoints && section.bulletPoints.length > 0 && (
                      <ul className="blog-key-points-list">
                        {section.bulletPoints.map((pt, ptIdx) => (
                          <li key={ptIdx}>
                            <span className="point-bullet">
                              <FaCheck />
                            </span>
                            <span className="point-text">{renderFormattedText(pt)}</span>
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
                          {renderFormattedText(section.proTip)}
                        </div>
                      </aside>
                    )}
                  </section>
                );
              })
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

            {/* In-Article Consultation & Tech Partner Callout Banner */}
            <aside className="article-consult-banner">
              <div className="consult-banner-content">
                <span className="consult-pill">High-Performance IT Engineering</span>
                <h3>Need an Experienced Full-Stack Tech Partner?</h3>
                <p>
                  Prince collaborates with ambitious businesses and founders to engineer scalable React applications,
                  optimize Core Web Vitals, and build custom software architectures that convert.
                </p>
              </div>
              <a
                href="/contact"
                className="consult-cta-btn"
                onClick={(e) => {
                  e.preventDefault();
                  handleContact();
                }}
              >
                <span>Schedule a Consultation</span>
                <FaArrowRight size={14} />
              </a>
            </aside>

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
                    className="share-btn instagram"
                    href={socialLinks.instagram || 'https://www.instagram.com/heyprince.in/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram @heyprince.in"
                    title="Instagram @heyprince.in"
                  >
                    <FaInstagram size={14} />
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

            {/* Live Discussion & Threaded Community Replies Component */}
            <DiscussionSection
              slug={article.slug}
              postTitle={article.title}
              initialComments={initialComments}
              initialCount={initialCommentCount}
            />
          </main>

          {/* 3. RIGHT STICKY SIDEBAR: Relocated Author Details + Categories */}
          <aside className="blog-sidebar-right" aria-label="Author and Categories">
            <div className="sticky-rail-box">
              {/* Relocated & Redesigned Author Component */}
              <div className="sidebar-widget author-sidebar-widget">
                <div className="author-sidebar-header">
                  <div className="author-avatar-container">
                    <img
                      src={authorAvatar}
                      alt={`${authorName} - ${authorRole}`}
                      className="author-sidebar-avatar"
                      loading="lazy"
                      decoding="async"
                      width="76"
                      height="76"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== DEFAULT_AUTHOR_AVATAR) {
                          target.src = DEFAULT_AUTHOR_AVATAR;
                        }
                      }}
                    />
                    <span className="author-online-indicator" title="Available for advisory" />
                  </div>
                  <div className="author-identity">
                    <div className="author-name-row">
                      <h4 className="author-sidebar-name">{authorName}</h4>
                      <FaCircleCheck className="author-verified-icon" title="Verified Tech Partner" />
                    </div>
                    <p className="author-sidebar-role">{authorRole}</p>
                    <span className="author-badge-pill">✦ Verified Tech Partner</span>
                  </div>
                </div>

                <p className="author-sidebar-bio">
                  I design and engineer lightning-fast digital products with clean code, modern UX, and
                  robust architectures. Dedicated to building scalable web applications and sharing practical
                  engineering discoveries.
                </p>

                <a
                  href="/contact"
                  className="author-sidebar-cta"
                  onClick={(e) => {
                    e.preventDefault();
                    handleContact();
                  }}
                >
                  <span>Work With Prince</span>
                  <FaArrowRight size={13} />
                </a>

                {/* Quick Author Social Connections */}
                <div className="author-sidebar-socials">
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="author-social-link"
                      title="Connect on LinkedIn"
                      aria-label="LinkedIn"
                    >
                      <FaLinkedinIn size={13} />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="author-social-link"
                      title="Follow on Instagram"
                      aria-label="Instagram"
                    >
                      <FaInstagram size={13} />
                    </a>
                  )}
                  {socialLinks.whatsapp && (
                    <a
                      href={
                        socialLinks.whatsapp.startsWith('http')
                          ? socialLinks.whatsapp
                          : `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="author-social-link"
                      title="Chat on WhatsApp"
                      aria-label="WhatsApp"
                    >
                      <FaWhatsapp size={13} />
                    </a>
                  )}
                </div>
              </div>

              {/* Categories Widget */}
              <div className="sidebar-widget categories-sidebar-widget">
                <div className="widget-header">
                  <FaFolderOpen className="widget-icon" />
                  <h4 className="widget-title">Explore Categories</h4>
                </div>
                <p className="widget-subtitle">Discover curated engineering topics & architectural insights</p>
                <div className="categories-list">
                  {categoriesMap.map(([catName, count]) => {
                    const isSelected = article.category === catName;
                    return (
                      <button
                        key={catName}
                        type="button"
                        className={`category-item-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => handleCategoryClick(catName)}
                      >
                        <span className="cat-name">{catName}</span>
                        <span className="cat-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Dynamic Related Posts Section */}
        {relatedArticles.length > 0 && (
          <section className="related-posts-section">
            <h3 className="related-title">Continue Reading</h3>
            <div className="related-grid">
              {relatedArticles.map((rel) => (
                <a
                  key={rel.slug}
                  href={`/insights/${rel.slug}/`}
                  className="related-card"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectArticle(rel.slug);
                  }}
                >
                  <div className="related-img-wrap">
                    <img
                      src={rel.image}
                      alt={`${rel.title} - Related Tech Story`}
                      className="related-img"
                      loading="lazy"
                      decoding="async"
                      width="320"
                      height="180"
                    />
                  </div>
                  <div className="related-body">
                    <span className="related-mins">{rel.readMins} Read</span>
                    <h4 className="related-post-title">{rel.title}</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      {rel.description.slice(0, 90)}...
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default SingleBlogPage;
