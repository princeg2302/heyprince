import React from 'react';
import { FaLayerGroup } from 'react-icons/fa6';

export const TechExpertise: React.FC = () => {
  const categories = [
    {
      category: 'Frontend & UI Frameworks',
      desc: 'Next.js 16, React 19, TypeScript, Tailwind CSS, Sass, Framer Motion, HTML5 Web Standards.',
      focus: 'Sub-second rendering, kinetic animations, and rock-solid cross-device responsive layouts.',
    },
    {
      category: 'Backend & Microservices',
      desc: 'Python 3.12, FastAPI, Node.js, Express, PHP 8.3, Celery, RESTful Endpoints, GraphQL, SSE.',
      focus: 'Asynchronous concurrency, deterministic request validation, and zero-leakage security boundaries.',
    },
    {
      category: 'Databases & In-Memory Stores',
      desc: 'PostgreSQL, Supabase, pgvector, Redis, SQLite, Cloudflare R2, AWS S3 Object Storage.',
      focus: 'Normalized relational schemas, millisecond query indexation, and vector search scalability.',
    },
    {
      category: 'AI & Machine Learning Systems',
      desc: 'Google Gemini 2.5, Anthropic Claude 3.7, OpenAI API, LangChain, LlamaIndex, Pydantic, Zod.',
      focus: 'Private enterprise RAG, deterministic schemas, automated OCR, and zero-hallucination guards.',
    },
    {
      category: 'DevOps & Global Edge Networks',
      desc: 'Vercel Edge Network, Cloudflare DNS & CDN, GitHub Actions CI/CD, Docker, SSL Automation.',
      focus: 'Automated deployment pipelines, edge-level caching rules, and sub-500ms global TTFB.',
    },
    {
      category: 'Technical Search & Growth',
      desc: 'Google Lighthouse CI, Chrome DevTools Profiler, JSON-LD Schema Graphs, Canonical Audits.',
      focus: '100% Core Web Vitals adherence, zero layout shift (CLS), and sustainable organic visibility.',
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
            <FaLayerGroup size={12} style={{ color: '#d40027' }} />
            <span
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Verified Capabilities
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
            Technologies &amp; Expertise We Command
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
            We only offer technologies we build with every day in production. No buzzword padding; only proven modern tools.
          </p>
        </div>

        <div className="row g-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="col-lg-4 col-md-6 col-12 d-flex">
              <div
                className="w-100 p-4 rounded-4 d-flex flex-column justify-content-between agency-card-dark"
              >
                <div>
                  <h3 style={{ fontSize: '18px', color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>
                    {cat.category}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#00f2fe', lineHeight: 1.5, marginBottom: '14px', fontWeight: 500 }}>
                    {cat.desc}
                  </p>
                </div>
                <div
                  className="pt-3"
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '12.5px',
                    color: 'rgba(255, 255, 255, 0.65)',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: '#ffffff' }}>Focus:</strong> {cat.focus}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechExpertise;
