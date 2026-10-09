import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { getServices } from '@/lib/cms';
import {
  FaArrowLeft,
  FaArrowRight,
  FaStar,
  FaRocket,
  FaBrain,
  FaWordpress,
  FaReact,
  FaPhp,
  FaPython,
  FaMagnifyingGlass,
  FaPalette,
  FaCode,
  FaCheck,
  FaBolt,
  FaShieldHalved,
} from 'react-icons/fa6';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Engineering & Technical Services — Web Architecture & AI | HeyPrince',
  description:
    'Explore high-performance IT consulting, custom Next.js web applications, bespoke WordPress & CMS engineering, enterprise PHP, and autonomous AI automations by Prince.',
  keywords: [
    'IT Consulting Services',
    'Full Stack React Development',
    'Next.js Web Engineering',
    'AI Automations & LLM Pipelines',
    'WordPress Custom Development',
    'Shopify Development',
    'Technical SEO & Performance Audits',
    'Senior IT Consultant India',
    'HeyPrince Services',
  ],
  alternates: {
    canonical: 'https://heyprince.in/services/',
  },
  openGraph: {
    title: 'Engineering & Technical Services — Web Architecture & AI | HeyPrince',
    description:
      'High-performance IT consulting, custom React & Next.js applications, and autonomous AI workflows engineered by Prince.',
    url: 'https://heyprince.in/services/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Engineering & Technical Services — Web Architecture & AI | HeyPrince',
    description:
      'High-performance IT consulting, custom React & Next.js applications, and autonomous AI workflows engineered by Prince.',
  },
};

function renderServiceIcon(iconName: string) {
  switch (iconName) {
    case 'FaBrain':
      return <FaBrain size={26} />;
    case 'FaWordpress':
      return <FaWordpress size={26} />;
    case 'FaReact':
      return <FaReact size={26} />;
    case 'FaPhp':
      return <FaPhp size={26} />;
    case 'FaPython':
      return <FaPython size={26} />;
    case 'FaMagnifyingGlass':
      return <FaMagnifyingGlass size={26} />;
    case 'FaPalette':
      return <FaPalette size={26} />;
    default:
      return <FaCode size={26} />;
  }
}

