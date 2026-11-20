'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FaArrowRight, FaBolt, FaComments } from 'react-icons/fa6';

const PhysicsPills = dynamic(() => import('./PhysicsPills').then((mod) => mod.PhysicsPills), {
  ssr: false,
});

export const HeroBanner: React.FC = () => {
  const handleScrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="banner-main" id="home" aria-label="Hero Introduction">
      <PhysicsPills />
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="text-center max-w-4xl mx-auto pt-3 pb-4">
          <div 
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e53935' }}></span>
            <span>Senior Full-Stack &amp; AI Systems Architect</span>
          </div>

          <h1 className="banner-title" aria-label="Prince: Your Senior IT Consultant & Full Stack Tech Partner">
            PRINCE
            <span>PRINCE</span>
            <span>PRINCE</span>
            <span>YOUR TECH PARTNER</span>
          </h1>

          <div className="my-4">
            <h2 
              style={{ 
                fontSize: 'clamp(24px, 3.2vw, 38px)', 
                color: '#ffffff', 
                fontWeight: 700, 
                lineHeight: 1.3,
                maxWidth: '860px',
                margin: '0 auto 16px',
                fontFamily: 'var(--font-futuru)',
              }}
            >
              We Build Sub-Second Web Applications, Headless Systems &amp; Autonomous AI Automations.
            </h2>
            <p 
              style={{ 
                fontSize: 'clamp(16px, 1.8vw, 19px)', 
                color: 'rgba(255, 255, 255, 0.75)', 
                lineHeight: 1.65, 
                maxWidth: '740px', 
                margin: '0 auto',
                fontFamily: 'var(--font-arboria)',
              }}
            >
              Transform slow, monolithic websites and manual workflows into high-converting digital platforms engineered with Next.js 15, FastAPI, and deterministic AI agents.
            </p>
          </div>

          {/* Primary & Secondary Call To Actions */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 pt-2 mb-4">
            <a
              href="#services"
              onClick={handleScrollToServices}
              className="d-inline-flex align-items-center gap-2 px-4 py-3 rounded-pill text-decoration-none"
              style={{
                background: '#e53935',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15.5px',
                boxShadow: '0 8px 25px rgba(229, 57, 53, 0.35)',
                transition: 'all 0.25s ease',
              }}
            >
              <span>Explore Services</span>
              <FaArrowRight size={13} />
            </a>

            <Link
              href="/contact/"
              className="d-inline-flex align-items-center gap-2 px-4 py-3 rounded-pill text-decoration-none"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                fontWeight: 600,
                fontSize: '15.5px',
                transition: 'all 0.25s ease',
              }}
            >
              <FaComments size={14} className="text-accent" />
              <span>Let&apos;s Discuss Your Project</span>
            </Link>
          </div>

          {/* Value Metric Bar */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-md-4 gap-2 pt-3" style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.12)' }}>
            <div className="d-flex align-items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
              <FaBolt size={12} className="text-accent" />
              <span>&lt;500ms Edge TTFB Standard</span>
            </div>
            <span className="d-none d-md-inline" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <div className="d-flex align-items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
              <span style={{ color: '#00e676', fontWeight: 'bold' }}>✓</span>
              <span>100% Core Web Vitals Focus</span>
            </div>
            <span className="d-none d-md-inline" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <div className="d-flex align-items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
              <span style={{ color: '#00e676', fontWeight: 'bold' }}>✓</span>
              <span>Zero-Template Hand-Crafted Code</span>
            </div>
            <span className="d-none d-md-inline" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <div className="d-flex align-items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
              <span style={{ color: '#00e676', fontWeight: 'bold' }}>✓</span>
              <span>Direct Senior Engineering</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
