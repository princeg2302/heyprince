import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaRocket,
  FaCode,
  FaLaptopCode,
  FaBrain,
  FaMugHot,
  FaArrowRight,
  FaShieldHalved,
  FaServer,
  FaBolt,
  FaCompass,
  FaHandshake,
  FaLightbulb,
  FaNetworkWired,
  FaChartLine,
  FaCheck,
  FaWhatsapp,
} from 'react-icons/fa6';
import { timelineMilestones } from '@/data/siteContent';

export const metadata: Metadata = {
  title: 'About Prince & HeyPrince | Senior Full Stack IT Consultant & Systems Architect',
  description:
    'Discover the engineering philosophy, background, and technical standards behind HeyPrince. Built by Prince, Senior Full Stack Engineer and IT Consultant.',
  keywords: [
    'About Prince',
    'HeyPrince Engineering',
    'Senior IT Consultant India',
    'Full Stack Engineer',
    'Next.js Architect',
    'AI Systems Engineer',
    'Web Architecture Specialist',
    'HeyPrince Story',
  ],
  alternates: {
    canonical: 'https://heyprince.in/about/',
  },
  openGraph: {
    title: 'About Prince & HeyPrince | Senior Full Stack IT Consultant',
    description:
      'The engineering philosophy, background, and technical standards behind HeyPrince. Building sub-second web platforms and sovereign AI systems.',
    url: 'https://heyprince.in/about/',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Prince & HeyPrince | Senior Full Stack IT Consultant',
    description:
      'The engineering philosophy, background, and technical standards behind HeyPrince. Building sub-second web platforms and sovereign AI systems.',
  },
};

