import React from 'react';
import { FaTriangleExclamation, FaCircleCheck } from 'react-icons/fa6';

export const ProblemsSolved: React.FC = () => {
  const problemPairs = [
    {
      problem: 'Sluggish Page Loads & Core Web Vitals Ranking Penalties',
      problemDesc: 'Heavy WordPress themes, render-blocking scripts, and bloated asset payloads pushing mobile TTFB past 2.5 seconds, directly hurting Google search rankings.',
      solution: 'Sub-Second Next.js Edge Architecture',
      solutionDesc: 'Incremental Static Regeneration and edge caching delivering <500ms global TTFB, eliminating layout shifts and maximizing Google search CTR.',
    },
    {
      problem: 'Manual Repetitive Operations & Staff Hours Drained',
      problemDesc: 'Teams spending 15+ hours weekly copying data across spreadsheets, manually answering repetitive inquiries, and reconciling invoices by hand.',
      solution: 'Autonomous AI Workflows & Private RAG',
      solutionDesc: 'Custom AI agents and event-driven webhook microservices that extract, validate, and synchronize business data into your CRM/SQL databases automatically.',
    },
    {
      problem: 'Fragmented Lead Ingestion & Broken Conversion Paths',
      problemDesc: 'Prospective clients bouncing because contact forms fail on mobile, WhatsApp inquiries get lost, and outreach follow-ups lack context.',
      solution: 'Unified CRM & Automated Follow-Up Funnels',
      solutionDesc: 'Clean API-backed inquiry funnels with instant email/WhatsApp routing, verification guards, and seamless lead tracking in real time.',
    },
    {
      problem: 'Brittle Custom Codebases Without Architectural Direction',
      problemDesc: 'Software built with spaghetti dependencies, missing tests, and security vulnerabilities that crash under sudden traffic spikes.',
      solution: 'Strict TypeScript & Python Microservice Engineering',
      solutionDesc: 'Production-hardened architectures with strict schema validation (Zod, Pydantic), modular test suites, and clean documentation for effortless scaling.',
    },
  ];

  return (
    <section className="py-5" style={{ background: '#0e1017', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container py-5">
        <div className="text-center max-w-3xl mx-auto mb-5">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(229, 57, 53, 0.12)', border: '1px solid rgba(229, 57, 53, 0.3)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e53935' }}></span>
            <span style={{ color: '#e53935', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Friction to Freedom</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', color: '#ffffff', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
            Real Business Problems We Solve
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
            We eliminate the technical friction that stalls customer acquisition and team velocity. Here is how we replace common bottlenecks with robust engineering.
          </p>
        </div>

        <div className="row g-4">
          {problemPairs.map((item, idx) => (
            <div key={idx} className="col-lg-6 col-12 d-flex">
              <div 
                className="w-100 p-4 p-md-5 rounded-4 d-flex flex-column justify-content-between"
                style={{ 
                  background: '#151722', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* The Problem */}
                <div className="mb-4 pb-4" style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#ff5252', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    <FaTriangleExclamation size={14} />
                    <span>The Bottleneck</span>
                  </div>
                  <h3 style={{ fontSize: '19px', color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>
                    {item.problem}
                  </h3>
                  <p style={{ fontSize: '14.5px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
                    {item.problemDesc}
                  </p>
                </div>

                {/* The Solution */}
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#00e676', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    <FaCircleCheck size={14} />
                    <span>Our Engineered Solution</span>
                  </div>
                  <h4 style={{ fontSize: '18px', color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>
                    {item.solution}
                  </h4>
                  <p style={{ fontSize: '14.5px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6, margin: 0 }}>
                    {item.solutionDesc}
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
