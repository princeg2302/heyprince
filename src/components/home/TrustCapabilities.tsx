import React from 'react';
import { FaBolt, FaShieldHalved, FaCode, FaMicrochip } from 'react-icons/fa6';

export const TrustCapabilities: React.FC = () => {
  const capabilities = [
    {
      icon: <FaBolt size={22} className="text-accent" />,
      title: 'Sub-Second Global TTFB',
      description: 'Edge-rendered Next.js frontends deploying incremental static regeneration for sub-500ms real-world page loads worldwide.',
      metric: '< 500ms',
      metricLabel: 'Edge Response',
    },
    {
      icon: <FaShieldHalved size={22} className="text-accent" />,
      title: 'Production-Hardened Security',
      description: 'Zero-trust perimeter architecture, encrypted environment secrets, strict CORS headers, and resilient rate limiting on every API endpoint.',
      metric: '100%',
      metricLabel: 'Security Posture',
    },
    {
      icon: <FaCode size={22} className="text-accent" />,
      title: 'Zero-Template Custom Code',
      description: 'Clean, modular TypeScript and Python microservices built to your exact business specifications with zero bloated off-the-shelf theme bloat.',
      metric: 'Bespoke',
      metricLabel: 'Hand-Crafted',
    },
    {
      icon: <FaMicrochip size={22} className="text-accent" />,
      title: 'Autonomous AI Integration',
      description: 'Deterministic RAG pipelines, multi-agent orchestration, and private LLM reasoning chains grounded in your proprietary databases.',
      metric: '10x',
      metricLabel: 'Workflow Speed',
    },
  ];

  return (
    <section className="py-5" style={{ background: '#14161d', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container py-4">
        <div className="row g-4 align-items-center mb-4">
          <div className="col-lg-6">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(229, 57, 53, 0.12)', border: '1px solid rgba(229, 57, 53, 0.3)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e53935' }}></span>
              <span style={{ color: '#e53935', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Engineering Standards</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: '#ffffff', fontWeight: 800, lineHeight: 1.2 }}>
              Built for Speed, Reliability &amp; Measurable Business Impact
            </h2>
          </div>
          <div className="col-lg-6">
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '17px', lineHeight: 1.7, margin: 0 }}>
              We don’t rely on generic page-builder themes or bloated plugin stacks that slow your website to a crawl. Every system we ship is hand-crafted with modern web primitives, strict typing, and verifiable performance benchmarks.
            </p>
          </div>
        </div>

        <div className="row g-4 pt-3">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="col-lg-3 col-md-6 col-12 d-flex">
              <div 
                className="w-100 p-4 rounded-4" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="p-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      {cap.icon}
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#e53935', fontFamily: 'var(--font-futuru)' }}>
                      {cap.metric}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', color: '#ffffff', fontWeight: 700, marginBottom: '10px' }}>
                    {cap.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
                    {cap.description}
                  </p>
                </div>
                <div className="pt-3 mt-3" style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.1)', fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
