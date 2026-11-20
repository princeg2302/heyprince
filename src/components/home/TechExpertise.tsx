import React from 'react';
import { FaLayerGroup } from 'react-icons/fa6';

export const TechExpertise: React.FC = () => {
  const categories = [
    {
      category: 'Frontend & Web Architecture',
      techs: ['Next.js 15 / 16 (App Router)', 'React 19', 'TypeScript', 'Tailwind CSS', 'GSAP & Lenis', 'Progressive Web Apps'],
      desc: 'Sub-second rendering, server components, and responsive mobile-first interfaces.',
    },
    {
      category: 'Backend & High-Concurrency APIs',
      techs: ['Python 3.12 & FastAPI', 'Node.js & Express', 'Pydantic & Zod Data Validation', 'Asynchronous Task Queues', 'REST & GraphQL APIs'],
      desc: 'High-throughput microservices designed for scalability and strict data contract guarantees.',
    },
    {
      category: 'Database & Cloud Storage',
      techs: ['PostgreSQL & Supabase', 'Cloudflare R2 Object Storage', 'pgvector & Vector Indexes', 'Redis Caching', 'Payload CMS'],
      desc: 'ACID-compliant relational architectures and vector storage for intelligent search and retrieval.',
    },
    {
      category: 'AI Automations & LLM Systems',
      techs: ['Gemini 1.5 / 2.0 API', 'Claude 3.5 Sonnet', 'Retrieval-Augmented Generation (RAG)', 'LangChain & LlamaIndex', 'Autonomous Multi-Agent Workflows'],
      desc: 'Grounded intelligence systems with zero-hallucination validation guards.',
    },
    {
      category: 'Cloud Infrastructure & DevOps',
      techs: ['Vercel Edge Network', 'Cloudflare DNS & WAF', 'Docker Containerization', 'GitHub Actions CI/CD', 'Real-Time Error Telemetry'],
      desc: 'Automated deployment pipelines with edge-level caching, SSL hardening, and automated tests.',
    },
    {
      category: 'Search & Performance Engineering',
      techs: ['Core Web Vitals Remediation', 'Lighthouse 95+ Audits', 'JSON-LD Schema Graphs', 'Semantic Keyword Clustering', 'Canonical & Robots Architecture'],
      desc: 'Technical SEO foundations engineered directly into the application code.',
    },
  ];

  return (
    <section className="py-5" style={{ background: '#0e1017', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container py-5">
        <div className="text-center max-w-3xl mx-auto mb-5">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <FaLayerGroup size={13} className="text-accent" />
            <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Verified Capabilities</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', color: '#ffffff', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
            Technologies &amp; Expertise We Command
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
            We only offer technologies we build with every day in production. No buzzword padding; only proven modern tools.
          </p>
        </div>

        <div className="row g-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="col-lg-4 col-md-6 col-12 d-flex">
              <div 
                className="w-100 p-4 rounded-4 d-flex flex-column justify-content-between" 
                style={{ 
                  background: '#151722', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'border-color 0.3s ease',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '19px', color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>
                    {cat.category}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5, marginBottom: '16px' }}>
                    {cat.desc}
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    {cat.techs.map((t, tIdx) => (
                      <span 
                        key={tIdx} 
                        style={{ 
                          fontSize: '12px', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          background: 'rgba(255, 255, 255, 0.06)', 
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontWeight: 500,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
