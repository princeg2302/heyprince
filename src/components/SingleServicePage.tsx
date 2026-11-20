'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { servicesList, ServiceData, resolveService20Sections } from '../data/servicesData';
import type { Article } from '../data/siteContent';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaWhatsapp,
  FaChevronDown,
  FaBolt,
  FaBrain,
  FaWordpress,
  FaReact,
  FaPhp,
  FaPython,
  FaMagnifyingGlass,
  FaPalette,
  FaCode,
  FaShieldHalved,
  FaRocket,
  FaServer,
  FaLayerGroup,
  FaLock,
  FaUsers,
  FaChartLine,
  FaDatabase,
  FaHandshake,
  FaClock,
} from 'react-icons/fa6';

export interface SingleServicePageProps {
  slug: string;
  initialService?: ServiceData | null;
  allServices?: ServiceData[];
  relatedArticles?: Article[];
  onNavigateHome?: () => void;
  onNavigateServices?: () => void;
  onSelectService?: (slug: string) => void;
  onNavigateContact?: (preselectedService?: string) => void;
}

export const SingleServicePage: React.FC<SingleServicePageProps> = ({
  slug,
  initialService,
  allServices,
  relatedArticles,
  onNavigateHome,
  onNavigateServices,
  onSelectService,
  onNavigateContact,
}) => {
  const router = useRouter();

  const handleHome = () => {
    if (onNavigateHome) onNavigateHome();
    else router.push('/');
  };

  const handleServices = () => {
    if (onNavigateServices) onNavigateServices();
    else router.push('/services');
  };

  const handleSelectService = (newSlug: string) => {
    if (onSelectService) onSelectService(newSlug);
    else router.push(`/services/${newSlug}/`);
  };

  const handleContact = (serviceTitle?: string) => {
    if (onNavigateContact) onNavigateContact(serviceTitle);
    else router.push(`/contact/${serviceTitle ? `?service=${encodeURIComponent(serviceTitle)}` : ''}`);
  };

  // Locate matching service or default to first
  const activeService: ServiceData =
    initialService ||
    servicesList.find((s) => s.slug === slug) ||
    servicesList[0];

  const sectionsData = resolveService20Sections(activeService);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Instant scroll to top on mount / slug change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slug]);

  // Scroll reading progress
  useEffect(() => {
    let ticking = false;
    const updateProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? window.scrollY / total : 0;
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

  const poolOfServices = allServices && allServices.length > 0 ? allServices : servicesList;
  const otherServices = poolOfServices.filter((s) => s.slug !== activeService.slug);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'FaBrain':
        return <FaBrain size={28} />;
      case 'FaWordpress':
        return <FaWordpress size={28} />;
      case 'FaReact':
        return <FaReact size={28} />;
      case 'FaPhp':
        return <FaPhp size={28} />;
      case 'FaPython':
        return <FaPython size={28} />;
      case 'FaMagnifyingGlass':
        return <FaMagnifyingGlass size={28} />;
      case 'FaPalette':
        return <FaPalette size={28} />;
      case 'FaBolt':
        return <FaBolt size={28} />;
      case 'FaRocket':
        return <FaRocket size={28} />;
      default:
        return <FaCode size={28} />;
    }
  };

  const whatsAppUrl = `https://wa.me/919120900010?text=${encodeURIComponent(
    `Hi Prince, I am interested in your ${activeService.title} service and would like to discuss my project.`
  )}`;

  return (
    <article className="single-service-view" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Top Reading Progress Bar */}
      <div ref={progressBarRef} className="reading-progress-bar" aria-hidden="true" />

      {/* SECTION 1: Hero Header & Primary Actions */}
      <section className="service-hero-section">
        <div className="container">
          {/* Navigation & Breadcrumbs */}
          <div className="blog-header-nav">
            <button
              type="button"
              className="btn-back-home"
              onClick={handleServices}
              aria-label="Back to Services"
            >
              <FaArrowLeft />
              <span>Back to Services</span>
            </button>

            <nav className="blog-breadcrumb" aria-label="Breadcrumb">
              <button type="button" onClick={handleHome} className="breadcrumb-btn">
                Home
              </button>
              <span className="breadcrumb-sep">/</span>
              <button
                type="button"
                onClick={handleServices}
                className="breadcrumb-btn"
              >
                Services
              </button>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current" title={activeService.title}>
                {activeService.shortTitle || activeService.title}
              </span>
            </nav>
          </div>

          <div className="service-hero-content text-center">
            {sectionsData.hero.isFeatured && (
              <div className="featured-service-pill">
                <span className="live-pulse-dot"></span>
                <span>{sectionsData.hero.featuredBadge || '★ FEATURED SERVICE // NEXT-GEN TECH'}</span>
              </div>
            )}

            <div className="service-category-tag">{sectionsData.hero.category}</div>

            <h1 className="service-main-title">{sectionsData.hero.title}</h1>
            <p className="service-tagline-lead">{sectionsData.hero.tagline}</p>

            <div className="service-hero-actions d-flex flex-wrap justify-content-center gap-3 mt-4">
              <button
                type="button"
                className="portal-btn"
                onClick={() => handleContact(activeService.title)}
              >
                <span className="mr-right">Request Project Scope</span>
                <span className="arrow">
                  <FaRocket size={15} color="#000" />
                </span>
              </button>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="portal-btn portal-btn-whatsapp"
              >
                <span className="mr-right">Instant WhatsApp Inquiry</span>
                <span className="arrow">
                  <FaWhatsapp size={15} color="#000" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="service-body-container container">
        {/* SECTION 2: Clear Service Overview */}
        <section className="service-overview-block my-5">
          <div className="service-block-header">
            <span className="section-badge">SECTION 02 // STRATEGIC OVERVIEW</span>
            <h2>Architected for Performance &amp; Real Business Results</h2>
          </div>
          <div className="service-overview-text">
            {sectionsData.overview.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Highlights Mini Cards */}
          {sectionsData.highlights && sectionsData.highlights.length > 0 && (
            <div className="service-highlights-grid mt-4">
              {sectionsData.highlights.map((item, idx) => (
                <div key={idx} className="service-highlight-card">
                  <div className="highlight-icon">
                    <FaCheck />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: Business Problems It Solves */}
        <section className="my-5 p-md-5 p-4" style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 03 // PROBLEM REMEDIATION</span>
            <h2>Critical Business Bottlenecks We Eliminate</h2>
            <p className="section-sub-desc">
              We focus on solving tangible operational and financial friction rather than building vanity features.
            </p>
          </div>

          <div className="row g-4">
            {sectionsData.problemsSolved.map((item, idx) => (
              <div key={idx} className="col-md-6 col-12 d-flex">
                <div
                  className="w-100 p-4"
                  style={{
                    background: '#07080c',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ color: '#d40027', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Bottleneck 0{idx + 1}
                  </div>
                  <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4 }}>
                    {item.problem}
                  </h4>
                  <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <FaCheck style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} size={13} />
                    <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6 }}>
                      <strong style={{ color: '#00f2fe' }}>Engineered Fix:</strong> {item.solution}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Who Needs This Service */}
        <section className="my-5">
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 04 // TARGET AUDIENCE</span>
            <h2>Who This Engineering Service Is Built For</h2>
            <p className="section-sub-desc">
              Tailored for organizations that value technical precision, direct senior collaboration, and speed.
            </p>
          </div>

          <div className="row g-3">
            {sectionsData.whoNeedsThis.map((audience, idx) => (
              <div key={idx} className="col-lg-3 col-sm-6 col-12 d-flex">
                <div
                  className="w-100 p-4"
                  style={{
                    background: '#0d0f15',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.12)', color: '#00f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <FaUsers size={18} />
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                    {audience}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: What Is Included (Core Scope) */}
        <section className="service-deliverables-block my-5">
          <div className="service-block-header text-center">
            <span className="section-badge">SECTION 05 // CORE SCOPE</span>
            <h2>What Is Included in This Engagement</h2>
            <p className="section-sub-desc">
              Every deliverable is crafted with production-ready standards, robust security, and clean documentation.
            </p>
          </div>

          <div className="deliverables-grid">
            {sectionsData.coreScope.map((item, idx) => (
              <div key={idx} className="deliverable-card">
                <div className="deliverable-number">0{idx + 1}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: Technical Features & Capabilities */}
        <section className="my-5 p-md-5 p-4" style={{ background: '#0a0c12', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 06 // CAPABILITIES</span>
            <h2>Engineered Features &amp; Technical Capabilities</h2>
          </div>

          <div className="row g-4">
            {sectionsData.capabilities.map((cap, idx) => (
              <div key={idx} className="col-lg-6 col-12 d-flex">
                <div
                  className="w-100 p-4"
                  style={{
                    background: '#0e1017',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(212, 0, 39, 0.15)', color: '#d40027', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FaBolt size={20} />
                  </div>
                  <div>
                    <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{cap.title}</h4>
                    <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{cap.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 7: Architecture & How the Solution Works */}
        <section className="my-5">
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 07 // SYSTEM ARCHITECTURE</span>
            <h2>Architectural Flow: How the Solution Operates</h2>
            <p className="section-sub-desc">
              A transparent look into the modular software tiers that power speed and reliability.
            </p>
          </div>

          <div className="row g-4">
            {sectionsData.architectureWorkflow.map((tier, idx) => (
              <div key={idx} className="col-lg-3 col-sm-6 col-12 d-flex">
                <div
                  className="w-100 p-4"
                  style={{
                    background: '#0d0f15',
                    border: '1px solid rgba(0, 242, 254, 0.25)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>{tier.step}</span>
                    <FaLayerGroup size={16} color="#00f2fe" />
                  </div>
                  <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>{tier.layer}</h4>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{tier.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 8: Verified Technologies Used */}
        <section className="service-tech-block my-5">
          <div className="service-block-header text-center">
            <span className="section-badge">SECTION 08 // TECH ECOSYSTEM</span>
            <h2>Battle-Tested Tools &amp; Modern Frameworks</h2>
          </div>

          <div className="tech-pills-wrap">
            {sectionsData.techStack.map((tech, idx) => (
              <span key={idx} className="tech-pill-badge">
                <FaBolt className="pill-bolt" />
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* SECTION 9: Step-by-Step Implementation Process */}
        <section className="service-process-block my-5">
          <div className="service-block-header text-center">
            <span className="section-badge">SECTION 09 // EXECUTION LIFECYCLE</span>
            <h2>Step-by-Step Implementation Process</h2>
          </div>

          <div className="service-process-grid">
            {sectionsData.process.map((step, idx) => (
              <div key={idx} className="process-step-card">
                <div className="step-badge">{step.step}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 10: Expected Deliverables & Artifacts */}
        <section className="my-5 p-md-5 p-4" style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 10 // CONCRETE ARTIFACTS</span>
            <h2>Expected Deliverables &amp; Code Assets Handed Over</h2>
          </div>

          <div className="row g-4">
            {sectionsData.deliverables.map((item, idx) => (
              <div key={idx} className="col-md-6 col-12 d-flex">
                <div
                  className="w-100 p-4"
                  style={{
                    background: '#07080c',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                      ✓
                    </div>
                    <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, margin: 0 }}>{item.title}</h4>
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 11: Third-Party Integration Possibilities */}
        <section className="my-5">
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 11 // INTEGRATION READINESS</span>
            <h2>Third-Party Services &amp; API Integrations</h2>
            <p className="section-sub-desc">
              Ready to plug into your existing CRM, payment processing, cloud databases, and marketing systems.
            </p>
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-3">
            {sectionsData.integrations.map((integration, idx) => (
              <div
                key={idx}
                style={{
                  background: '#0e1017',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <FaServer style={{ color: '#00f2fe' }} />
                <span>{integration}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 12: Security & Performance Standards */}
        <section className="my-5 p-md-5 p-4" style={{ background: '#0a0c12', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 12 // SECURITY &amp; COMPLIANCE</span>
            <h2>Security Standards &amp; Performance Guarantees</h2>
          </div>

          <div className="row g-3">
            {sectionsData.securityStandards.map((sec, idx) => (
              <div key={idx} className="col-md-6 col-12 d-flex">
                <div
                  className="w-100 p-3"
                  style={{
                    background: '#0e1017',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <FaShieldHalved style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} size={16} />
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', lineHeight: 1.6 }}>{sec}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 13: Typical Real-World Use Cases */}
        <section className="my-5">
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 13 // PRACTICAL APPLICATIONS</span>
            <h2>Real-World Scenarios &amp; Proven Outcomes</h2>
          </div>

          <div className="row g-4">
            {sectionsData.useCases.map((uc, idx) => (
              <div key={idx} className="col-lg-4 col-12 d-flex">
                <div
                  className="w-100 p-4"
                  style={{
                    background: '#0e1017',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#d40027', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Scenario 0{idx + 1}
                  </span>
                  <h4 style={{ color: '#ffffff', fontSize: '17px', fontWeight: 700, marginBottom: '12px' }}>{uc.title}</h4>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                    <strong style={{ color: '#ffffff' }}>The Context:</strong> {uc.scenario}
                  </div>
                  <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                    <div style={{ color: '#10b981', fontSize: '13px', lineHeight: 1.6, fontWeight: 500 }}>
                      <strong>Outcome:</strong> {uc.outcome}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 14: Industry-Specific Applications */}
        <section className="my-5 p-md-5 p-4" style={{ background: '#0e1017', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 14 // INDUSTRY FIT</span>
            <h2>Industry-Specific Deployments</h2>
          </div>

          <div className="row g-4">
            {sectionsData.industries.map((ind, idx) => (
              <div key={idx} className="col-md-6 col-12 d-flex">
                <div
                  className="w-100 p-4"
                  style={{
                    background: '#07080c',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                  }}
                >
                  <h4 style={{ color: '#00f2fe', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{ind.name}</h4>
                  <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{ind.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 15: Comparison with Alternative Approaches */}
        <section className="my-5">
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 15 // COMPARATIVE ADVANTAGE</span>
            <h2>Why Choose HeyPrince Over Traditional Options</h2>
            <p className="section-sub-desc">
              An objective comparison between HeyPrince direct senior engineering, bloated agencies, and off-the-shelf tools.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '16px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', textTransform: 'uppercase' }}>Metric</th>
                  <th style={{ padding: '16px', color: '#00f2fe', fontSize: '13px', textTransform: 'uppercase', background: 'rgba(0, 242, 254, 0.05)' }}>HeyPrince Standard</th>
                  <th style={{ padding: '16px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', textTransform: 'uppercase' }}>Traditional Agency</th>
                  <th style={{ padding: '16px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', textTransform: 'uppercase' }}>Off-The-Shelf SaaS</th>
                </tr>
              </thead>
              <tbody>
                {sectionsData.comparison.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <td style={{ padding: '16px', color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>{row.metric}</td>
                    <td style={{ padding: '16px', color: '#ffffff', fontSize: '13px', lineHeight: 1.5, background: 'rgba(0, 242, 254, 0.05)' }}>
                      <strong style={{ color: '#10b981' }}>✓</strong> {row.heyprince}
                    </td>
                    <td style={{ padding: '16px', color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.5 }}>{row.traditionalAgency}</td>
                    <td style={{ padding: '16px', color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.5 }}>{row.offTheShelf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 16: Transparent Pricing & Milestone Model */}
        <section className="my-5 p-md-5 p-4" style={{ background: '#07080c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
          <div className="service-block-header text-center mb-5">
            <span className="section-badge">SECTION 16 // MILESTONE STRUCTURE</span>
            <h2>Structured Delivery Milestones &amp; Scoping Model</h2>
            <p className="section-sub-desc">
              No hidden fees or unexpected billings. All engagements follow fixed milestone agreements tied to verified deliverables.
            </p>
          </div>

          <div className="row g-4">
            {sectionsData.pricingMilestones.map((m, idx) => (
              <div key={idx} className="col-lg-3 col-sm-6 col-12 d-flex">
                <div
                  className="w-100 p-4"
                  style={{
                    background: '#0e1017',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d40027', fontSize: '12px', fontWeight: 800, marginBottom: '10px' }}>
                    <FaClock size={12} />
                    <span>{m.turnaround}</span>
                  </div>
                  <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>{m.phase}</h4>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{m.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 17: Detailed Service FAQs with Accordion */}
        <section className="service-faq-block my-5">
          <div className="service-block-header text-center">
            <span className="section-badge">SECTION 17 // COMMON INQUIRIES</span>
            <h2>Frequently Asked Technical Questions</h2>
          </div>

          <div className="service-faq-accordion">
            {sectionsData.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`service-faq-item ${isOpen ? 'active' : ''}`}>
                  <button
                    type="button"
                    className="service-faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <FaChevronDown className={`faq-arrow-icon ${isOpen ? 'rotate' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="service-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 18: Related Services Grid */}
        <section className="other-services-block my-5">
          <div className="service-block-header text-center">
            <span className="section-badge">SECTION 18 // COMPLEMENTARY SERVICES</span>
            <h2>Related Engineering Specializations</h2>
          </div>

          <div className="other-services-grid">
            {otherServices.slice(0, 3).map((other) => (
              <div
                key={other.id}
                className={`other-service-card card-${other.cardTheme} ${other.isFeatured ? 'is-featured' : ''}`}
                onClick={() => handleSelectService(other.slug)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSelectService(other.slug);
                }}
              >
                <div className="other-card-top">
                  <span className="other-card-cat">{other.category}</span>
                  {other.isFeatured && <span className="mini-featured-star">★ FEATURED</span>}
                </div>
                <h3>{other.title}</h3>
                <p>{other.tagline}</p>
                <div className="other-card-link">
                  <span>Explore Service</span>
                  <FaArrowRight className="link-arrow" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 19: Contextual Technical Articles & Guides */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="my-5">
            <div className="service-block-header text-center mb-5">
              <span className="section-badge">SECTION 19 // INSIGHTS &amp; GUIDES</span>
              <h2>Relevant Technical Articles &amp; Case Notes</h2>
            </div>

            <div className="row g-4">
              {relatedArticles.slice(0, 3).map((art) => (
                <div key={art.slug} className="col-lg-4 col-md-6 col-12 d-flex">
                  <div
                    className="w-100 p-4"
                    style={{
                      background: '#0e1017',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#d40027', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                      {art.category} • {art.readMins}
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                      <Link href={art.url} style={{ color: '#ffffff', textDecoration: 'none' }}>
                        {art.title}
                      </Link>
                    </h4>
                    <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.5, margin: 0, flex: '1 0 auto' }}>
                      {art.description}
                    </p>
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <Link href={art.url} style={{ color: '#00f2fe', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                        Read In-Depth Guide <FaArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 20: Project Inquiry & Consultation CTA */}
        <section className="service-cta-banner my-5">
          <div className="cta-banner-inner">
            <span className="cta-badge">SECTION 20 // NEXT STEPS</span>
            <h2>Ready to Engineer Your {activeService.shortTitle} Solution?</h2>
            <p>
              Get senior-level consulting, clear milestone pricing, and clean code architecture without agency overhead.
            </p>
            <div className="cta-buttons-wrap">
              <button
                type="button"
                className="portal-btn"
                onClick={() => handleContact(activeService.title)}
              >
                <span className="mr-right">Request Project Scope</span>
                <span className="arrow">
                  <FaRocket size={15} color="#000" />
                </span>
              </button>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="portal-btn portal-btn-whatsapp"
              >
                <span className="mr-right">Chat on WhatsApp</span>
                <span className="arrow">
                  <FaWhatsapp size={15} color="#000" />
                </span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
};

export default SingleServicePage;
