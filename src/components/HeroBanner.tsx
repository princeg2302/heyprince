'use client';

import React from 'react';
import { PhysicsPills } from './PhysicsPills';

export const HeroBanner: React.FC = () => {
  return (
    <section className="banner-main" id="home" aria-label="Hero Introduction">
      <PhysicsPills />
      <div className="container">
        <h1 className="banner-title" aria-label="Prince — Your Senior IT Consultant & Full Stack Tech Partner">
          PRINCE
          <span>PRINCE</span>
          <span>PRINCE</span>
          <span>YOUR TECH PARTNER</span>
        </h1>
        <p className="visually-hidden">
          Prince is a Senior Full Stack Engineer &amp; IT Consultant specializing in high-performance Next.js &amp; React web applications, bespoke WordPress &amp; CMS architecture, and enterprise AI workflow automations.
        </p>
      </div>
    </section>
  );
};

export default HeroBanner;
