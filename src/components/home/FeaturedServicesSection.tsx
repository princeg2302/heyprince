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
  FaRotate,
} from 'react-icons/fa6';

interface FeaturedServicesSectionProps {
  services: ServiceData[];
}

function renderServiceIcon(iconName: string) {
  switch (iconName) {
    case 'FaBrain':
      return <FaBrain size={24} />;
    case 'FaWordpress':
      return <FaWordpress size={24} />;
    case 'FaReact':
      return <FaReact size={24} />;
    case 'FaPhp':
      return <FaPhp size={24} />;
    case 'FaPython':
      return <FaPython size={24} />;
    case 'FaMagnifyingGlass':
      return <FaMagnifyingGlass size={24} />;
    case 'FaPalette':
      return <FaPalette size={24} />;
    default:
      return <FaCode size={24} />;
  }
}

const CARD_SUITS = ['♠', '♦', '♣', '♥', '★', '✦'];

export const FeaturedServicesSection: React.FC<FeaturedServicesSectionProps> = ({ services }) => {
  const displayServices = services && services.length > 0 ? services.slice(0, 6) : [];
  const [isFanned, setIsFanned] = useState(false);
  const [activeView, setActiveView] = useState<'deck' | 'grid'>('deck');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Trigger fan-out on scroll into view (playing cards patte kholna)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsFanned(true);
          }
        });
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '650px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(212, 0, 39, 0.08) 0%, rgba(0, 242, 254, 0.04) 50%, transparent 75%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div className="container py-5" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-5 gap-3">
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
                Interactive Service Deck // 2026
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
                maxWidth: '600px',
              }}
            >
              Hover or click on any card in the deck to reveal our production architecture and core deliverables.
            </p>
          </div>

          {/* Controls: Deck vs Grid & Shuffle */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFanned((prev) => !prev)}
              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Fan or Stack Deck"
            >
              <FaRotate size={12} style={{ color: '#00f2fe' }} />
              <span>{isFanned ? 'Stack Deck' : 'Fan Deck'}</span>
            </button>

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
                onClick={() => setActiveView('deck')}
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

        {/* 1. INTERACTIVE PLAYING CARDS DECK VIEW (Patte Kholne Wala View) */}
        {activeView === 'deck' && (
          <div
            className="d-none d-lg-block"
            style={{
              position: 'relative',
              minHeight: '620px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              perspective: '1500px',
              padding: '60px 0 40px',
            }}
          >
            {displayServices.map((service, idx) => {
              const diff = idx - midIndex;
              const isHovered = hoveredCard === idx;
              const hasHover = hoveredCard !== null;

              // Calculate playing card fanning angles & translations
              let rotateZ = 0;
              let translateX = 0;
              let translateY = 0;
              let scale = 1;
              let zIndex = 10 + idx;

              if (isFanned) {
                // Fanned out spread (like a poker/tarot deck in hands)
                rotateZ = diff * 5.5;
                translateX = diff * 155;
                translateY = Math.abs(diff) * 16;
              } else {
                // Stacked together closely
                rotateZ = diff * 2.5;
                translateX = diff * 28;
                translateY = Math.abs(diff) * 4;
              }

              // Elevate and level the card when hovered
              if (isHovered) {
                rotateZ = 0;
                translateY = -55;
                scale = 1.08;
                zIndex = 100;
              } else if (hasHover) {
                // Slightly dim other cards
                scale = 0.95;
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
                    width: '320px',
                    height: '460px',
                    borderRadius: '22px',
                    background: '#07080a',
                    border: isHovered
                      ? '1.5px solid #d40027'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isHovered
                      ? '0 25px 60px rgba(212, 0, 39, 0.35), 0 0 30px rgba(0, 242, 254, 0.2)'
                      : '0 15px 35px rgba(0, 0, 0, 0.75)',
                    transform: `translateX(${translateX}px) translateY(${translateY}px) rotateZ(${rotateZ}deg) scale(${scale})`,
                    transformOrigin: 'bottom center',
                    transition: 'all 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    zIndex,
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Playing Card Top Corners */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#d40027', fontWeight: 900, fontSize: '15px' }}>{suit}</span>
                      <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '13px', letterSpacing: '1px' }}>{cardNum}</span>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '3px 8px',
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
                        width: '46px',
                        height: '46px',
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
                        fontSize: '19px',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        marginBottom: '10px',
                      }}
                    >
                      {service.title}
                    </h3>

                    <p
                      style={{
                        color: 'rgba(255, 255, 255, 0.65)',
                        fontSize: '13px',
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

                  {/* Tech stack pills preview */}
                  <div className="d-flex flex-wrap gap-1 my-2">
                    {service.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        style={{
                          fontSize: '10px',
                          color: '#00f2fe',
                          background: 'rgba(0, 242, 254, 0.08)',
                          border: '1px solid rgba(0, 242, 254, 0.2)',
                          padding: '2px 7px',
                          borderRadius: '6px',
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
                      paddingTop: '14px',
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
                      <FaArrowRight size={11} style={{ color: '#d40027' }} />
                    </Link>
                    <span style={{ color: '#d40027', fontWeight: 900, fontSize: '13px' }}>{suit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. RESPONSIVE GRID VIEW (OR MOBILE/TABLET FALLBACK) */}
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
                              width: '46px',
                              height: '46px',
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
                            fontSize: '20px',
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