export default function AboutPage() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Prince and HeyPrince',
    description:
      'Personal story, technical background, and engineering philosophy of Prince, Senior Full Stack IT Consultant and founder of HeyPrince.',
    url: 'https://heyprince.in/about/',
    mainEntity: {
      '@type': 'Person',
      name: 'Prince',
      jobTitle: 'Senior Full Stack Engineer & IT Consultant',
      url: 'https://heyprince.in/',
      image: 'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg',
      sameAs: [
        'https://www.linkedin.com/in/mr-goyal/',
        'https://www.instagram.com/heyprince.in/',
        'https://wa.me/919120900010',
      ],
      worksFor: {
        '@type': 'Organization',
        name: 'HeyPrince',
        url: 'https://heyprince.in/',
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://heyprince.in/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'About',
        item: 'https://heyprince.in/about/',
      },
    ],
  };

  return (
    <div className="page-view-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="single-service-view" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
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
              <span className="breadcrumb-current">About HeyPrince</span>
            </nav>
          </div>

          {/* Section 1: Hero Header & Our Story Intro */}
          <header className="service-hero-content text-center mb-5">
            <div className="featured-service-pill">
              <span className="live-pulse-dot"></span>
              <span>SENIOR IT CONSULTANCY // SYSTEMS ARCHITECTURE</span>
            </div>

            <div className="service-category-tag">Behind The Code &amp; Architecture</div>

            <h1 className="service-main-title" style={{ maxWidth: '960px', margin: '0 auto 20px' }}>
              Building Fast, Resilient Software with Direct Senior Ownership
            </h1>

            <p className="service-tagline-lead" style={{ maxWidth: '820px', margin: '0 auto 30px' }}>
              HeyPrince was founded on a simple premise: modern businesses need rock-solid technical execution, sub-second web speed, and intelligent automations without agency bureaucracy or junior delegation.
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link href="/contact/" className="portal-btn">
                <span className="mr-right">Discuss a Project</span>
                <span className="arrow">
                  <FaRocket size={15} color="#000" />
                </span>
              </Link>
              <Link href="/services/" className="btn-back-home" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                <span>Explore Technical Services</span>
                <FaArrowRight size={13} />
              </Link>
            </div>
          </header>

          {/* Section 1 & 2: Our Story and Why HeyPrince Exists */}
          <section className="my-5 p-md-5 p-4" style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
            <div className="row g-4 align-items-center">
              <div className="col-lg-6">
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#d40027', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  Origin &amp; Purpose
                </span>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.3, marginBottom: '20px' }}>
                  1. Our Story &amp; Why HeyPrince Exists
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.8, fontSize: '15px', marginBottom: '16px' }}>
                  My name is Prince. Over the past 8+ years, I have engineered full-stack web applications, architected database clusters, optimized search indexing, and integrated enterprise AI systems. Throughout this journey, I repeatedly watched founders and marketing leaders struggle with the same frustrating agency cycle:
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.8, fontSize: '15px', marginBottom: '16px' }}>
                  Clients would pay premium agency retainers, get pitched by charismatic account directors, and then have their critical code quietly outsourced to untrained interns. The resulting websites were sluggish, weighed down by dozens of unnecessary plugins, and impossible to scale.
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.8, fontSize: '15px', margin: 0 }}>
                  HeyPrince was established to solve this exact bottleneck. When you engage with HeyPrince, you collaborate directly with a senior engineer who writes production code, designs system architecture, and takes personal responsibility for performance and deliverability.
                </p>
              </div>

              <div className="col-lg-6">
                <div style={{ background: '#07080c', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '18px', padding: '30px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#00f2fe', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaBolt /> The Core Agency Problems We Eliminate
                  </h3>
                  <div className="d-flex flex-column gap-3">
                    <div style={{ borderLeft: '3px solid #d40027', paddingLeft: '14px' }}>
                      <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>No Middlemen or Account Managers</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.6 }}>Direct technical communication eliminates misinterpretation, saves weeks of lost time, and guarantees requirements are built right the first time.</div>
                    </div>
                    <div style={{ borderLeft: '3px solid #00f2fe', paddingLeft: '14px' }}>
                      <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Zero Drag-and-Drop Bloat</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.6 }}>We do not assemble fragile Frankenstein themes with 40 competing WordPress plugins. We write clean, typed, maintainable TypeScript and Python.</div>
                    </div>
                    <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '14px' }}>
                      <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Sub-Second Core Web Vitals Standard</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.6 }}>Speed is not an afterthought. We optimize Time To First Byte (TTFB), Largest Contentful Paint (LCP), and Cumulative Layout Shift (CLS) from day one.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3, 4, 5: Vision, Mission & Philosophy */}
          <section className="my-5">
            <div className="text-center mb-5">
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#d40027', textTransform: 'uppercase' }}>
                Foundational Pillars
              </span>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
                Vision, Mission &amp; Guiding Philosophy
              </h2>
            </div>

            <div className="row g-4">
              <div className="col-lg-4 col-md-6 d-flex">
                <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(212, 0, 39, 0.15)', color: '#d40027', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <FaCompass size={22} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>Our Vision</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    We envision a web ecosystem where digital products load instantaneously, respect user privacy, and operate autonomously. Business technology should be transparent, lightweight, and deeply reliable rather than fragile and opaque.
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 d-flex">
                <div style={{ background: '#0e1017', border: '1px solid rgba(0, 242, 254, 0.35)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', width: '100%', boxShadow: '0 8px 30px rgba(0, 242, 254, 0.08)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <FaLightbulb size={22} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>Our Mission</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    To engineer high-leverage software solutions that directly generate revenue, remove operational bottlenecks, and give growing companies the technological muscle usually reserved for enterprise tech giants.
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-12 d-flex">
                <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <FaHandshake size={22} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>Our Philosophy</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    Craftsmanship over shortcuts. We value typed contracts, predictable state machines, clean relational database schemas, and honest client communication over fleeting marketing buzzwords.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 & 7: How We Think About Technology & Our Approach to AI */}
          <section className="my-5 p-md-5 p-4" style={{ background: '#0b0d13', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
            <div className="row g-4">
              <div className="col-lg-6">
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(212, 0, 39, 0.15)', color: '#d40027', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <FaCode size={20} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
                  6. How We Think About Technology
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.7, fontSize: '14px', marginBottom: '14px' }}>
                  Technology is not a goal in itself: it is a lever for commercial results. We resist the endless churn of JavaScript frameworks unless a new tool brings demonstrable advantages in latency, developer velocity, or reliability.
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
                  We prioritize static and server-rendered generation in Next.js, strictly typed TypeScript boundaries, normalized relational models in PostgreSQL, and modular service interfaces. This approach guarantees that software built today remains maintainable five years from now.
                </p>
              </div>

              <div className="col-lg-6">
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <FaBrain size={20} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
                  7. Our Approach to AI &amp; Automation
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.7, fontSize: '14px', marginBottom: '14px' }}>
                  We reject the premise that adding a generic chatbot to a website constitutes meaningful artificial intelligence. True business intelligence requires deterministic workflows, structured JSON schemas, and grounded retrieval.
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
                  Our AI architectures rely on strict prompt guardrails, private vector embeddings, and multi-agent consensus checks. When our agents scout leads or extract invoice data, they validate facts against real databases before making decisions.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8, 9, 10: How We Work, Dev Principles, Quality & Security */}
          <section className="my-5">
            <div className="text-center mb-5">
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#d40027', textTransform: 'uppercase' }}>
                Engineering Rigor
              </span>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
                Workflows, Principles &amp; Security Standards
              </h2>
            </div>

            <div className="row g-4">
              <div className="col-lg-4 col-md-6 d-flex">
                <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ color: '#00f2fe', fontSize: '18px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaNetworkWired /> 8. Client Collaboration
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Direct Async Communication:</strong> Fast updates via WhatsApp, Slack, and email without bureaucratic status meetings.
                    </li>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Transparent Git Commits:</strong> Clients retain complete visibility into real-time code repositories and staging branches.
                    </li>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Milestone-Based Invoicing:</strong> Work is broken into agreed phases with payments tied directly to verified deliverables.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 d-flex">
                <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ color: '#d40027', fontSize: '18px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBolt /> 9. Development Principles
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Sub-500ms Response Times:</strong> Edge runtime deployment, database query indexing, and aggressive asset optimization.
                    </li>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Semantic, Accessible Markup:</strong> Fully keyboard navigable interfaces that comply with WCAG AA accessibility standards.
                    </li>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Full Source IP Ownership:</strong> Clients hold 100% intellectual property ownership upon completion. No vendor lock-in.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-4 col-md-12 d-flex">
                <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ color: '#10b981', fontSize: '18px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaShieldHalved /> 10. Quality &amp; Security
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Zero-Trust Architecture:</strong> Cryptographic token verification, server-side parameter sanitization, and strict CORS policies.
                    </li>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Zero Plain-Text Secrets:</strong> Strict environment isolation with encrypted secret management across cloud providers.
                    </li>
                    <li style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#ffffff' }}>Automated Static Analysis:</strong> Rigorous linting, type checks, and dependency vulnerability scans prior to deployment.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 11: Technology & Expertise */}
          <section className="my-5 p-md-5 p-4" style={{ background: '#07080c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
            <div className="row g-4 align-items-center">
              <div className="col-lg-4">
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#d40027', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Verified Capabilities
                </span>
                <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3, marginBottom: '16px' }}>
                  11. Battle-Tested Technology Stack
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                  We engineer across modern web, backend, and AI stacks. Every framework in our toolbox is chosen for enterprise stability, community health, and measurable production performance.
                </p>
              </div>

              <div className="col-lg-8">
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ color: '#00f2fe', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Frontend &amp; UI Architecture</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: 1.6 }}>Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Sass, HTML5 Semantic Web Standards.</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ color: '#d40027', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Backend &amp; Microservices</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: 1.6 }}>Node.js, Python (FastAPI, Celery), PHP 8.x, REST APIs, GraphQL, Server-Sent Events, Webhooks.</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ color: '#10b981', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Databases &amp; Cloud Storage</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: 1.6 }}>Supabase PostgreSQL, pgvector, Redis Cache, Cloudflare R2, AWS S3, Vercel Edge Network.</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>AI Orchestration &amp; Search</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: 1.6 }}>Gemini 2.5 API, Claude 3.7 Sonnet, OpenAI API, LangChain, LlamaIndex, Technical SEO Schema.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 12 & 14: Continuous Learning & Future Direction */}
          <section className="my-5">
            <div className="row g-4">
              <div className="col-lg-6">
                <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', height: '100%' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <FaChartLine size={20} />
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                    12. Continuous Learning &amp; Innovation
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: 1.7, marginBottom: '12px' }}>
                    Engineering excellence requires disciplined study. We continuously stress-test emerging runtimes, benchmark LLM token latency versus accuracy, and study database indexing mechanics.
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    Our R&amp;D experiments feed directly into production client deliverables, guaranteeing that every customer benefits from validated engineering innovations rather than speculative experimentation.
                  </p>
                </div>
              </div>

              <div className="col-lg-6">
                <div style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', height: '100%' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(212, 0, 39, 0.15)', color: '#d40027', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <FaRocket size={20} />
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                    14. Future Direction
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: 1.7, marginBottom: '12px' }}>
                    We are expanding towards sovereign, autonomous business architectures. In the coming months, HeyPrince is prioritizing local-first AI models that run with zero data leakage, and headless digital systems that eliminate SaaS subscription fatigue.
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    Our roadmap centers on building durable software assets that compound in enterprise value over time without requiring recurring agency retainers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 13: Journey & Milestones (Preserving career milestones) */}
          <section className="my-5">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#d40027', textTransform: 'uppercase' }}>
                  Chronological Record
                </span>
                <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  13. Journey &amp; Milestones (2017 to Present)
                </h3>
              </div>
              <Link href="/#journey" className="btn-back-home">
                <span>View Interactive Timeline</span>
                <FaArrowRight size={13} />
              </Link>
            </div>

            <div className="row g-3">
              {timelineMilestones.map((m) => (
                <div key={m.pos} className="col-lg-3 col-sm-6 col-12">
                  <div
                    style={{
                      background: '#0d0f15',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '22px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '24px',
                        fontFamily: 'Futuru, sans-serif',
                        fontWeight: 900,
                        color: '#d40027',
                        marginBottom: '8px',
                        display: 'block',
                      }}
                    >
                      {m.year}
                    </span>
                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
                      {m.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 15: Contact and Collaboration CTA */}
          <section className="text-center mt-5 pt-4 p-md-5 p-4" style={{ background: 'radial-gradient(circle at center, #1b2030 0%, #0d0f15 100%)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#00f2fe', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              Direct Senior Engagement
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
              15. Ready to Build High-Performance Software Together?
            </h2>
            <p style={{ maxWidth: '680px', margin: '0 auto 28px', color: 'rgba(255, 255, 255, 0.75)', fontSize: '15px', lineHeight: 1.7 }}>
              Whether you are planning a modern web platform, migrating away from legacy spaghetti code, or deploying intelligent automated workflows, get direct senior engineering advisory.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link className="portal-btn" href="/contact/">
                <span className="mr-right">Schedule a Technical Call</span>
                <span className="arrow">
                  <FaRocket size={15} color="#000" />
                </span>
              </Link>
              <a
                href="https://wa.me/919120900010?text=Hi%20Prince%2C%20I%20reviewed%20your%20About%20page%20and%20would%20like%20to%20discuss%20an%20engineering%20collaboration."
                target="_blank"
                rel="noopener noreferrer"
                className="portal-btn portal-btn-whatsapp"
              >
                <span className="mr-right">Message on WhatsApp</span>
                <span className="arrow">
                  <FaWhatsapp size={15} color="#000" />
                </span>
              </a>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
