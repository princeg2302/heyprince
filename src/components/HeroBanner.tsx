'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { FaArrowDown } from 'react-icons/fa6';

const PhysicsPills = dynamic(() => import('./PhysicsPills').then((mod) => mod.PhysicsPills), {
  ssr: false,
});

export const HeroBanner: React.FC = () => {
  const handleScrollToContent = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('capabilities');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="banner-main" id="home" aria-label="Hero Introduction">
      <PhysicsPills />
      <div className="container">
        {/* Sleek top status pill - unobtrusive, sits at top */}
        <div className="hero-status-pill-wrap">
          <div className="hero-status-pill">
            <span className="hero-pulse-dot" />
            <span>SENIOR IT ARCHITECT // NEXT.JS &bull; FASTAPI &bull; AI SYSTEMS</span>
          </div>
        </div>

        {/* The Signature Interactive Split Title */}
        <h1 className="banner-title" aria-label="Prince: Your Senior IT Consultant & Full Stack Tech Partner">
          PRINCE
          <span>PRINCE</span>
          <span>PRINCE</span>
          <span>YOUR TECH PARTNER</span>
        </h1>

        {/* Signature Subtitle */}
        <div className="banner-subtitle">
          <span>Senior Full Stack Engineer &amp; IT Consultant</span>
        </div>

        {/* Elegant bottom scroll prompt */}
        <div className="hero-scroll-prompt-wrap">
          <a
            href="#capabilities"
            onClick={handleScrollToContent}
            className="hero-scroll-btn"
            aria-label="Scroll to capabilities"
          >
            <span>Scroll to Explore</span>
            <FaArrowDown size={11} className="hero-arrow-bounce" />
          </a>
        </div>

        <p className="visually-hidden">
          Prince is a Senior Full Stack Engineer and IT Consultant specializing in high-performance Next.js and React web applications, bespoke WordPress and CMS architecture, and enterprise AI workflow automations.
        </p>
      </div>
    </section>
  );
};

export default HeroBanner;
