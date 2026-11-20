import React from 'react';
import Link from 'next/link';
import { FaLaptopCode, FaBrain, FaServer, FaChartLine, FaArrowRight, FaCodeBranch } from 'react-icons/fa6';

export const WhatWeBuild: React.FC = () => {
  const pillars = [
    {
      icon: <FaLaptopCode size={24} style={{ color: '#00f2fe' }} />,
      title: 'High-Performance Web Applications',
      tagline: 'Sub-second Next.js 16 and React 19 platforms engineered for conversion, search ranking, and instant mobile responsiveness.',
      points: [
        'Sub-500ms global TTFB using Edge Static Generation (ISR)',
        '100% Core Web Vitals adherence (zero layout shifts, instant INP)',
        'Headless CMS integrations (Payload, WordPress, Strapi)',
        'Pixel-perfect kinetic UI and responsive typography',
      ],
      linkText: 'Explore Web Architecture',
      href: '/services/react-development/',
    },
    {
      icon: <FaBrain size={24} style={{ color: '#d40027' }} />,
      title: 'Autonomous AI Workflows & RAG Systems',
      tagline: 'Production-grade AI automations, domain-specific assistants, and multi-agent reasoning chains connected to your real business data.',
      points: [
        'Retrieval-Augmented Generation (pgvector, Pinecone, hybrid search)',
        'Deterministic JSON schemas with zero-hallucination validation guards',
        'Multi-agent task orchestration for continuous market surveillance',
        'Automated document, receipt, and invoice vision extraction',
      ],
      linkText: 'Explore AI Automations',
      href: '/services/ai-automation/',
    },
    {
      icon: <FaServer size={24} style={{ color: '#10b981' }} />,
      title: 'Python & Backend Microservices',
      tagline: 'Robust, asynchronous FastAPI and Node.js backends built for high concurrency, rock-solid security, and seamless API integrations.',
      points: [
        'High-concurrency async endpoints with Pydantic & Zod validation',
        'Supabase, PostgreSQL and Redis caching architecture',
        'Webhook listeners and background Celery task queues',
        'Secure multi-tier authentication (JWT, MFA, OAuth2)',
      ],
      linkText: 'Explore Backend Engineering',
      href: '/services/python-engineering/',
    },
    {
      icon: <FaChartLine size={24} style={{ color: '#f59e0b' }} />,
      title: 'Technical SEO & Search Visibility Systems',
      tagline: 'Deep technical audits, semantic keyword mapping, and schema graph architectures that drive sustained, qualified organic inbound inquiries.',
      points: [
        'Comprehensive Core Web Vitals remediation and DOM slimming',
        'Dynamic XML sitemaps, robots configuration, and canonical guards',
        'Complete JSON-LD semantic graph (Service, FAQ, Organization)',
        'Topical authority clustering connecting articles to services',
      ],
      linkText: 'Explore Technical SEO',
      href: '/services/seo-services/',
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
            <FaCodeBranch size={12} style={{ color: '#d40027' }} />
            <span
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Solutions Architecture
            </span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            What We Help You Build
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
            We architect and build tailored digital systems from the ground up, eliminating manual overhead and turning your web presence into an active growth engine.
          </p>
        </div>

        <div className="row g-4">
          {pillars.map((item, idx) => (
            <div key={idx} className="col-lg-6 col-12 d-flex">
              <div
                className="w-100 p-4 p-md-5 rounded-4 d-flex flex-column justify-content-between"
                style={{
                  background: '#07080a',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </div>
                    <h3 style={{ fontSize: '22px', color: '#ffffff', fontWeight: 700, margin: 0 }}>
                      {item.title}
                    </h3>
                  </div>

                  <p
                    style={{
                      fontSize: '15px',
                      color: 'rgba(255, 255, 255, 0.75)',
                      lineHeight: 1.6,
                      marginBottom: '24px',
                    }}
                  >
                    {item.tagline}
                  </p>

                  <ul className="d-flex flex-column gap-2 mb-4 p-0" style={{ listStyle: 'none' }}>
                    {item.points.map((pt, pIdx) => (
                      <li key={pIdx} className="d-flex align-items-start gap-2" style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13.5px' }}>
                        <span style={{ color: '#d40027', fontWeight: 700 }}>•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <Link
                    href={item.href}
                    className="d-inline-flex align-items-center gap-2 text-decoration-none"
                    style={{ color: '#00f2fe', fontSize: '14px', fontWeight: 600 }}
                  >
                    <span>{item.linkText}</span>
                    <FaArrowRight size={12} />
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

export default WhatWeBuild;
