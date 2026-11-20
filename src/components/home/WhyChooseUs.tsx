'use client';

import React from 'react';
import Link from 'next/link';
import {
  FaCheck,
  FaXmark,
  FaShieldHalved,
  FaBolt,
  FaCode,
  FaArrowRight,
  FaCrown,
  FaLock,
  FaUsersSlash,
} from 'react-icons/fa6';

export const WhyChooseUs: React.FC = () => {
  return (
    <section
      id="why-choose-us"
      className="py-5"
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="container py-5">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-5">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
            style={{
              background: 'rgba(212, 0, 39, 0.12)',
              border: '1px solid rgba(212, 0, 39, 0.3)',
            }}
          >
            <FaCrown size={12} style={{ color: '#d40027' }} />
            <span
              style={{
                color: '#d40027',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Practical Differentiation // Engineering Standard
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '14px',
            }}
          >
            Why Modern Brands Choose HeyPrince
          </h2>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.68)',
              fontSize: '16px',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            No bloated account management tiers, no outsourced junior code, no hostage platforms. Direct senior engineering and verified technical outcomes.
          </p>
        </div>

        {/* SENIOR ENGINEERING BENTO GRID (NOT generic cards!) */}
        <div className="row g-4">
          {/* Bento Tile 1 (Large 8-Col): Direct Senior Architect vs Agency Hierarchy */}
          <div className="col-lg-8 col-12">
            <div
              className="p-4 p-md-5 rounded-4 h-100 d-flex flex-column justify-content-between"
              style={{
                background: 'linear-gradient(145deg, #10121a 0%, #07080a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              }}
            >
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FaUsersSlash size={16} style={{ color: '#d40027' }} />
                  <span style={{ fontSize: '11px', color: '#d40027', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Zero Delegation Loss
                  </span>
                </div>

                <h3 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  Direct Senior Engineering (No Junior Hand-Offs)
                </h3>

                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '24px' }}>
                  At traditional agencies, you speak to an account manager, who translates your requirements to a project manager, who hands off the task to a junior or offshore contractor. At HeyPrince, you collaborate directly with Prince, a Senior Full Stack &amp; AI Systems Architect.
                </p>

                {/* Side-by-Side Comparison Graphic */}
                <div className="row g-3">
                  <div className="col-md-6 col-12">
                    <div
                      className="p-3 rounded-3"
                      style={{
                        background: 'rgba(212, 0, 39, 0.08)',
                        border: '1px solid rgba(212, 0, 39, 0.25)',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#ef4444', fontWeight: 700, fontSize: '13px' }}>
                        <FaXmark size={14} />
                        <span>Traditional Agency Model</span>
                      </div>
                      <ul className="list-unstyled m-0 d-flex flex-column gap-1" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        <li>• 4+ layers of middle management telephone game</li>
                        <li>• Junior developers learning on your budget</li>
                        <li>• Generic off-the-shelf templates and bloated plugins</li>
                        <li>• Endless change order fee disputes</li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-6 col-12">
                    <div
                      className="p-3 rounded-3"
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
                        <FaCheck size={14} />
                        <span>The HeyPrince Direct Standard</span>
                      </div>
                      <ul className="list-unstyled m-0 d-flex flex-column gap-1" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>
                        <li>• Direct principal architect communication</li>
                        <li>• 100% hand-crafted Next.js &amp; Python code</li>
                        <li>• Sub-500ms real-world performance guarantee</li>
                        <li>• Full source code &amp; IP ownership on day one</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Tile 2 (4-Col): Sub-Second Speed Guarantee Gauge */}
          <div className="col-lg-4 col-12">
            <div
              className="p-4 p-md-5 rounded-4 h-100 d-flex flex-column justify-content-between"
              style={{
                background: 'linear-gradient(145deg, #0e141a 0%, #07080a 100%)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              }}
            >
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FaBolt size={14} style={{ color: '#00f2fe' }} />
                  <span style={{ fontSize: '11px', color: '#00f2fe', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Performance Contract
                  </span>
                </div>

                <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>
                  Sub-500ms Edge Standard
                </h3>

                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
                  Every web application is engineered to pass 100% of Google Core Web Vitals with sub-second real-world page transitions.
                </p>

                {/* Visual Lighthouse 100 Gauge Graphic */}
                <div
                  className="p-3 rounded-3 text-center mb-3"
                  style={{
                    background: 'rgba(5, 6, 8, 0.9)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <div style={{ color: '#10b981', fontSize: '38px', fontWeight: 900, lineHeight: 1 }}>
                    100
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                    Google Core Web Vitals
                  </div>
                </div>
              </div>

              <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '11px' }}>
                Edge-Rendered · Zero Hydration Lag
              </span>
            </div>
          </div>

          {/* Bento Tile 3 (4-Col): 100% IP & Code Ownership */}
          <div className="col-lg-4 col-12">
            <div
              className="p-4 rounded-4 h-100 d-flex flex-column justify-content-between"
              style={{
                background: 'linear-gradient(145deg, #111018 0%, #07080a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FaLock size={14} style={{ color: '#d40027' }} />
                  <span style={{ fontSize: '11px', color: '#d40027', fontWeight: 700, textTransform: 'uppercase' }}>
                    Zero Vendor Lock-In
                  </span>
                </div>
                <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                  100% Code &amp; IP Ownership
                </h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  You receive clean, documented source code in your own private GitHub repository. No proprietary hostage CMS or recurring runtime license fees.
                </p>
              </div>
            </div>
          </div>

          {/* Bento Tile 4 (4-Col): Autonomous AI Acceleration */}
          <div className="col-lg-4 col-12">
            <div
              className="p-4 rounded-4 h-100 d-flex flex-column justify-content-between"
              style={{
                background: 'linear-gradient(145deg, #101518 0%, #07080a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FaBolt size={14} style={{ color: '#00f2fe' }} />
                  <span style={{ fontSize: '11px', color: '#00f2fe', fontWeight: 700, textTransform: 'uppercase' }}>
                    Autonomous Velocity
                  </span>
                </div>
                <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                  Deterministic AI Workflows
                </h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  We don&apos;t just write code — we build autonomous Python and LLM background workers that automate research, data entry, and lead discovery.
                </p>
              </div>
            </div>
          </div>

          {/* Bento Tile 5 (4-Col): Direct Consultation CTA */}
          <div className="col-lg-4 col-12">
            <div
              className="p-4 rounded-4 h-100 d-flex flex-column justify-content-between"
              style={{
                background: 'linear-gradient(145deg, #180e12 0%, #07080a 100%)',
                border: '1px solid rgba(212, 0, 39, 0.3)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#d40027', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Next Step
                </span>
                <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 800, margin: '8px 0 10px' }}>
                  Audit Your Project Architecture
                </h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  Discuss your tech stack, business bottlenecks, and execution timeline with Prince directly.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  href="/contact/"
                  className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill text-decoration-none"
                  style={{
                    background: '#d40027',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <span>Book Consultation</span>
                  <FaArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
