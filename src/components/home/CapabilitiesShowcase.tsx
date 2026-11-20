import React from 'react';
import Link from 'next/link';
import { FaLaptopCode, FaServer, FaBrain, FaArrowRight } from 'react-icons/fa6';

export const CapabilitiesShowcase: React.FC = () => {
  const architectures = [
    {
      icon: <FaLaptopCode size={24} className="text-accent" />,
      title: 'Headless Next.js Edge Architecture',
      domain: 'Modern Web Performance',
      description: 'Decoupling monolithic CMS backends into Next.js 15 App Router frontends hosted on edge CDN. Eliminates database query bottlenecks on page views, delivering instant sub-second response times worldwide while keeping familiar admin dashboards intact.',
      specs: ['Incremental Static Regeneration (ISR)', 'Next-Gen Image AVIF/WebP Transforms', 'Zero Layout Shift (0.00 CLS)', '<200ms Edge TTFB Worldwide'],
      ctaLink: '/services/react-development',
      ctaText: 'Explore Web Architecture',
    },
    {
      icon: <FaBrain size={24} className="text-accent" />,
      title: 'Private Grounded RAG & Multi-Agent Systems',
      domain: 'Enterprise AI & Automation',
      description: 'Designing retrieval-augmented pipelines that query internal PostgreSQL/pgvector databases to synthesize validated, deterministic business deliverables. Equipped with multi-model routing, prompt hardening, and zero-hallucination validation guards.',
      specs: ['Hybrid Vector & Full-Text Search', 'Strict Pydantic / Zod Output Schemas', 'Multi-Agent Task Delegation', 'Autonomous Daily Market Surveillance'],
      ctaLink: '/services/ai-automation',
      ctaText: 'Explore AI Automations',
    },
    {
      icon: <FaServer size={24} className="text-accent" />,
      title: 'High-Concurrency Python / FastAPI Microservices',
      domain: 'Backend & System Integration',
      description: 'Asynchronous microservice backends built with FastAPI and asyncpg, handling thousands of concurrent webhook events, background task queues (Celery/APScheduler), and third-party API integrations with comprehensive logging and error isolation.',
      specs: ['Asynchronous Non-Blocking IO', 'Zero-Downtime Deployment', 'Automated Daily Health Audits', 'Supabase & PostgreSQL Integration'],
      ctaLink: '/services/python-engineering',
      ctaText: 'Explore Backend Engineering',
    },
  ];

  return (
    <section className="py-5" style={{ background: '#0e1017', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container py-5">
        <div className="text-center max-w-3xl mx-auto mb-5">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Verified Blueprints</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', color: '#ffffff', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
            Architecture &amp; Capabilities Showcase
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
            We believe in complete transparency. Rather than displaying vague slogans, explore the verified architectural blueprints we design and deploy for real-world production.
          </p>
        </div>

        <div className="row g-4">
          {architectures.map((arch, idx) => (
            <div key={idx} className="col-lg-4 col-12 d-flex">
              <div 
                className="w-100 p-4 p-md-5 rounded-4 d-flex flex-column justify-content-between" 
                style={{ 
                  background: 'radial-gradient(circle at top left, #1a1e2b 0%, #10121a 100%)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="p-2 rounded-3" style={{ background: 'rgba(229, 57, 53, 0.12)' }}>
                      {arch.icon}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)' }}>
                      {arch.domain}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', color: '#ffffff', fontWeight: 700, marginBottom: '12px', lineHeight: 1.3 }}>
                    {arch.title}
                  </h3>

                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {arch.description}
                  </p>

                  <div className="mb-4">
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#e53935', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Key Architectural Benchmarks:
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {arch.specs.map((sp, sIdx) => (
                        <span 
                          key={sIdx} 
                          style={{ 
                            fontSize: '12px', 
                            padding: '3px 9px', 
                            borderRadius: '6px', 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            color: 'rgba(255, 255, 255, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.08)' 
                          }}
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3" style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <Link 
                    href={arch.ctaLink} 
                    className="d-inline-flex align-items-center gap-2 text-decoration-none"
                    style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}
                  >
                    <span>{arch.ctaText}</span>
                    <FaArrowRight size={12} className="text-accent" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
