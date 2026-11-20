'use client';

import React, { useState } from 'react';
import { FaChevronDown, FaCircleQuestion } from 'react-icons/fa6';

export const homeFaqs = [
  {
    q: 'What types of projects does HeyPrince specialize in?',
    a: 'We specialize in sub-second Next.js web applications, headless commerce migrations, custom CMS engineering, autonomous AI workflows, Python/FastAPI microservices, and technical SEO performance audits. We focus on modern, bespoke digital architectures where speed, reliability, and measurable business ROI are paramount.',
  },
  {
    q: 'How does your pricing and engagement model work?',
    a: 'We operate on transparent, milestone-driven fixed-scope contracts as well as dedicated technical retainer partnerships. Every project begins with an architectural audit and deliverable scope, accompanied by clear deliverables, deadlines, and pricing. There are never hidden agency markups or unexpected fees.',
  },
  {
    q: 'Can you modernize our existing website without rewriting everything from scratch?',
    a: 'Yes. Many clients engage us for headless migrations or performance remediation. For example, in a headless WooCommerce migration, we preserve your existing WordPress product catalogs and order history, but replace the slow customer-facing theme with a sub-second Next.js edge storefront. This accelerates conversion rates without operational disruption.',
  },
  {
    q: 'How long does a typical custom build or AI integration take?',
    a: 'Standard custom websites and headless storefront migrations typically complete within 2 to 4 weeks. Targeted AI automations and microservice integrations are frequently delivered in 1 to 2 weeks. Enterprise multi-tier platforms with complex database migrations depend on scope, which we map out during the initial discovery phase.',
  },
  {
    q: 'Who owns the source code and intellectual property upon completion?',
    a: 'You own 100% of the code, database schemas, design tokens, and infrastructure configurations upon project completion. Every repository is handed over with full administrative rights, documentation, and zero vendor lock-in or recurring licensing fees.',
  },
  {
    q: 'Can your AI automations securely connect to our existing SQL database or CRM?',
    a: 'Yes. We build secure, private API connectors and Retrieval-Augmented Generation (RAG) pipelines that safely interface with PostgreSQL, Supabase, MySQL, HubSpot, Salesforce, or custom internal systems. All data is protected with zero-trust token authentication and isolated environment secrets.',
  },
  {
    q: 'Do you provide ongoing technical support and performance monitoring after launch?',
    a: 'Yes. We offer continuous technical maintenance agreements covering 24/7 uptime monitoring, security dependency patches, search engine index surveillance, database query tuning, and proactive performance optimizations to keep your system performing at peak velocity.',
  },
];

export const HomeFaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <section
      className="py-5"
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container py-5">
        <div className="text-center max-w-3xl mx-auto mb-5">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <FaCircleQuestion size={12} style={{ color: '#00f2fe' }} />
            <span
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Frequently Asked Questions
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
            Everything You Need to Know
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
            Straightforward answers about our engineering process, pricing approach, timelines, and technical standards.
          </p>
        </div>

        <div className="max-w-3xl mx-auto" style={{ maxWidth: '840px' }}>
          <div className="d-flex flex-column gap-3">
            {homeFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-4 overflow-hidden"
                  style={{
                    background: '#07080a',
                    border: isOpen
                      ? '1px solid rgba(212, 0, 39, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.07)',
                    boxShadow: isOpen
                      ? '0 10px 30px rgba(212, 0, 39, 0.15)'
                      : '0 4px 15px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-100 p-4 text-start d-flex justify-content-between align-items-center bg-transparent border-0"
                    style={{ cursor: 'pointer', outline: 'none' }}
                    aria-expanded={isOpen}
                  >
                    <span style={{ fontSize: '16.5px', color: '#ffffff', fontWeight: 600, paddingRight: '16px' }}>
                      {faq.q}
                    </span>
                    <FaChevronDown
                      size={14}
                      style={{
                        color: isOpen ? '#d40027' : 'rgba(255, 255, 255, 0.5)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease, color 0.25s ease',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="px-4 pb-4 pt-1"
                      style={{
                        color: 'rgba(255, 255, 255, 0.75)',
                        fontSize: '14.5px',
                        lineHeight: 1.7,
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <p className="m-0">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFaqSection;
