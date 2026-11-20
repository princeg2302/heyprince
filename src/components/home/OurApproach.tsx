import React from 'react';
import { FaCompass } from 'react-icons/fa6';

export const OurApproach: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Discover',
      desc: 'Uncompromising technical audit of your current stack, database architecture, bottlenecks, and commercial objectives.',
    },
    {
      num: '02',
      title: 'Research',
      desc: 'Benchmarking performance baselines, competitor infrastructure, high-converting patterns, and emerging technologies.',
    },
    {
      num: '03',
      title: 'Plan',
      desc: 'Architecture blueprint design, typed API schemas, entity-relationship diagrams, and milestone delivery commitments.',
    },
    {
      num: '04',
      title: 'Design',
      desc: 'High-contrast, responsive component prototypes built in Figma with production-ready tokens and WCAG AA accessibility.',
    },
    {
      num: '05',
      title: 'Develop',
      desc: 'Writing clean, strictly typed TypeScript and Python code with modular service boundaries and sub-second execution.',
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
    <section
      className="py-5"
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="container py-5">
        <div className="text-center max-w-3xl mx-auto mb-5">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <FaCompass size={12} style={{ color: '#00f2fe' }} />
            <span
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Engineering Discipline
            </span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(32px, 4vw, 46px)',
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            Our 8-Stage Engineering Lifecycle
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '17px',
              lineHeight: 1.6,
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            From the initial system discovery to continuous post-launch optimization, every step follows disciplined engineering practices.
          </p>
        </div>

        <div className="row g-4">
          {steps.map((st, idx) => (
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
                    <span
                      style={{
                        fontFamily: 'var(--font-futuru)',
                        fontSize: '26px',
                        fontWeight: 900,
                        color: '#d40027',
                      }}
                    >
                      {st.num}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        color: '#00f2fe',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        background: 'rgba(0, 242, 254, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: '1px solid rgba(0, 242, 254, 0.2)',
                      }}
                    >
                      Stage {st.num}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>
                    {st.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
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

export default OurApproach;
