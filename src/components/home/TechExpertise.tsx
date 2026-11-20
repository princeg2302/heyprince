'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaTerminal,
  FaReact,
  FaPython,
  FaDatabase,
  FaRobot,
  FaCloud,
  FaArrowRight,
  FaCode,
  FaCheck,
  FaCopy,
} from 'react-icons/fa6';

export const TechExpertise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'frontend' | 'backend' | 'ai' | 'cloud'>('frontend');
  const [copied, setCopied] = useState(false);

  const stackData = {
    frontend: {
      category: 'Frontend & Edge Architecture',
      command: 'pnpm dlx create-next-app@latest --typescript --tailwind --app',
      rationale: 'Sub-500ms Edge rendering with React 19 Server Components, zero-bundle streaming, and Incremental Static Regeneration.',
      technologies: [
        { name: 'Next.js 15 (App Router)', version: 'v15.2', role: 'Server Components & ISR Edge Caching' },
        { name: 'React 19', version: 'v19.0', role: 'Concurrent rendering & Actions API' },
        { name: 'TypeScript', version: 'v5.7', role: 'End-to-end compile-time strict type safety' },
        { name: 'Tailwind CSS & PostCSS', version: 'v3.4', role: 'Atomic sub-10KB purge-compiled styles' },
        { name: 'GSAP & Framer Motion', version: 'v3.12', role: 'Hardware-accelerated 60fps micro-animations' },
      ],
      benchmark: 'Lighthouse Score: 98/100 · Client Bundle: 85KB gzip',
    },
    backend: {
      category: 'Backend & High-Throughput APIs',
      command: 'pip install fastapi[all] uvicorn pydantic redis motor',
      rationale: 'Asynchronous event loops built with Python 3.12 asyncio and Pydantic v2 parsing thousands of requests per second with strict data contracts.',
      technologies: [
        { name: 'Python 3.12 (asyncio)', version: 'v3.12.8', role: 'Ultra-fast asynchronous worker loops' },
        { name: 'FastAPI', version: 'v0.115', role: 'High-performance ASGI OpenAPI gateway' },
        { name: 'Pydantic v2 (Rust-backed)', version: 'v2.10', role: 'Sub-millisecond data schema validation' },
        { name: 'Node.js & Express', version: 'v22.14', role: 'Event-driven edge serverless handlers' },
        { name: 'Redis', version: 'v7.4', role: 'In-memory pub/sub, rate-limiting & session cache' },
      ],
      benchmark: 'Average Response Time: 18ms · Concurrency: 10,000+ RPS',
    },
    ai: {
      category: 'Autonomous AI & Multi-Agent Workflows',
      command: 'pip install langchain langchain-google-genai openai pgvector',
      rationale: 'Deterministic agent orchestration with persistent vector memory, automated lead discovery, and zero-hallucination domain knowledge retrieval.',
      technologies: [
        { name: 'LangGraph & LangChain', version: 'v0.2', role: 'Cyclic multi-agent reasoning state machines' },
        { name: 'Gemini 2.5 / OpenAI GPT-4o', version: '2026 Models', role: 'Multimodal analysis & structured reasoning' },
        { name: 'pgvector (PostgreSQL)', version: 'v0.7', role: 'Semantic embeddings & fast similarity search' },
        { name: 'Playwright & Beautiful Soup', version: 'v1.49', role: 'Headless browser discovery & automated scrapers' },
      ],
      benchmark: 'Retrieval Latency: 42ms · Hallucination Rate: < 0.1%',
    },
    cloud: {
      category: 'Database & Cloud Infrastructure',
      command: 'docker compose up -d postgres redis api-worker',
      rationale: 'Zero-trust perimeter architecture with edge CDN distribution, automated point-in-time database backups, and instant elastic scaling.',
      technologies: [
        { name: 'Supabase & PostgreSQL', version: 'v16.3', role: 'Row-Level Security, real-time sync & relational integrity' },
        { name: 'Vercel Edge Network', version: 'Global', role: 'Sub-50ms DNS & 32 global edge Point of Presence nodes' },
        { name: 'Docker & Microservices', version: 'v27.0', role: 'Reproducible containerized service deployments' },
        { name: 'GitHub Actions CI/CD', version: 'v4.0', role: 'Automated typecheck, lint, build & E2E verification' },
      ],
      benchmark: 'Uptime SLA: 99.99% · Backup RPO: 1 minute',
    },
  };

  const current = stackData[activeTab];

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(current.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="tech"
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
            <FaTerminal size={12} style={{ color: '#d40027' }} />
            <span
              style={{
                color: '#d40027',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Technology Stack // Verified Production Tools
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
            Engineering Stack &amp; Architecture Terminal
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
            We only deploy battle-tested, high-throughput technologies genuinely mastered in production. Switch tabs to inspect our architecture contracts.
          </p>
        </div>

        {/* INTERACTIVE TERMINAL CONSOLE (NOT generic cards!) */}
        <div
          className="rounded-4 overflow-hidden"
          style={{
            background: '#07080a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 242, 254, 0.08)',
          }}
        >
          {/* Terminal Window Chrome / Tabs */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3 flex-wrap gap-2"
            style={{
              background: 'rgba(15, 18, 26, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Terminal Window Dots */}
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginLeft: '12px', fontFamily: 'monospace' }}>
                bash ~ heyprince-stack.sh
              </span>
            </div>

            {/* Interactive Tab Selectors */}
            <div className="d-flex align-items-center gap-1 flex-wrap">
              {[
                { id: 'frontend', label: 'Frontend & Edge', icon: <FaReact size={12} /> },
                { id: 'backend', label: 'Backend & Python', icon: <FaPython size={12} /> },
                { id: 'ai', label: 'AI & Automations', icon: <FaRobot size={12} /> },
                { id: 'cloud', label: 'Database & Cloud', icon: <FaCloud size={12} /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className="border-0 px-3 py-1 rounded-pill d-inline-flex align-items-center gap-2"
                    style={{
                      background: isActive ? '#d40027' : 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-4 p-md-5">
            {/* CLI Command Box with Copy Button */}
            <div
              className="p-3 rounded-3 mb-4 d-flex align-items-center justify-content-between"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                fontFamily: 'monospace',
                fontSize: '13px',
              }}
            >
              <div className="d-flex align-items-center gap-2 text-truncate me-2">
                <span style={{ color: '#00f2fe' }}>$</span>
                <span style={{ color: '#ffffff' }}>{current.command}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="btn btn-sm border-0 d-inline-flex align-items-center gap-1"
                style={{
                  background: copied ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '11px',
                  borderRadius: '6px',
                  padding: '4px 10px',
                }}
              >
                {copied ? <FaCheck size={11} /> : <FaCopy size={11} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Architecture Rationale */}
            <div className="mb-4">
              <span style={{ fontSize: '11px', color: '#d40027', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                Architectural Rationale
              </span>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                {current.rationale}
              </p>
            </div>

            {/* Interactive Stack Table */}
            <div className="table-responsive mb-4">
              <table className="table table-dark table-borderless m-0" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '1px' }}>
                    <th style={{ background: 'transparent', paddingBottom: '12px' }}>Technology</th>
                    <th style={{ background: 'transparent', paddingBottom: '12px' }}>Version</th>
                    <th style={{ background: 'transparent', paddingBottom: '12px' }}>Role in Production Architecture</th>
                  </tr>
                </thead>
                <tbody>
                  {current.technologies.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '13px' }}>
                      <td style={{ background: 'transparent', color: '#ffffff', fontWeight: 700, padding: '12px 8px' }}>
                        {t.name}
                      </td>
                      <td style={{ background: 'transparent', color: '#00f2fe', fontFamily: 'monospace', padding: '12px 8px' }}>
                        {t.version}
                      </td>
                      <td style={{ background: 'transparent', color: 'rgba(255, 255, 255, 0.65)', padding: '12px 8px' }}>
                        {t.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terminal Footer Benchmark */}
            <div
              className="pt-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              <div className="d-flex align-items-center gap-2">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 700 }}>
                  {current.benchmark}
                </span>
              </div>

              <Link
                href="/services/"
                className="d-inline-flex align-items-center gap-2 text-decoration-none"
                style={{ color: '#ffffff', fontSize: '12.5px', fontWeight: 700 }}
              >
                <span>View Full Tech Specifications</span>
                <FaArrowRight size={10} style={{ color: '#d40027' }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechExpertise;
