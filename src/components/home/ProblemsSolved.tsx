'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaTriangleExclamation,
  FaCircleCheck,
  FaBolt,
  FaArrowRight,
  FaGaugeHigh,
  FaClock,
  FaShieldHalved,
  FaArrowsRotate,
  FaSliders,
} from 'react-icons/fa6';

export const ProblemsSolved: React.FC = () => {
  const [viewMode, setViewMode] = useState<'solution' | 'problem'>('solution');

  const comparisons = [
    {
      domain: 'Website & App Speed',
      problem: {
        headline: '4+ Second Sluggish Monoliths',
        impact: 'High bounce rate, failing Core Web Vitals, customer churn before first paint.',
        metric: '3.8s TTFB',
        metricColor: '#ef4444',
      },
      solution: {
        headline: 'Sub-500ms Edge Architecture',
        impact: 'Pre-rendered ISR on global edge CDN with sub-second page transitions.',
        metric: '< 380ms TTFB',
        metricColor: '#10b981',
      },
    },
    {
      domain: 'Business Operations',
      problem: {
        headline: 'Manual Data Entry & Copy-Paste Hell',
        impact: 'Team spends 20+ hours weekly exporting CSVs and retyping records.',
        metric: '20 hrs/week lost',
        metricColor: '#ef4444',
      },
      solution: {
        headline: 'Autonomous Python & AI Workflows',
        impact: 'Background workers sync CRM, qualify leads, and scrape data automatically.',
        metric: '0 manual hours',
        metricColor: '#10b981',
      },
    },
    {
      domain: 'Code Quality & Tech Debt',
      problem: {
        headline: 'Bloated Off-the-Shelf Themes',
        impact: '40+ third-party plugins conflicting with each other, breaking on updates.',
        metric: 'Fragile & Slow',
        metricColor: '#ef4444',
      },
      solution: {
        headline: 'Hand-Crafted Modular Codebase',
        impact: 'Bespoke TypeScript microservices with zero bloat and 100% code ownership.',
        metric: '100% Bespoke',
        metricColor: '#10b981',
      },
    },
    {
      domain: 'E-Commerce Conversion',
      problem: {
        headline: 'Confusing, High-Friction Checkout',
        impact: '78% shopping cart abandonment due to sluggish mobile checkout funnels.',
        metric: '78% Abandonment',
        metricColor: '#ef4444',
      },
      solution: {
        headline: 'Headless Single-Page Checkout',
        impact: 'Instant cart slide-outs and 1-tap checkout yielding 3x higher conversion.',
        metric: '3.2x Conversion',
        metricColor: '#10b981',
      },
    },
  ];

  return (
    <section
      id="problems-solved"
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
            <FaArrowsRotate size={12} style={{ color: '#d40027' }} />
            <span
              style={{
                color: '#d40027',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Friction Diagnosis // Solution Matrix
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
            The Broken Reality vs. The HeyPrince Standard
          </h2>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.68)',
              fontSize: '16px',
              maxWidth: '650px',
              margin: '0 auto 24px',
              lineHeight: 1.6,
            }}
          >
            Toggle between the common technical bottlenecks businesses suffer from and how our engineering architecture permanently fixes them.
          </p>

          {/* Interactive Toggle Switch */}
          <div className="d-inline-flex p-1 rounded-pill" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <button
              type="button"
              onClick={() => setViewMode('solution')}
              className="px-4 py-2 rounded-pill border-0 d-inline-flex align-items-center gap-2"
              style={{
                background: viewMode === 'solution' ? '#10b981' : 'transparent',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              <FaCircleCheck size={12} />
              <span>The HeyPrince Standard (Fixed)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('problem')}
              className="px-4 py-2 rounded-pill border-0 d-inline-flex align-items-center gap-2"
              style={{
                background: viewMode === 'problem' ? '#d40027' : 'transparent',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              <FaTriangleExclamation size={12} />
              <span>The Broken Reality (Before)</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE COMPARISON MATRIX (NOT generic cards!) */}
        <div
          className="rounded-4 overflow-hidden p-4 p-md-5"
          style={{
            background: viewMode === 'solution'
              ? 'linear-gradient(145deg, #0d1614 0%, #07080a 100%)'
              : 'linear-gradient(145deg, #180d0f 0%, #07080a 100%)',
            border: viewMode === 'solution'
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(212, 0, 39, 0.3)',
            boxShadow: viewMode === 'solution'
              ? '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(16, 185, 129, 0.1)'
              : '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(212, 0, 39, 0.15)',
            transition: 'all 0.35s ease',
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: viewMode === 'solution' ? '#10b981' : '#d40027' }}>
              CURRENT SCANNER VIEW: {viewMode === 'solution' ? 'MODERN OPTIMIZED ARCHITECTURE' : 'TRADITIONAL VENDOR PITFALLS'}
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>
              Click toggle above to compare states
            </span>
          </div>

          <div className="row g-4">
            {comparisons.map((c, idx) => {
              const active = viewMode === 'solution' ? c.solution : c.problem;
              const isSolution = viewMode === 'solution';
              return (
                <div key={idx} className="col-lg-6 col-12">
                  <div
                    className="p-4 rounded-3 h-100 d-flex flex-column justify-content-between"
                    style={{
                      background: 'rgba(5, 6, 8, 0.85)',
                      border: `1px solid ${isSolution ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 0, 39, 0.2)'}`,
                    }}
                  >
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#00f2fe', letterSpacing: '1px' }}>
                          0{idx + 1} // {c.domain}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: active.metricColor,
                            background: `${active.metricColor}15`,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: `1px solid ${active.metricColor}30`,
                          }}
                        >
                          {active.metric}
                        </span>
                      </div>

                      <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                        {active.headline}
                      </h3>

                      <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13.5px', lineHeight: 1.55, margin: 0 }}>
                        {active.impact}
                      </p>
                    </div>

                    <div
                      className="pt-3 mt-3 d-flex align-items-center justify-content-between"
                      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
                    >
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
                        {isSolution ? 'Permanent Root-Cause Resolution' : 'Fragile Symptom Band-Aid'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isSolution ? '#10b981' : '#d40027' }}>
                        {isSolution ? '✓ Production Verified' : '⚠ High Risk'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Conversion Strip */}
          <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginRight: '16px' }}>
              Facing these bottlenecks in your current website or operations?
            </span>
            <Link
              href="/contact/"
              className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill text-decoration-none"
              style={{
                background: '#d40027',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <span>Get an Engineering Audit</span>
              <FaArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSolved;
