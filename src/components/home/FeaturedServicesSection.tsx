'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ServiceData } from '@/data/servicesData';
import {
  FaArrowRight,
  FaBrain,
  FaWordpress,
  FaReact,
  FaPhp,
  FaPython,
  FaMagnifyingGlass,
  FaPalette,
  FaCode,
  FaBolt,
  FaLayerGroup,
  FaSliders,
  FaGrip,
} from 'react-icons/fa6';

interface FeaturedServicesSectionProps {
  services: ServiceData[];
}

function renderServiceIcon(iconName: string) {
  switch (iconName) {
    case 'FaBrain':
      return <FaBrain size={22} />;
    case 'FaWordpress':
      return <FaWordpress size={22} />;
    case 'FaReact':
      return <FaReact size={22} />;
    case 'FaPhp':
      return <FaPhp size={22} />;
    case 'FaPython':
      return <FaPython size={22} />;
    case 'FaMagnifyingGlass':
      return <FaMagnifyingGlass size={22} />;
    case 'FaPalette':
      return <FaPalette size={22} />;
    default:
      return <FaCode size={22} />;
  }
}

const CARD_SUITS = ['♠', '♦', '♣', '♥', '★', '✦'];

export const FeaturedServicesSection: React.FC<FeaturedServicesSectionProps> = ({ services }) => {
  const displayServices = services && services.length > 0 ? services.slice(0, 6) : [];
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeView, setActiveView] = useState<'deck' | 'grid'>('deck');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [manualFan, setManualFan] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Real-time scroll listener: as the user scrolls into view, the card deck fans out like cards in hand
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!sectionRef.current) return;
          const rect = sectionRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Start fanning when top of section reaches 85% of viewport
          // Fully fanned when top reaches 25% of viewport
          const start = windowHeight * 0.85;
          const end = windowHeight * 0.25;
          const rawProgress = (start - rect.top) / (start - end);
          const clamped = Math.max(0, Math.min(1, rawProgress));

          setScrollProgress(clamped);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Effective progress: either manual override or scroll-driven
  const effectiveProgress = manualFan !== null ? manualFan : scrollProgress;

  const totalCards = displayServices.length;
  const midIndex = (totalCards - 1) / 2;

  return (
    <section
      ref={sectionRef}
      className="py-5"
      id="services"
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(212, 0, 39, 0.1) 0%, rgba(0, 242, 254, 0.04) 50%, transparent 75%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div className="container py-5" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
              style={{
                background: 'rgba(212, 0, 39, 0.12)',
                border: '1px solid rgba(212, 0, 39, 0.3)',
              }}
            >
              <FaLayerGroup size={12} style={{ color: '#d40027' }} />
              <span
                style={{
                  color: '#d40027',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                Playing Card Hand // Scroll Fan Effect
              </span>
            </div>
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                color: '#ffffff',
                fontWeight: 800,
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Specialized Engineering Capabilities
            </h2>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '16px',
                marginTop: '10px',
                marginBottom: 0,
                maxWidth: '650px',
              }}
            >
              Scroll down to watch the deck fan out like cards in hand. Hover over any card to draw it from the deck.
            </p>
          </div>

          {/* View Toggles */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                padding: '3px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveView('deck');
                  setManualFan(null);
                }}
                style={{
                  background: activeView === 'deck' ? '#d40027' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaSliders size={11} />
                <span>Card Fan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('grid')}
                style={{
                  background: activeView === 'grid' ? '#d40027' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaGrip size={11} />
                <span>Grid View</span>
              </button>
            </div>

            <Link
              href="/services/"
              className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill text-decoration-none"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '13.5px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              <span>View All 9 Services</span>
              <FaArrowRight size={12} style={{ color: '#00f2fe' }} />
            </Link>
          </div>
        </div>

        {/* 1. INTERACTIVE PLAYING CARDS FAN VIEW (Dead-Centered, Scroll-Driven) */}
        {activeView === 'deck' && (
          <div className="d-none d-lg-block">
            {/* The Deck Stage: Height ensures full arc and hover expansion */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '660px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                perspective: '1600px',
                overflow: 'visible',
                paddingBottom: '30px',
              }}
            >
              {displayServices.map((service, idx) => {
                const diff = idx - midIndex; // e.g. -2.5, -1.5, -0.5, 0.5, 1.5, 2.5
                const isHovered = hoveredCard === idx;
                const hasHover = hoveredCard !== null;

                // Card fanning math:
                // Rotation fans out from a bottom hand pivot
                const fanAngle = diff * 7.5 * effectiveProgress;
                const fanX = diff * 128 * effectiveProgress;
                const fanY = Math.abs(diff) * 16 * effectiveProgress;

                // When hovered, card lifts straight UP from the hand and scales
                let finalTranslateX = fanX;
                let finalTranslateY = fanY;
                let finalRotateZ = fanAngle;
                let finalScale = 1;
                let zIndex = 10 + idx;

                if (isHovered) {
                  finalTranslateY = fanY - 65;
                  finalRotateZ = 0;
                  finalScale = 1.08;
                  zIndex = 100;
                } else if (hasHover) {
                  finalScale = 0.94;
                  zIndex = idx;
                }

                const suit = CARD_SUITS[idx % CARD_SUITS.length];
                const cardNum = `0${idx + 1}`;

                return (
                  <div
                    key={service.slug}
                    onMouseEnter={() => setHoveredCard(idx)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: '40px',
                      width: '300px',
                      height: '450px',
                      marginLeft: '-150px', // Exact center origin!
                      transformOrigin: '50% 120%', // Pivots at the bottom center like cards held in hand!
                      transform: `translateX(${finalTranslateX}px) translateY(${finalTranslateY}px) rotateZ(${finalRotateZ}deg) scale(${finalScale})`,
                      transition: isHovered
                        ? 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease'
                        : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease',
                      borderRadius: '20px',
                      background: '#07080a',
                      border: isHovered
                        ? '1.5px solid #d40027'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isHovered
                        ? '0 25px 60px rgba(212, 0, 39, 0.4), 0 0 25px rgba(0, 242, 254, 0.2)'
                        : '0 12px 35px rgba(0, 0, 0, 0.8)',
                      zIndex,
                      cursor: 'pointer',
                      userSelect: 'none',
                      padding: '24px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Playing Card Top Corners */}
                    <div className="d-flex align-items-center justify-content-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: '#d40027', fontWeight: 900, fontSize: '15px' }}>{suit}</span>
                        <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '13px', letterSpacing: '0.5px' }}>
                          {cardNum}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: 'rgba(255, 255, 255, 0.55)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        {service.category.split('&')[0]}
                      </span>
                    </div>

                    {/* Card Icon & Title */}
                    <div>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(212, 0, 39, 0.12)',
                          color: '#d40027',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '14px',
                          border: '1px solid rgba(212, 0, 39, 0.25)',
                        }}
                      >
                        {renderServiceIcon(service.iconName)}
                      </div>

                      <h3
                        style={{
                          color: '#ffffff',
                          fontSize: '18px',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          marginBottom: '8px',
                        }}
                      >
                        {service.title}
                      </h3>

                      <p
                        style={{
                          color: 'rgba(255, 255, 255, 0.65)',
                          fontSize: '12.5px',
                          lineHeight: 1.5,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {service.tagline || service.heroDescription}
                      </p>
                    </div>

                    {/* Tech stack pills */}
                    <div className="d-flex flex-wrap gap-1 my-1">
                      {service.techStack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          style={{
                            fontSize: '9.5px',
                            color: '#00f2fe',
                            background: 'rgba(0, 242, 254, 0.08)',
                            border: '1px solid rgba(0, 242, 254, 0.2)',
                            padding: '2px 6px',
                            borderRadius: '5px',
                            fontWeight: 600,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Card Bottom: Link to full service */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Link
                        href={`/services/${service.slug}/`}
                        className="text-decoration-none d-inline-flex align-items-center gap-2"
                        style={{
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                        }}
                      >
                        <span>Explore Blueprint</span>
                        <FaArrowRight size={10} style={{ color: '#d40027' }} />
                      </Link>
                      <span style={{ color: '#d40027', fontWeight: 900, fontSize: '12px' }}>{suit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deck Fan Indicator / Scrub Controls */}
            <div className="d-flex justify-content-center align-items-center gap-3 pt-2">
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Hand Spread: {Math.round(effectiveProgress * 100)}%
              </span>
              <div style={{ width: '140px', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${effectiveProgress * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #d40027, #00f2fe)',
                    transition: 'width 0.1s ease',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. RESPONSIVE GRID VIEW (OR MOBILE/TABLET VIEW) */}
        {(activeView === 'grid' || true) && (
          <div className={activeView === 'deck' ? 'd-block d-lg-none' : 'd-block'}>
            <div className="row g-4">
              {displayServices.map((service, idx) => {
                const isFeatured = service.isFeatured;
                return (
                  <div key={service.slug} className="col-lg-4 col-md-6 col-12 d-flex">
                    <Link
                      href={`/services/${service.slug}/`}
                      className="w-100 text-decoration-none d-flex flex-column justify-content-between rounded-4 p-4 agency-card-dark"
                    >
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: 'rgba(212, 0, 39, 0.12)',
                              color: '#d40027',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(212, 0, 39, 0.25)',
                            }}
                          >
                            {renderServiceIcon(service.iconName)}
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                            }}
                          >
                            0{idx + 1} // {service.category.split('&')[0]}
                          </span>
                        </div>

                        <h3
                          style={{
                            fontSize: '19px',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1.3,
                            marginBottom: '10px',
                          }}
                        >
                          {service.title}
                        </h3>

                        <p
                          style={{
                            fontSize: '13.5px',
                            color: 'rgba(255, 255, 255, 0.65)',
                            lineHeight: 1.6,
                            marginBottom: '16px',
                          }}
                        >
                          {service.tagline || service.heroDescription}
                        </p>
                      </div>

                      <div>
                        {service.techStack && (
                          <div className="d-flex flex-wrap gap-1 mb-3">
                            {service.techStack.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                style={{
                                  fontSize: '10.5px',
                                  color: 'rgba(255, 255, 255, 0.75)',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div
                          className="pt-3 d-flex align-items-center justify-content-between"
                          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
                        >
                          <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600 }}>
                            View Technical Scope
                          </span>
                          <FaArrowRight size={12} style={{ color: '#d40027' }} />
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedServicesSection;
