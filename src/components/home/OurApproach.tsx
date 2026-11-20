'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaCompass,
  FaMagnifyingGlass,
  FaRoute,
  FaPenRuler,
  FaCode,
  FaVialCircleCheck,
  FaRocket,
  FaChartLine,
  FaArrowRight,
  FaCircleCheck,
  FaSliders,
} from 'react-icons/fa6';

export const OurApproach: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = [
    {
      num: '01',
      title: 'Discovery & Audit',
      duration: 'Days 1-2',
      icon: <FaCompass size={18} />,
      goal: 'Identify business goals, conversion metrics, target demographics, and current technical debt.',
      deliverables: ['Technical Architecture Audit', 'Competitive Landscape Matrix', 'Conversion Target Document'],
      gate: 'Aligned Business & Technical Blueprint',
    },
    {
      num: '02',
      title: 'Research & Feasibility',
      duration: 'Days 3-4',
      icon: <FaMagnifyingGlass size={18} />,
      goal: 'Evaluate modern libraries, benchmark API latencies, and stress-test external integrations.',
      deliverables: ['Tech Stack Selection Matrix', 'Third-Party API Latency Report', 'Data Model ERD Draft'],
      gate: 'Zero-Risk Architecture Validation',
    },
    {
      num: '03',
      title: 'System Architecture',
      duration: 'Days 5-7',
      icon: <FaRoute size={18} />,
      goal: 'Design resilient database schemas, caching boundaries, and zero-trust API perimeter specifications.',
      deliverables: ['Supabase / PostgreSQL Schema', 'OpenAPI & TypeScript Contracts', 'ISR Caching Strategy'],
      gate: 'Deterministic Schema & API Spec',
    },
    {
      num: '04',
      title: 'Interactive UI/UX',
      duration: 'Week 2',
      icon: <FaPenRuler size={18} />,
      goal: 'Craft high-converting desktop and mobile user journeys with tactile feedback and micro-interactions.',
      deliverables: ['Figma Design System & Tokens', 'Interactive Prototype Demos', 'Accessibility (a11y) Verification'],
      gate: 'Approved Visual & Interaction System',
    },
    {
      num: '05',
      title: 'Production Build',
      duration: 'Weeks 3-4',
      icon: <FaCode size={18} />,
      goal: 'Hand-craft clean, modular TypeScript frontends and high-throughput Python backends.',
      deliverables: ['Next.js 15 App Router Codebase', 'FastAPI & Pydantic Microservices', 'Automated CI/CD Workflows'],
      gate: '100% Strict TypeScript & Zero Lint Errors',
    },
    {
      num: '06',
      title: 'Stress & Edge Testing',
      duration: 'Week 5',
      icon: <FaVialCircleCheck size={18} />,
      goal: 'Audit Core Web Vitals, simulate high concurrent traffic spikes, and run end-to-end regression suites.',
      deliverables: ['Lighthouse 95+ Audit Report', 'Load & Stress Testing Benchmarks', 'OWASP Security Assessment'],
      gate: 'Green Core Web Vitals Guaranteed',
    },
    {
      num: '07',
      title: 'Zero-Downtime Deploy',
      duration: 'Week 6',
      icon: <FaRocket size={18} />,
      goal: 'Orchestrate seamless DNS cutover, edge caching warm-up, and live database migrations with 0 downtime.',
      deliverables: ['Vercel Edge Global Deployment', 'Automated SSL & Security Headers', 'Google Search Console Verification'],
      gate: 'Zero-Downtime Production Cutover',
    },
    {
      num: '08',
      title: 'Continuous Tuning',
      duration: 'Ongoing',
      icon: <FaChartLine size={18} />,
      goal: 'Analyze real-user metrics, monitor error telemetry, and continuously improve conversion rates.',
      deliverables: ['Real User Monitoring (RUM)', 'Conversion Funnel Telemetry', 'Monthly Architecture Refinements'],
      gate: 'Compounding Business Performance',
    },
  ];

  const current = stages[activeStage];

  return (
    <section
      id="approach"
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
            <FaRoute size={12} style={{ color: '#d40027' }} />
            <span
              style={{
                color: '#d40027',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Systematic Execution // 8-Stage Delivery Pipeline
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
            Our 8-Stage Engineering Flight Plan
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
            Click through each milestone in our production roadmap to review exact deliverables, verification gates, and timeframes.
          </p>
        </div>

        {/* INTERACTIVE TIMELINE STEPPER CONSOLE (NOT 8 cards!) */}
        <div
          className="rounded-4 overflow-hidden p-4 p-md-5"
          style={{
            background: 'linear-gradient(145deg, #0f121a 0%, #07080a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(0, 242, 254, 0.06)',
          }}
        >
          {/* Horizontal Stepper Ribbon with Progress Connection Line */}
          <div className="position-relative mb-5 pb-3">
            {/* Background connecting laser line */}
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: '4%',
                right: '4%',
                height: '2px',
                background: 'rgba(255, 255, 255, 0.12)',
                zIndex: 0,
              }}
              className="d-none d-lg-block"
            />
            {/* Active connecting laser beam */}
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: '4%',
                width: `${(activeStage / (stages.length - 1)) * 92}%`,
                height: '2px',
                background: 'linear-gradient(90deg, #d40027, #00f2fe)',
                boxShadow: '0 0 10px #00f2fe',
                zIndex: 0,
                transition: 'width 0.3s ease',
              }}
              className="d-none d-lg-block"
            />

            {/* Stepper Buttons */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 position-relative" style={{ zIndex: 1 }}>
              {stages.map((s, idx) => {
                const isSelected = activeStage === idx;
                const isPast = activeStage > idx;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setActiveStage(idx)}
                    className="border-0 d-flex flex-column align-items-center gap-2 p-2 rounded-3"
                    style={{
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flex: '1 1 0',
                      minWidth: '70px',
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: isSelected ? '#d40027' : (isPast ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                        border: isSelected ? '2px solid #ffffff' : (isPast ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.15)'),
                        color: isSelected ? '#ffffff' : (isPast ? '#00f2fe' : 'rgba(255, 255, 255, 0.5)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isSelected ? '0 0 20px rgba(212, 0, 39, 0.6)' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {s.icon}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.num}. {s.title.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Inspector Card for Selected Stage */}
          <div
            className="p-4 rounded-3"
            style={{
              background: 'rgba(5, 6, 8, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="row g-4 align-items-center">
              <div className="col-lg-6 col-12">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#d40027',
                      background: 'rgba(212, 0, 39, 0.12)',
                      border: '1px solid rgba(212, 0, 39, 0.3)',
                      padding: '3px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    STAGE {current.num} // {current.duration}
                  </span>
                  <span style={{ fontSize: '12px', color: '#00f2fe', fontWeight: 600 }}>
                    Gate: {current.gate}
                  </span>
                </div>

                <h3 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
                  {current.title}
                </h3>

                <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
                  {current.goal}
                </p>
              </div>

              <div className="col-lg-6 col-12">
                <div
                  className="p-3 rounded"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>
                    Verified Deliverables &amp; Artifacts
                  </span>
                  <div className="d-flex flex-column gap-2">
                    {current.deliverables.map((d, dIdx) => (
                      <div key={dIdx} className="d-flex align-items-center gap-2">
                        <FaCircleCheck size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600 }}>
                          {d}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Footer Controls */}
            <div
              className="mt-4 pt-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <button
                type="button"
                onClick={() => setActiveStage(Math.max(0, activeStage - 1))}
                disabled={activeStage === 0}
                className="border-0 bg-transparent text-white d-inline-flex align-items-center gap-2"
                style={{
                  opacity: activeStage === 0 ? 0.3 : 1,
                  cursor: activeStage === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                <span>← Previous Stage</span>
              </button>

              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>
                Step {activeStage + 1} of {stages.length}
              </span>

              <button
                type="button"
                onClick={() => setActiveStage(Math.min(stages.length - 1, activeStage + 1))}
                disabled={activeStage === stages.length - 1}
                className="border-0 bg-transparent text-white d-inline-flex align-items-center gap-2"
                style={{
                  opacity: activeStage === stages.length - 1 ? 0.3 : 1,
                  cursor: activeStage === stages.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#00f2fe',
                }}
              >
                <span>Next Stage →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurApproach;
