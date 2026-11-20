'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaLaptopCode,
  FaRobot,
  FaCartShopping,
  FaMicrochip,
  FaChartLine,
  FaArrowRight,
  FaBolt,
  FaNetworkWired,
  FaDatabase,
  FaCloud,
  FaCodeBranch,
} from 'react-icons/fa6';

export const WhatWeBuild: React.FC = () => {
  const [activeArchetype, setActiveArchetype] = useState<number>(0);

  const archetypes = [
    {
      id: 0,
      number: '01',
      title: 'Sub-Second Next.js Web Platforms',
      short: 'Edge Web Platforms',
      icon: <FaLaptopCode size={20} />,
      tagline: 'Instant page transitions with zero client bundle bloat.',
      description: 'We architect React 19 and Next.js 15 platforms deploying Incremental Static Regeneration, React Server Components, and edge middleware. Every page load is sub-500ms worldwide.',
      tech: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind', 'Vercel Edge'],
      diagram: {
        node1: 'Client Browser',
        node2: 'Edge CDN (ISR)',
        node3: 'React Server Comp',
        node4: 'PostgreSQL DB',
        latency: '240ms Global TTFB',
      },
    },
    {
      id: 1,
      number: '02',
      title: 'Headless Commerce & Shopify Engines',
      short: 'Headless Commerce',
      icon: <FaCartShopping size={20} />,
      tagline: 'Custom checkout funnels with 3x higher mobile conversion.',
      description: 'Decoupled storefronts powered by Shopify Storefront API, custom cart state engines, and headless CMS integrations. Eliminate slow theme plugins and unlock bespoke buyer journeys.',
      tech: ['Shopify Storefront API', 'Next.js Commerce', 'GraphQL', 'Stripe', 'Zustand'],
      diagram: {
        node1: 'Buyer Device',
        node2: 'Headless Edge PWA',
        node3: 'Shopify GraphQL',
        node4: 'Global Fulfillment',
        latency: '3.2x Mobile Conversion',
      },
    },
    {
      id: 2,
      number: '03',
      title: 'Autonomous AI & Multi-Agent Workflows',
      short: 'Autonomous AI Agents',
      icon: <FaRobot size={20} />,
      tagline: 'Private RAG systems and autonomous research bots.',
      description: 'Multi-agent orchestration pipelines that execute background business research, lead discovery, content drafting, and automated client qualification without manual babysitting.',
      tech: ['LangGraph', 'OpenAI & Gemini API', 'Python 3.12', 'pgvector', 'Playwright'],
      diagram: {
        node1: 'Scheduled Trigger',
        node2: 'Agent Reasoning Loop',
        node3: 'Vector Memory (RAG)',
        node4: 'Action & Supabase Write',
        latency: '100% Deterministic Execution',
      },
    },
    {
      id: 3,
      number: '04',
      title: 'High-Throughput Python & FastAPI Backends',
      short: 'Python & FastAPI APIs',
      icon: <FaMicrochip size={20} />,
      tagline: 'Asynchronous microservices handling millions of records.',
      description: 'Resilient asynchronous REST and WebSocket backends engineered with FastAPI, Pydantic, Redis task queues, and automated Celery workers for demanding data pipelines.',
      tech: ['Python 3.12 (asyncio)', 'FastAPI', 'Pydantic v2', 'Redis', 'Docker'],
      diagram: {
        node1: 'API Client / Webhook',
        node2: 'FastAPI Gateway',
        node3: 'Async Worker Queue',
        node4: 'Supabase / PostgreSQL',
        latency: '< 18ms Query Duration',
      },
    },
    {
      id: 4,
      number: '05',
      title: 'Enterprise Technical SEO & Speed Architecture',
      short: 'Technical SEO Engine',
      icon: <FaChartLine size={20} />,
      tagline: 'Green 100 Core Web Vitals and programmatic schema indexing.',
      description: 'Complete elimination of render-blocking scripts, cumulative layout shift, and slow interaction latencies. Automated JSON-LD structured data and dynamic sitemaps for maximum Google visibility.',
      tech: ['Schema.org JSON-LD', 'Core Web Vitals', 'Dynamic OpenGraph', 'ISR Cache Tags'],
      diagram: {
        node1: 'Googlebot Crawler',
        node2: 'Edge Static HTML',
        node3: 'Structured Graph Entity',
        node4: 'Rank 1 SERP Index',
        latency: '100/100 Core Web Vitals',
      },
    },
  ];

  const current = archetypes[activeArchetype];

  return (
    <section
      id="what-we-build"
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
            <FaNetworkWired size={12} style={{ color: '#d40027' }} />
            <span
              style={{
                color: '#d40027',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Engineering Archetypes // Production Scope
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
            What We Help You Build
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
            Select an architecture to inspect its technical pipeline, data flow topology, and real-world performance benchmarks.
          </p>
        </div>

        {/* INTERACTIVE BLUEPRINT STUDIO (NOT generic cards!) */}
        <div
          className="rounded-4 overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #0f121a 0%, #07080a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
          }}
        >
          <div className="row g-0">
            {/* Left Column: Archetype Navigation Selector */}
            <div
              className="col-lg-5 col-12 p-4 p-md-5"
              style={{
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(9, 11, 16, 0.6)',
              }}
            >
              <div className="d-flex flex-column gap-2">
                {archetypes.map((item) => {
                  const isActive = activeArchetype === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveArchetype(item.id)}
                      className="p-3 rounded-3 cursor-pointer d-flex align-items-center justify-content-between"
                      style={{
                        background: isActive ? 'rgba(212, 0, 39, 0.14)' : 'transparent',
                        border: isActive ? '1px solid #d40027' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: isActive ? '#d40027' : 'rgba(255, 255, 255, 0.35)',
                          }}
                        >
                          {item.number}
                        </span>
                        <div>
                          <div
                            style={{
                              color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                              fontWeight: 700,
                              fontSize: '15px',
                            }}
                          >
                            {item.short}
                          </div>
                          <div
                            style={{
                              color: 'rgba(255, 255, 255, 0.45)',
                              fontSize: '12px',
                            }}
                          >
                            {item.tagline}
                          </div>
                        </div>
                      </div>

                      <div style={{ color: isActive ? '#d40027' : 'rgba(255, 255, 255, 0.2)' }}>
                        <FaArrowRight size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Interactive Architecture Blueprint Visualizer */}
            <div className="col-lg-7 col-12 p-4 p-md-5 d-flex flex-column justify-content-between">
              <div>
                {/* Header of Active Architecture */}
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(0, 242, 254, 0.1)',
                        color: '#00f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                      }}
                    >
                      {current.icon}
                    </span>
                    <div>
                      <span style={{ fontSize: '11px', color: '#00f2fe', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Active Blueprint Model
                      </span>
                      <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 800, margin: 0 }}>
                        {current.title}
                      </h3>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontWeight: 700,
                    }}
                  >
                    ● {current.diagram.latency}
                  </span>
                </div>

                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                  {current.description}
                </p>

                {/* Visual Architecture Flow Diagram (SVG Nodes & Data Stream) */}
                <div
                  className="p-3 rounded-3 mb-4"
                  style={{
                    background: 'rgba(5, 6, 8, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Topology Data Stream
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#d40027', fontWeight: 700 }}>
                      Zero Cold Starts
                    </span>
                  </div>

                  {/* Visual Node Flow */}
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 py-2">
                    {[current.diagram.node1, current.diagram.node2, current.diagram.node3, current.diagram.node4].map((node, nIdx) => (
                      <React.Fragment key={nIdx}>
                        <div
                          className="px-3 py-2 rounded text-center"
                          style={{
                            background: nIdx === 0 ? 'rgba(255, 255, 255, 0.05)' : (nIdx === 3 ? 'rgba(212, 0, 39, 0.15)' : 'rgba(0, 242, 254, 0.08)'),
                            border: `1px solid ${nIdx === 3 ? '#d40027' : (nIdx === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 242, 254, 0.25)')}`,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#ffffff',
                          }}
                        >
                          {node}
                        </div>
                        {nIdx < 3 && (
                          <div style={{ color: '#00f2fe', fontSize: '10px' }}>➔</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Tech Stack Badges */}
                <div className="mb-4">
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    Core Engineering Stack
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    {current.tech.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '11px',
                          color: '#ffffff',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div
                className="pt-3 d-flex align-items-center justify-content-between"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
              >
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                  Deployable as a Standalone or Integrated Solution
                </span>
                <Link
                  href="/services/"
                  className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill text-decoration-none"
                  style={{
                    background: '#d40027',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <span>Explore Blueprint</span>
                  <FaArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatWeBuild;
