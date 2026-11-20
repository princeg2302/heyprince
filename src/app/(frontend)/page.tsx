import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';
import {
  HeroBanner,
  VisionAmbition,
  JourneyTimeline,
  ArticlesSection,
  LetsTalkBanner,
} from '@/components';
import { TrustCapabilities } from '@/components/home/TrustCapabilities';
import { WhatWeBuild } from '@/components/home/WhatWeBuild';
import { FeaturedServicesSection } from '@/components/home/FeaturedServicesSection';
import { ProblemsSolved } from '@/components/home/ProblemsSolved';
import { OurApproach } from '@/components/home/OurApproach';
import { TechExpertise } from '@/components/home/TechExpertise';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { CapabilitiesShowcase } from '@/components/home/CapabilitiesShowcase';
import { HomeFaqSection } from '@/components/home/HomeFaqSection';
import { getPosts, getServices } from '@/lib/cms';

const CyberArcade = dynamic(() => import('@/components/CyberArcade'), {
  loading: () => (
    <div style={{ minHeight: '320px', background: 'transparent' }} aria-hidden="true" />
  ),
});

const CapturedMemories = dynamic(() => import('@/components/CapturedMemories'), {
  loading: () => (
    <div style={{ minHeight: '260px', background: 'transparent' }} aria-hidden="true" />
  ),
});

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Prince: Senior Full Stack IT Consultant & AI Solutions Architect',
  description:
    'HeyPrince provides high-performance Next.js web applications, headless commerce systems, autonomous AI workflow automations, and technical SEO architecture for growing businesses.',
  keywords: [
    'Next.js Development Company',
    'AI Automation Services',
    'Senior IT Consultant India',
    'Headless Commerce Migration',
    'Python FastAPI Development',
    'Technical SEO Audits',
    'Custom Web Application Architecture',
    'HeyPrince',
  ],
  alternates: {
    canonical: 'https://heyprince.in/',
  },
  openGraph: {
    title: 'Prince: Senior Full Stack IT Consultant & AI Solutions Architect',
    description:
      'We build sub-second web applications, headless systems, and intelligent AI automations for ambitious brands.',
    url: 'https://heyprince.in/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prince: Senior Full Stack IT Consultant & AI Solutions Architect',
    description:
      'We build sub-second web applications, headless systems, and intelligent AI automations for ambitious brands.',
  },
};

export default async function HomePage() {
  const [latestArticles, services] = await Promise.all([
    getPosts(),
    getServices(),
  ]);

  return (
    <div className="home-view-container">
      {/* 1. Premium Hero Section */}
      <HeroBanner />

      {/* 2. Trust & Capabilities */}
      <TrustCapabilities />

      {/* 3. What We Help You Build */}
      <WhatWeBuild />

      {/* 4. Featured Dynamic Services */}
      <FeaturedServicesSection services={services} />

      {/* 5. Business Problems We Solve */}
      <ProblemsSolved />

      {/* 6. Our 8-Stage Approach */}
      <OurApproach />

      {/* 7. Technologies & Expertise */}
      <TechExpertise />

      {/* 8. Why Choose HeyPrince */}
      <WhyChooseUs />

      {/* 9. Verified Capabilities & Architecture Showcase */}
      <CapabilitiesShowcase />

      {/* Brand Personality & Philosophy */}
      <VisionAmbition />

      {/* Interactive Milestones Timeline */}
      <JourneyTimeline />

      {/* 10. Dynamic Insights & Articles */}
      <ArticlesSection articles={latestArticles} />

      {/* 11. Frequently Asked Questions (with JSON-LD Schema) */}
      <HomeFaqSection />

      {/* 12. Final High-Converting Consultation & Let's Talk Banner */}
      <LetsTalkBanner />

      {/* Interactive Cyber Arcade & Brand Memories */}
      <CyberArcade />
      <CapturedMemories />
    </div>
  );
}
