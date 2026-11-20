import React from 'react';
import Link from 'next/link';
import { FaLaptopCode, FaBrain, FaServer, FaArrowRight, FaCodeBranch } from 'react-icons/fa6';

export const CapabilitiesShowcase: React.FC = () => {
  const blueprints = [
    {
      title: 'Headless Next.js & Shopify Storefront',
      badge: 'Architecture 01',
      badgeColor: '#00f2fe',
      icon: <FaLaptopCode size={22} style={{ color: '#00f2fe' }} />,
      desc: 'Decoupled edge storefront loading product catalogs in sub-500ms using Shopify Storefront GraphQL API, ISR, and Stripe payment funnels.',
      specs: [
        'Incremental Static Regeneration (ISR) with edge revalidation',
        'Zod-validated client cart state with local persistence',
        'Stripe Checkout and localized multi-currency webhooks',
        'Zero Cumulative Layout Shift (CLS < 0.05)',
      ],
      link: '/services/ecommerce-solutions/',
    },
    {
      title: 'Grounded RAG Pipeline & Multi-Agent Consensus',
      badge: 'Architecture 02',
      badgeColor: '#d40027',
      icon: <FaBrain size={22} style={{ color: '#d40027' }} />,
      desc: 'Deterministic LLM retrieval architecture connecting internal databases to vector embeddings with hallucination guardrails and automated retries.',
      specs: [
        'pgvector hybrid search combining full-text BM25 + dense embeddings',
        'Pydantic schema enforcement on all LLM structured responses',
        'Chief of Staff multi-agent consensus validation chain',
        'Streaming token response over Server-Sent Events (SSE)',
      ],
      link: '/services/ai-automation/',
    },
    {
      title: 'Async Python FastAPI Microservice Architecture',
      badge: 'Architecture 03',
      badgeColor: '#10b981',
      icon: <FaServer size={22} style={{ color: '#10b981' }} />,
      desc: 'High-throughput asynchronous backend processing real-time webhooks, OCR document ingestion, and distributed job queues.',
      specs: [
        'Asynchronous non-blocking endpoints executing in sub-50ms',
        'Celery worker queue backed by Redis in-memory broker',
        'Strict JWT authentication and role-based access control',
        'Continuous health monitoring and automated regression suites',
      ],
      link: '/services/python-engineering/',
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
            <FaCodeBranch size={12} style={{ color: '#00f2fe' }} />
            <span
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Architectural Blueprints
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
            Verified Production Systems
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
            A technical look into the architectural blueprints we engineer. Built for speed, scale, and high business leverage.
          </p>
        </div>

        <div className="row g-4">
          {blueprints.map((bp, idx) => (
            <div key={idx} className="col-lg-4 col-md-6 col-12 d-flex">
              <div
                className="w-100 p-4 p-md-5 rounded-4 d-flex flex-column justify-content-between agency-card-dark"
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {bp.icon}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: bp.badgeColor,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {bp.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', color: '#ffffff', fontWeight: 700, marginBottom: '12px', lineHeight: 1.3 }}>
                    {bp.title}
                  </h3>

                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {bp.desc}
                  </p>

                  <ul className="d-flex flex-column gap-2 mb-4 p-0" style={{ listStyle: 'none' }}>
                    {bp.specs.map((spec, sIdx) => (
                      <li key={sIdx} className="d-flex align-items-start gap-2" style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>
                        <span style={{ color: bp.badgeColor, fontWeight: 700 }}>✓</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <Link
                    href={bp.link}
                    className="d-inline-flex align-items-center gap-2 text-decoration-none"
                    style={{ color: '#ffffff', fontSize: '13.5px', fontWeight: 600 }}
                  >
                    <span>View Engineering Scope</span>
                    <FaArrowRight size={11} style={{ color: bp.badgeColor }} />
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

export default CapabilitiesShowcase;
