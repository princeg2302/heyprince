import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { getPosts } from '@/lib/cms';
import { FaArrowLeft, FaRocket } from 'react-icons/fa6';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Engineering Insights & Architectural Essays | HeyPrince',
  description:
    'In-depth engineering breakdowns, web performance guides, software architecture insights, and IT provider selection frameworks by Prince.',
  keywords: [
    'Web Engineering Articles',
    'Frontend Performance Tips',
    'Next.js Best Practices',
    'IT Consulting Insights',
    'Freelancing Tips IT Professionals',
    'Core Web Vitals Optimization',
    'Software Architecture Articles',
    'Prince IT Partner',
    'HeyPrince Insights',
  ],
  alternates: {
    canonical: 'https://heyprince.in/insights/',
  },
  openGraph: {
    title: 'Engineering Insights & Architectural Essays | HeyPrince',
    description:
      'In-depth engineering breakdowns, web performance guides, and IT consulting insights by Prince.',
    url: 'https://heyprince.in/insights/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Engineering Insights & Architectural Essays | HeyPrince',
    description:
      'In-depth engineering breakdowns, web performance guides, and IT consulting insights by Prince.',
  },
};

export default async function InsightsListingPage() {
  const posts = await getPosts();

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'HeyPrince Engineering Insights',
    description:
      'Technical engineering essays, performance audits, and software consulting perspectives by Prince.',
    url: 'https://heyprince.in/insights/',
    publisher: {
      '@type': 'Person',
      name: 'Prince',
      url: 'https://heyprince.in/',
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: `https://heyprince.in/insights/${post.slug}/`,
      datePublished: post.date,
      image: post.image.startsWith('http') ? post.image : `https://heyprince.in${post.image}`,
      author: {
        '@type': 'Person',
        name: post.author?.name || 'Prince',
      },
    })),
  };

  return (
    <div className="page-view-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <article className="single-service-view" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
        <div className="container">
          {/* Top Navigation & Breadcrumb */}
          <div className="blog-header-nav">
            <Link href="/" className="btn-back-home" aria-label="Back to Home">
              <FaArrowLeft />
              <span>Back to Home</span>
            </Link>

            <nav className="blog-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Insights</span>
            </nav>
          </div>

          {/* Hero Header */}
          <header className="service-hero-content text-center mb-5">
            <div className="featured-service-pill">
              <span className="live-pulse-dot"></span>
              <span>ENGINEERING INSIGHTS &amp; ESSAYS // 2026</span>
            </div>

            <div className="service-category-tag">Field Notes &amp; Technical Breakdowns</div>

            <h1 className="service-main-title">
              Read This Between{' '}
              <span className="word text-red" suppressHydrationWarning>
                <span suppressHydrationWarning>B</span>
                <span suppressHydrationWarning>i</span>
                <span suppressHydrationWarning>T</span>
                <span suppressHydrationWarning>e</span>
                <span suppressHydrationWarning>S</span>
              </span>
            </h1>

            <p className="service-tagline-lead">
              In-depth engineering breakdowns, web performance benchmarks, IT vendor selection frameworks, and career insights. Actionable strategies, real production benchmarks, and architectural wisdom for modern teams.
            </p>
          </header>

          {/* Articles Grid (Using Exact Site Styling) */}
          <div className="row g-4 justify-content-center">
            {posts.map((post) => (
              <div key={post.slug} className="col-lg-4 col-md-6 col-12 d-flex">
                <div className="card article-card insight-card w-100 d-flex flex-column" style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                  <Link
                    className="insight-card-link d-flex flex-column h-100"
                    href={`/insights/${post.slug}/`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden', background: '#13151f' }}>
                      <img
                        className="card-img"
                        src={post.image}
                        alt={`${post.title} - Engineering Insight by Prince`}
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="card-body d-flex flex-column flex-grow-1 p-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="read-mins" style={{ fontSize: '12px', color: '#d40027', fontWeight: 700 }}>
                          {post.readMins} read
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {post.category || 'Engineering'}
                        </span>
                      </div>
                      <h2
                        className="card-title"
                        style={{
                          fontSize: '20px',
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
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          lineHeight: 1.6,
                          marginBottom: '20px',
                          flex: '1 0 auto',
                        }}
                      >
                        {post.description}
                      </p>
                      <div className="mt-auto pt-2">
                        <span className="read-more-link" style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          Read Full Story &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Call to Action */}
          <div className="text-center mt-5 pt-4">
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
              Want to Discuss an Engineering Challenge?
            </h2>
            <p style={{ maxWidth: '600px', margin: '0 auto 28px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Looking for a technical partner to audit your stack, architect your web application, or deploy custom AI pipelines? Let’s chat.
            </p>
            <Link className="portal-btn mx-auto" href="/contact/">
              <span className="mr-right">Start a Conversation</span>
              <span className="arrow">
                <FaRocket size={15} color="#000" />
              </span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

