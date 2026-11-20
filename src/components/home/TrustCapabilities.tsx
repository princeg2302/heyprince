'use client';

import React from 'react';
import Link from 'next/link';
import { FaBolt, FaShieldHalved, FaCode, FaMicrochip, FaArrowRight, FaComments } from 'react-icons/fa6';

export const TrustCapabilities: React.FC = () => {
  const capabilities = [
    {
      icon: <FaBolt size={22} style={{ color: '#00f2fe' }} />,
      title: 'Sub-Second Global TTFB',
      description: 'Edge-rendered Next.js frontends deploying incremental static regeneration for sub-500ms real-world page loads worldwide.',
      metric: '< 500ms',
      metricLabel: 'Edge Response',
    },
    {
      icon: <FaShieldHalved size={22} style={{ color: '#d40027' }} />,
      title: 'Production-Hardened Security',
      description: 'Zero-trust perimeter architecture, encrypted environment secrets, strict CORS headers, and resilient rate limiting on every API endpoint.',
      metric: '100%',
      metricLabel: 'Security Posture',
    },
    {
      icon: <FaCode size={22} style={{ color: '#10b981' }} />,
      title: 'Zero-Template Custom Code',
      description: 'Clean, modular TypeScript and Python microservices built to your exact business specifications with zero bloated off-the-shelf theme baggage.',
      metric: 'Bespoke',
      metricLabel: 'Hand-Crafted',
    },
    {
      icon: <FaMicrochip size={22} style={{ color: '#f59e0b' }} />,
      title: 'Autonomous AI Integration',
      description: 'Deterministic RAG pipelines, multi-agent orchestration, and private LLM reasoning chains grounded in your proprietary databases.',
      metric: '10x',
      metricLabel: 'Workflow Speed',
    },
  ];

  return (
    <section
      id="capabilities"
      className="py-5"
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="container py-5">
        {/* Core Value Proposition (Clean, Authoritative, Un-mashed) */}
        <div className="text-center max-w-4xl mx-auto mb-5 pb-3">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
            style={{
              background: 'rgba(212, 0, 39, 0.12)',
              border: '1px solid rgba(212, 0, 39, 0.3)',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d40027' }}></span>
            <span
              style={{
                color: '#d40027',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Enterprise Engineering Standard
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(30px, 4vw, 46px)',
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.25,
              maxWidth: '880px',
              margin: '0 auto 16px',
            }}
          >
            We Build Sub-Second Web Applications, Headless Systems &amp; Autonomous AI Automations.
          </h2>

          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.72)',
              lineHeight: 1.65,
              maxWidth: '740px',
              margin: '0 auto 28px',
            }}
          >
            Transform slow, monolithic websites and manual workflows into high-converting digital platforms engineered with Next.js, FastAPI, and deterministic AI agents.
          </p>

          {/* High-Converting CTAs */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3">
            <a
              href="#services"
              className="d-inline-flex align-items-center gap-2 px-4 py-3 rounded-pill text-decoration-none"
              style={{
                background: '#d40027',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 8px 25px rgba(212, 0, 39, 0.35)',
                transition: 'all 0.25s ease',
              }}
            >
              <span>Explore Services</span>
              <FaArrowRight size={13} />
            </a>

            <Link
              href="/contact/"
              className="d-inline-flex align-items-center gap-2 px-4 py-3 rounded-pill text-decoration-none"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: 600,
                fontSize: '15px',
                transition: 'all 0.25s ease',
              }}
            >
              <FaComments size={14} style={{ color: '#00f2fe' }} />
              <span>Let&apos;s Discuss Your Project</span>
            </Link>
          </div>
        </div>

        {/* 4 Verifiable Trust Capability Cards */}
        <div className="row g-4 pt-2">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="col-lg-3 col-md-6 col-12 d-flex">
              <div
                className="w-100 p-4 rounded-4 agency-card-dark"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cap.icon}
                    </div>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#d40027',
                        fontFamily: 'var(--font-futuru)',
                      }}
                    >
                      {cap.metric}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '17px', color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>
                    {cap.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
                    {cap.description}
                  </p>
                </div>
                <div
                  className="pt-3 mt-3"
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.45)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 700,
                  }}
                >
                  {cap.metricLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustCapabilities;
