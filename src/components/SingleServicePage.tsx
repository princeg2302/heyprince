'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { servicesList, ServiceData } from '../data/servicesData';
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
} from 'react-icons/fa6';

export interface SingleServicePageProps {
  slug: string;
  onNavigateHome?: () => void;
  onNavigateServices?: () => void;
  onSelectService?: (slug: string) => void;
  onNavigateContact?: (preselectedService?: string) => void;
}

export const SingleServicePage: React.FC<SingleServicePageProps> = ({
  slug,
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
    else router.push('/#footer');
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
  const service: ServiceData =
    servicesList.find((s) => s.slug === slug) || servicesList[0];

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

  const otherServices = servicesList.filter((s) => s.slug !== service.slug);

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
      default:
        return <FaCode size={28} />;
    }
  };

  const whatsAppUrl = `https://wa.me/919120900010?text=${encodeURIComponent(
    `Hi Prince, I am interested in your ${service.title} service and would like to discuss my project.`
  )}`;

  return (
    <article className="single-service-view">
      {/* Top Reading Progress Bar */}
      <div ref={progressBarRef} className="reading-progress-bar" aria-hidden="true" />

      {/* Hero Header Section */}
      <section className="service-hero-section">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={handleHome} className="breadcrumb-btn">
              Home
            </button>
            <span className="breadcrumb-sep">&gt;</span>
            <button
              type="button"
              onClick={handleServices}
              className="breadcrumb-btn"
            >
              Services
            </button>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-current">{service.shortTitle}</span>
          </nav>

          <div className="service-hero-content text-center">
            {service.isFeatured && (
              <div className="featured-service-pill">
                <span className="live-pulse-dot"></span>
                <span>{service.featuredBadge || '★ FEATURED SERVICE // AI AUTOMATIONS'}</span>
              </div>
            )}

            <div className="service-category-tag">{service.category}</div>

            <h1 className="service-main-title">{service.title}</h1>
            <p className="service-tagline-lead">{service.tagline}</p>

            <div className="service-hero-actions d-flex flex-wrap justify-content-center gap-3 mt-4">
              <button
                type="button"
                className="portal-btn"
                onClick={() => handleContact(service.title)}
              >
                <span className="mr-right">Request Project Scope</span>
                <span className="arrow">
                  <FaRocket size={18} color="#000" />
                </span>
              </button>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="portal-btn"
                style={{ background: '#25d366', borderColor: '#25d366' }}
              >
                <span className="mr-right">Instant WhatsApp Inquiry</span>
                <span className="arrow">
                  <FaWhatsapp size={18} color="#000" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="service-body-container container">
        {/* Overview Intro */}
        <section className="service-overview-block">
          <div className="service-block-header">
            <span className="section-badge">STRATEGIC OVERVIEW</span>
            <h2>Architected for Performance &amp; Real Business Results</h2>
          </div>
          <div className="service-overview-text">
            {service.overview.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Highlights Mini Cards */}
          <div className="service-highlights-grid">
            {service.highlights.map((item, idx) => (
              <div key={idx} className="service-highlight-card">
                <div className="highlight-icon">
                  <FaCheck />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Deliverables Section */}
        <section className="service-deliverables-block">
          <div className="service-block-header text-center">
            <span className="section-badge">WHAT&apos;S INCLUDED</span>
            <h2>Core Deliverables &amp; Solutions</h2>
            <p className="section-sub-desc">
              Every deliverable is crafted with production-ready standards, robust security, and clean documentation.
            </p>
          </div>

          <div className="deliverables-grid">
            {service.deliverables.map((item, idx) => (
              <div key={idx} className="deliverable-card">
                <div className="deliverable-number">0{idx + 1}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack Block */}
        <section className="service-tech-block">
          <div className="service-block-header text-center">
            <span className="section-badge">TECH ECOSYSTEM</span>
            <h2>Battle-Tested Tools &amp; Modern Frameworks</h2>
          </div>

          <div className="tech-pills-wrap">
            {service.techStack.map((tech, idx) => (
              <span key={idx} className="tech-pill-badge">
                <FaBolt className="pill-bolt" />
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Engineering Process Steps */}
        <section className="service-process-block">
          <div className="service-block-header text-center">
            <span className="section-badge">HOW WE WORK</span>
            <h2>From Discovery to Production Deployment</h2>
          </div>

          <div className="service-process-grid">
            {service.process.map((step, idx) => (
              <div key={idx} className="process-step-card">
                <div className="step-badge">{step.step}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="service-faq-block">
          <div className="service-block-header text-center">
            <span className="section-badge">FREQUENTLY ASKED QUESTIONS</span>
            <h2>Questions About This Service?</h2>
          </div>

          <div className="service-faq-accordion">
            {service.faqs.map((faq, idx) => {
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

        {/* Direct Project Inquiry CTA Banner */}
        <section className="service-cta-banner">
          <div className="cta-banner-inner">
            <span className="cta-badge">LET&apos;S COLLABORATE</span>
            <h2>Ready to Build Your {service.shortTitle} Project?</h2>
            <p>
              Get senior-level consulting, rapid turnaround, and clean engineering without agency overhead.
            </p>
            <div className="cta-buttons-wrap">
              <button
                type="button"
                className="portal-btn"
                onClick={() => handleContact(service.title)}
              >
                <span className="mr-right">Start a Project Discussion</span>
                <span className="arrow">
                  <FaArrowRight size={18} color="#000" />
                </span>
              </button>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="portal-btn"
                style={{ background: '#25d366', borderColor: '#25d366' }}
              >
                <span className="mr-right">Chat on WhatsApp</span>
                <span className="arrow">
                  <FaWhatsapp size={18} color="#000" />
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Other Services Navigation */}
        <section className="other-services-block">
          <div className="service-block-header text-center">
            <span className="section-badge">EXPLORE MORE</span>
            <h2>Other Core Specializations</h2>
          </div>

          <div className="other-services-grid">
            {otherServices.map((other) => (
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
      </div>
    </article>
  );
};

export default SingleServicePage;
