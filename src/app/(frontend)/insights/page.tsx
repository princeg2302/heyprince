import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { getPosts } from '@/lib/cms';
import { FaArrowLeft, FaRocket } from 'react-icons/fa6';
import { InsightsListingClient } from '@/components/InsightsListingClient';

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

          {/* Interactive Articles Grid with Date & Category Filters */}
          <InsightsListingClient initialPosts={posts} />

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

