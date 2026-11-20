'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaBolt,
  FaShieldHalved,
  FaCode,
  FaMicrochip,
  FaArrowRight,
  FaComments,
  FaCircleCheck,
  FaTowerBroadcast,
  FaServer,
  FaChartLine,
} from 'react-icons/fa6';

export const TrustCapabilities: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<number>(0);

  const telemetryMetrics = [
    {
      id: 0,
      icon: <FaBolt size={22} style={{ color: '#00f2fe' }} />,
      label: 'Edge Latency',
      value: '< 500ms',
      badge: 'Edge Deployed',
      badgeColor: '#00f2fe',
      headline: 'Sub-Second Global Edge Delivery',
      description: 'Distributed Next.js edge nodes with Incremental Static Regeneration serve pre-rendered pages within 300 to 500 milliseconds worldwide.',
      diagnostics: [
        { label: 'Global Edge TTFB', val: '280ms' },
        { label: 'Core Web Vitals Pass', val: '100%' },
        { label: 'Lighthouse Performance', val: '98/100' },
      ],
      radarCoords: { cx: 120, cy: 90, r: 8 },
    },
    {
      id: 1,
      icon: <FaShieldHalved size={22} style={{ color: '#d40027' }} />,
      label: 'Security Posture',
      value: 'Zero-Trust',
      badge: 'A+ Hardened',
      badgeColor: '#d40027',
      headline: 'Enterprise Zero-Trust Perimeter',
      description: 'Encrypted environment vaults, strict Content Security Policy headers, cryptographic session tokens, and zero-leakage API rate-limiting.',
      diagnostics: [
        { label: 'SSL/TLS Cipher', val: 'TLS 1.3 / ChaCha20' },
        { label: 'API Rate Shield', val: 'Active (Redis)' },
        { label: 'OWASP Top 10', val: '0 Criticals' },
      ],
      radarCoords: { cx: 210, cy: 140, r: 8 },
    },
    {
      id: 2,
      icon: <FaCode size={22} style={{ color: '#10b981' }} />,
      label: 'Code Quality',
      value: '0% Bloat',
      badge: 'Hand-Crafted',
      badgeColor: '#10b981',
      headline: 'Zero-Template Bespoke Architecture',
      description: 'Every line of TypeScript and Python is written intentionally for your domain model. Zero bloated multi-purpose themes or unused plugins.',
      diagnostics: [
        { label: 'Client Bundle Weight', val: '< 95KB gzip' },
        { label: 'TypeScript Strict', val: '100% Strict' },
        { label: 'Hydration Overhead', val: '< 15ms' },
      ],
      radarCoords: { cx: 160, cy: 220, r: 8 },
    },
    {
      id: 3,
      icon: <FaMicrochip size={22} style={{ color: '#f59e0b' }} />,
      label: 'AI Automation',
      value: '10x Speed',
      badge: 'Multi-Agent',
      badgeColor: '#f59e0b',
      headline: 'Autonomous AI & Multi-Agent Workflows',
      description: 'Deterministic RAG pipelines, multi-agent reasoning graphs, and Python workers executing background discovery and operational automation.',
      diagnostics: [
        { label: 'Multi-Agent Loops', val: 'Active (LangGraph)' },
        { label: 'Vector Store Query', val: '< 45ms (pgvector)' },
        { label: 'Operational Gain', val: '12 hrs/week saved' },
      ],
      radarCoords: { cx: 70, cy: 160, r: 8 },
    },
  ];

  const current = telemetryMetrics[activeMetric];

  return (
    <section
      id="capabilities"
      className="py-5"
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="container py-5">
        {/* Core Headline & Action Group */}
        <div className="text-center max-w-4xl mx-auto mb-5 pb-2">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
            style={{
              background: 'rgba(212, 0, 39, 0.12)',
              border: '1px solid rgba(212, 0, 39, 0.3)',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d40027' }} />
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
            We Build Sub-Second Web Applications, Headless Systems, and Autonomous AI Automations.
          </h2>

          <p
            style={{
              fontSize: '17px',
              color: 'rgba(255, 255, 255, 0.72)',
              lineHeight: 1.65,
              maxWidth: '740px',
              margin: '0 auto 28px',
            }}
          >
            Transform slow websites, manual operations, and fragile tools into high-converting digital platforms engineered with Next.js, Python FastAPI, and deterministic AI agents.
          </p>

          {/* Primary Action Buttons */}
          <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap mb-4">
            <Link
              href="/services/"
              className="d-inline-flex align-items-center gap-2 px-4 py-3 rounded-pill text-decoration-none"
              style={{
                background: '#d40027',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 4px 20px rgba(212, 0, 39, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Explore Services</span>
              <FaArrowRight size={13} />
            </Link>

            <Link
              href="/contact/"
              className="d-inline-flex align-items-center gap-2 px-4 py-3 rounded-pill text-decoration-none"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '15px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <FaComments size={14} style={{ color: '#00f2fe' }} />
              <span>Let&apos;s Discuss Your Project</span>
            </Link>
          </div>
        </div>

        {/* VISUAL & INTERACTIVE TELEMETRY CONSOLE (NOT generic cards!) */}
        <div
          className="rounded-4 overflow-hidden p-4 p-lg-5"
          style={{
            background: 'linear-gradient(145deg, #0f121a 0%, #07080a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 0, 39, 0.1)',
          }}
        >
          {/* Top Telemetry Status Ribbon */}
          <div
            className="d-flex align-items-center justify-content-between pb-4 mb-4 flex-wrap gap-2"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="d-flex align-items-center gap-3">
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                }}
              />
              <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                ARCHITECTURE TELEMETRY // PRODUCTION CLUSTER LIVE
              </span>
            </div>
            <div className="d-flex align-items-center gap-3" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
              <span>EDGE LOCATIONS: 32 POPS</span>
              <span>•</span>
              <span style={{ color: '#00f2fe' }}>FRAME RATE: 60 FPS</span>
            </div>
          </div>

          <div className="row g-4 align-items-center">
            {/* Left Column: Interactive Metric Selectors (4 Ticking Gauges) */}
            <div className="col-lg-6 col-12">
              <div className="d-flex flex-column gap-3">
                {telemetryMetrics.map((m) => {
                  const isSelected = activeMetric === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setActiveMetric(m.id)}
                      className="p-3 rounded-3 cursor-pointer"
                      style={{
                        background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? `1.5px solid ${m.badgeColor}` : '1px solid rgba(255, 255, 255, 0.06)',
                        boxShadow: isSelected ? `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${m.badgeColor}25` : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: isSelected ? `${m.badgeColor}20` : 'rgba(255, 255, 255, 0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: `1px solid ${isSelected ? m.badgeColor : 'rgba(255, 255, 255, 0.1)'}`,
                            }}
                          >
                            {m.icon}
                          </div>
                          <div>
                            <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14.5px' }}>
                              {m.label}
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11.5px' }}>
                              {m.headline}
                            </div>
                          </div>
                        </div>

                        <div className="text-end">
                          <div style={{ color: isSelected ? m.badgeColor : '#ffffff', fontWeight: 800, fontSize: '17px' }}>
                            {m.value}
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              color: m.badgeColor,
                              background: `${m.badgeColor}15`,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {m.badge}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Interactive Architectural Visual & Radar Screen */}
            <div className="col-lg-6 col-12">
              <div
                className="p-4 rounded-3 h-100 d-flex flex-column justify-content-between"
                style={{
                  background: 'rgba(5, 6, 8, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '340px',
                }}
              >
                {/* Visual Radar Grid SVG Graphic */}
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.18, pointerEvents: 'none' }}>
                  <svg width="280" height="280" viewBox="0 0 280 280">
                    <circle cx="140" cy="140" r="120" stroke="#00f2fe" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                    <circle cx="140" cy="140" r="80" stroke="#d40027" strokeWidth="1" fill="none" />
                    <circle cx="140" cy="140" r="40" stroke="#00f2fe" strokeWidth="1" fill="none" strokeDasharray="2 2" />
                    <line x1="140" y1="20" x2="140" y2="260" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                    <line x1="20" y1="140" x2="260" y2="140" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                    <circle cx={current.radarCoords.cx} cy={current.radarCoords.cy} r={current.radarCoords.r} fill="#00f2fe" />
                    <circle cx={current.radarCoords.cx} cy={current.radarCoords.cy} r="18" stroke="#00f2fe" strokeWidth="1" fill="none" opacity="0.6">
                      <animate attributeName="r" values="8;24;8" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>

                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FaServer size={13} style={{ color: current.badgeColor }} />
                    <span style={{ fontSize: '11px', color: current.badgeColor, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Diagnostic Inspection Target
                    </span>
                  </div>

                  <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>
                    {current.headline}
                  </h3>

                  <p style={{ color: 'rgba(255, 255, 255, 0.68)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '22px' }}>
                    {current.description}
                  </p>

                  {/* Diagnostic Gauges */}
                  <div className="row g-2 mb-3">
                    {current.diagnostics.map((d, dIdx) => (
                      <div key={dIdx} className="col-4">
                        <div
                          className="p-2 rounded text-center"
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '14px' }}>
                            {d.val}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '9.5px', fontWeight: 600, marginTop: '2px' }}>
                            {d.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="pt-3 d-flex align-items-center justify-content-between"
                  style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>
                    Direct Lead Architect Verification
                  </span>
                  <Link
                    href="/services/"
                    className="d-inline-flex align-items-center gap-1 text-decoration-none"
                    style={{ color: '#00f2fe', fontSize: '12px', fontWeight: 700 }}
                  >
                    <span>View Architecture Specs</span>
                    <FaArrowRight size={10} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustCapabilities;