export default async function ServicesListingPage() {
  const services = await getServices();

  const servicesSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Engineering & Technical Services by Prince',
    description:
      'Specialized software engineering, IT consulting, and AI automation services provided by Prince.',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.title,
        description: service.heroDescription,
        url: `https://heyprince.in/services/${service.slug}/`,
        provider: {
          '@type': 'Person',
          name: 'Prince',
          url: 'https://heyprince.in/',
        },
      },
    })),
  };

  return (
    <div className="page-view-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
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
              <span className="breadcrumb-current">Services</span>
            </nav>
          </div>

          {/* Hero Header */}
          <header className="service-hero-content text-center mb-5">
            <div className="featured-service-pill">
              <span className="live-pulse-dot"></span>
              <span>SPECIALIZED ENGINEERING SUITE // 2026</span>
            </div>

            <div className="service-category-tag">Engineering &amp; Technical Consulting</div>

            <h1 className="service-main-title">
              Architecting High-Speed Solutions That{' '}
              <span className="word text-red" suppressHydrationWarning>
                <span suppressHydrationWarning>S</span>
                <span suppressHydrationWarning>c</span>
                <span suppressHydrationWarning>a</span>
                <span suppressHydrationWarning>l</span>
                <span suppressHydrationWarning>e</span>
              </span>
            </h1>

            <p className="service-tagline-lead">
              From bespoke React &amp; Next.js platforms and enterprise CMS builds to autonomous AI
              reasoning pipelines — explore specialized engineering services built for speed, stability, and measurable business growth.
            </p>
          </header>

          {/* Services Cards Grid */}
          <div className="row g-4 justify-content-center">
            {services.map((service) => {
              const isFeatured = service.isFeatured;
              return (
                <div key={service.slug} className="col-lg-4 col-md-6 col-12 d-flex">
                  <div
                    className="service-card-item w-100 d-flex flex-column"
                    style={{
                      background: isFeatured
                        ? 'radial-gradient(circle at top right, #1b2030 0%, #0d0f15 100%)'
                        : '#0e1017',
                      border: isFeatured
                        ? '1.5px solid rgba(0, 242, 254, 0.55)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '20px',
                      padding: '36px 30px',
                      position: 'relative',
                      boxShadow: isFeatured
                        ? '0 12px 35px rgba(0, 242, 254, 0.15)'
                        : '0 8px 24px rgba(0, 0, 0, 0.35)',
                      transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                    }}
                  >
                    {/* Featured Star Badge */}
                    {isFeatured && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '18px',
                          right: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(0, 242, 254, 0.12)',
                          border: '1px solid rgba(0, 242, 254, 0.45)',
                          color: '#00f2fe',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                        }}
                      >
                        <FaStar size={9} /> FEATURED
                      </div>
                    )}

                    {/* Icon & Category */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '14px',
                          background: isFeatured ? 'rgba(0, 242, 254, 0.12)' : 'rgba(212, 0, 39, 0.12)',
                          border: isFeatured ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(212, 0, 39, 0.3)',
                          color: isFeatured ? '#00f2fe' : '#d40027',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderServiceIcon(service.iconName)}
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            color: '#d40027',
                            textTransform: 'uppercase',
                            display: 'block',
                          }}
                        >
                          {service.category}
                        </span>
                      </div>
                    </div>

                    {/* Service Title */}
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#ffffff',
                        lineHeight: 1.3,
                        marginBottom: '14px',
                      }}
                    >
                      <Link
                        href={`/services/${service.slug}/`}
                        style={{ color: '#ffffff', textDecoration: 'none' }}
                      >
                        {service.title}
                      </Link>
                    </h2>

                    {/* Tagline / Excerpt */}
                    <p
                      style={{
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.72)',
                        lineHeight: 1.6,
                        marginBottom: '22px',
                        flex: '1 0 auto',
                      }}
                    >
                      {service.tagline || service.heroDescription}
                    </p>

                    {/* Tech Stack Chips */}
                    {service.techStack && service.techStack.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-4">
                        {service.techStack.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            style={{
                              fontSize: '11px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontWeight: 500,
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-auto pt-2">
                      <Link
                        href={`/services/${service.slug}/`}
                        className="btn-back-home w-100 justify-content-between"
                        style={{
                          background: isFeatured ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          borderColor: isFeatured ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.14)',
                          color: isFeatured ? '#00f2fe' : '#ffffff',
                          padding: '10px 18px',
                        }}
                      >
                        <span>Explore Service Details</span>
                        <FaArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Standards & Guarantees Strip */}
          <div
            className="my-5 p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '16px',
            }}
          >
            <div className="row g-4 text-center">
              <div className="col-md-3 col-6">
                <div className="d-flex flex-column align-items-center gap-2">
                  <FaBolt size={24} color="#d40027" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    Sub-Second Loading Speed
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    Core Web Vitals 95+ Guarantee
                  </span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="d-flex flex-column align-items-center gap-2">
                  <FaShieldHalved size={24} color="#00f2fe" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    Enterprise Security
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    Zero-Trust architecture &amp; sanitization
                  </span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="d-flex flex-column align-items-center gap-2">
                  <FaCode size={24} color="#d40027" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    100% Bespoke Code
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    No bloat, no generic templates
                  </span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="d-flex flex-column align-items-center gap-2">
                  <FaRocket size={24} color="#00f2fe" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    Global Remote Collaboration
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    US, EU, UK &amp; AU timezone overlap
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="text-center mt-5 pt-3">
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
              Have a Custom Engineering Challenge?
            </h2>
            <p style={{ maxWidth: '600px', margin: '0 auto 28px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Whether you need to scale an enterprise web app, automate business workflows, or audit mission-critical software — let’s architect the right solution.
            </p>
            <Link className="portal-btn mx-auto" href="/contact/">
              <span className="mr-right">Request Project Consultation</span>
              <span className="arrow">
                <FaRocket size={18} color="#000" />
              </span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

