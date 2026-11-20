import React from 'react';
import { FaCompass } from 'react-icons/fa6';

export const OurApproach: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Discover',
      desc: 'We audit your existing application, database architecture, bottlenecks, and commercial goals to identify high-impact technical objectives.',
    },
    {
      num: '02',
      title: 'Research',
      desc: 'Deep technical research into user search intent, performance benchmarks, competitor tech stacks, and edge-case integration requirements.',
    },
    {
      num: '03',
      title: 'Plan',
      desc: 'Defining strict data schemas, API contracts, milestone roadmaps, infrastructure budgets, and verifiable deliverable checklists.',
    },
    {
      num: '04',
      title: 'Design',
      desc: 'Crafting responsive, high-converting UX with clean typographic hierarchy, accessible color palettes, and kinetic tactile interactions.',
    },
    {
      num: '05',
      title: 'Develop',
      desc: 'Engineering clean, modular TypeScript, Next.js, and Python codebases adhering to strict linting, typing, and architectural separation.',
    },
    {
      num: '06',
      title: 'Test',
      desc: 'Rigorous end-to-end testing, Core Web Vitals profiling, security vulnerability audits, and cross-browser stress benchmarks.',
    },
    {
      num: '07',
      title: 'Launch',
      desc: 'Seamless zero-downtime cutover, edge CDN caching warmup, DNS propagation verification, and live production error telemetry.',
    },
    {
      num: '08',
      title: 'Improve',
      desc: 'Continuous real-user performance monitoring, search indexing analysis, conversion optimization, and proactive feature enhancements.',
    },
  ];

  return (
    <section className="py-5" style={{ background: '#12141c', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container py-5">
        <div className="text-center max-w-3xl mx-auto mb-5">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <FaCompass size={13} className="text-accent" />
            <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Engineering Discipline</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', color: '#ffffff', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
            Our 8-Stage Delivery Lifecycle
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
            We do not guess, skip steps, or push unverified code. Every engagement follows a disciplined, transparent engineering methodology.
          </p>
        </div>

        <div className="row g-4">
          {steps.map((st, idx) => (
            <div key={idx} className="col-lg-3 col-md-6 col-12 d-flex">
              <div 
                className="w-100 p-4 rounded-4" 
                style={{ 
                  background: '#181b24', 
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s ease',
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span 
                      style={{ 
                        fontFamily: 'var(--font-futuru)', 
                        fontSize: '28px', 
                        fontWeight: 900, 
                        color: '#e53935' 
                      }}
                    >
                      {st.num}
                    </span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.3)' }}></span>
                  </div>
                  <h3 style={{ fontSize: '19px', color: '#ffffff', fontWeight: 700, marginBottom: '10px' }}>
                    {st.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
                    {st.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
