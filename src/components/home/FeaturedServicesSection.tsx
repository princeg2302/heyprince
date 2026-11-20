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
  FaShieldHalved,
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
const CARD_RANKS = ['A', 'K', 'Q', 'J', '10', '9'];

export const FeaturedServicesSection: React.FC<FeaturedServicesSectionProps> = ({ services }) => {
  const displayServices = services && services.length > 0 ? services.slice(0, 6) : [];
  const [scrollProgress, setScrollProgress] = useState(0.85); // Default to a gorgeous open hand
  const [activeView, setActiveView] = useState<'deck' | 'grid'>('deck');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [manualFan, setManualFan] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Smooth scroll listener: fans out like playing cards in hand as you scroll down
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!sectionRef.current) return;
          const rect = sectionRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Start fanning when top of section enters viewport (85%)
          // Reach full fan when centered in viewport (35%)
          const start = windowHeight * 0.9;
          const end = windowHeight * 0.35;
          const raw = (start - rect.top) / (start - end);
          const clamped = Math.max(0.15, Math.min(1, raw));

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

  const effectiveProgress = manualFan !== null ? manualFan : scrollProgress;
  const totalCards = displayServices.length;
  const midIndex = (totalCards - 1) / 2;

  return (
    <section
      ref={sectionRef}
      id="services"
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '130px', // Prevents fixed header from overlapping title!
        paddingBottom: '80px',
        scrollMarginTop: '110px',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(212, 0, 39, 0.12) 0%, rgba(0, 242, 254, 0.05) 50%, transparent 75%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header: Centered, clean, authoritative */}
        <div className="text-center max-w-3xl mx-auto mb-4">
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
              Interactive Capabilities Hand // 2026
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(32px, 4.2vw, 50px)',
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '12px',
            }}
          >
            Specialized Engineering Capabilities
          </h2>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.68)',
              fontSize: '16px',
              maxWidth: '680px',
              margin: '0 auto 20px',
              lineHeight: 1.6,
            }}
          >
            Scroll to watch the deck fan out like cards in hand. Hover or click any card to draw its technical blueprint.
          </p>

          {/* View Toggles & Catalog Link */}
          <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
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
                  padding: '6px 16px',
                  fontSize: '12.5px',
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
                  padding: '6px 16px',
                  fontSize: '12.5px',
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
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              <span>View All 9 Services</span>
              <FaArrowRight size={11} style={{ color: '#00f2fe' }} />
            </Link>
          </div>
        </div>

        {/* 1. PLAYING CARDS HAND FAN VIEW (Dead-Centered, Radial Fanning Math) */}
        {activeView === 'deck' && (
          <div className="d-none d-lg-block">
            {/* The Centered Stage Container */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1100px',
                margin: '0 auto',
                height: '640px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                perspective: '1800px',
                overflow: 'visible',
                paddingBottom: '30px',
              }}
            >
              {displayServices.map((service, idx) => {
                const diff = idx - midIndex; // -2.5, -1.5, -0.5, 0.5, 1.5, 2.5
                const isHovered = hoveredCard === idx;
                const hasHover = hoveredCard !== null;

                // Fanning geometry: Radial rotation from a single hand pivot point (50% 125%)
                const fanAngle = diff * 7.5 * effectiveProgress;
                const fanX = diff * 135 * effectiveProgress;
                const fanY = Math.pow(Math.abs(diff), 1.5) * 12 * effectiveProgress;

                let finalTranslateX = fanX;
                let finalTranslateY = fanY;
                let finalRotateZ = fanAngle;
                let finalScale = 1;
                let zIndex = 10 + idx;

                if (isHovered) {
                  finalTranslateY = fanY - 80;
                  finalRotateZ = 0;
                  finalScale = 1.1;
                  zIndex = 100;
                } else if (hasHover) {
                  finalScale = 0.94;
                  zIndex = idx;
                }

                const suit = CARD_SUITS[idx % CARD_SUITS.length];
                const rank = CARD_RANKS[idx % CARD_RANKS.length];
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
                      width: '310px',
                      height: '460px',
                      marginLeft: '-155px', // Exact mathematical dead-center!
                      transformOrigin: '50% 125%', // Hand grip pivot at bottom center
                      transform: `translateX(${finalTranslateX}px) translateY(${finalTranslateY}px) rotateZ(${finalRotateZ}deg) scale(${finalScale})`,
                      transition: isHovered
                        ? 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease'
                        : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.3s ease',
                      borderRadius: '22px',
                      background: 'linear-gradient(145deg, #0e1118 0%, #07080a 100%)',
                      border: isHovered
                        ? '1.5px solid #d40027'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isHovered
                        ? '0 30px 70px rgba(212, 0, 39, 0.45), 0 0 30px rgba(0, 242, 254, 0.25)'
                        : '0 15px 40px rgba(0, 0, 0, 0.85)',
                      opacity: hasHover && !isHovered ? 0.65 : 1,
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#d40027', fontWeight: 900, fontSize: '16px' }}>{suit}</span>
                        <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '14px', letterSpacing: '0.5px' }}>
                          {rank}
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '11px', fontWeight: 600 }}>
                          #{cardNum}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: '#00f2fe',
                          background: 'rgba(0, 242, 254, 0.08)',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          border: '1px solid rgba(0, 242, 254, 0.2)',
                        }}
                      >
                        {service.category.split('&')[0]}
                      </span>
                    </div>

                    {/* Card Icon & Title */}
                    <div>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '13px',
                          background: 'rgba(212, 0, 39, 0.12)',
                          color: '#d40027',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '14px',
                          border: '1px solid rgba(212, 0, 39, 0.28)',
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
                            color: 'rgba(255, 255, 255, 0.8)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '2px 7px',
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
                          fontSize: '12.5px',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                        }}
                      >
                        <span>Explore Blueprint</span>
                        <FaArrowRight size={10} style={{ color: '#d40027' }} />
                      </Link>
                      <span style={{ color: '#d40027', fontWeight: 900, fontSize: '13px' }}>{suit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deck Fan Indicator / Scrub Controls */}
            <div className="d-flex justify-content-center align-items-center gap-3 pt-3">
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Hand Fan Spread: {Math.round(effectiveProgress * 100)}%
              </span>
              <div
                style={{
                  width: '160px',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const p = (e.clientX - rect.left) / rect.width;
                  setManualFan(Math.max(0.1, Math.min(1, p)));
                }}
              >
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

        {/* 2. RESPONSIVE GRID VIEW (FOR TABLETS / MOBILE OR WHEN TOGGLED) */}
        {(activeView === 'grid' || true) && (
          <div className={activeView === 'deck' ? 'd-block d-lg-none mt-4' : 'd-block mt-4'}>
            <div className="row g-4">
              {displayServices.map((service, idx) => (
                <div key={service.slug} className="col-lg-4 col-md-6 col-12 d-flex">
                  <Link
                    href={`/services/${service.slug}/`}
                    className="w-100 text-decoration-none d-flex flex-column justify-content-between rounded-4 p-4 agency-card-dark"
                    style={{
                      background: '#07080a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedServicesSection;
