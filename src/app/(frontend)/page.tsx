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
      {/* 1. Iconic Hero Section */}
      <HeroBanner />

      {/* 2. Interactive Telemetry Console & Core Value Proposition */}
      <TrustCapabilities />

      {/* 3. Interactive Blueprint Studio (Engineering Archetypes) */}
      <WhatWeBuild />

      {/* 4. Playing Cards Hand Fan (Centered Taash ke Patte on Scroll) */}
      <FeaturedServicesSection services={services} />

      {/* 5. Before vs. After Comparative Diagnosis Console */}
      <ProblemsSolved />

      {/* 6. 8-Stage Engineering Flight Plan & Timeline */}
      <OurApproach />

      {/* 7. Interactive Stack Terminal & Architecture Matrix */}
      <TechExpertise />

      {/* 8. Senior Engineering Bento Grid */}
      <WhyChooseUs />

      {/* 9. Vision & Ambition */}
      <VisionAmbition />

      {/* 10. Interactive Cyber Arcade Experience */}
      <CyberArcade />

      {/* 11. Journey & Evolution */}
      <JourneyTimeline />

      {/* 12. Dynamic Engineering Articles & Magazine Cover Spotlight */}
      <ArticlesSection articles={latestArticles} />

      {/* 13. Real Customer FAQ */}
      <HomeFaqSection />

      {/* 14. Captured Moments */}
      <CapturedMemories />

      {/* 15. Final Conversion Section */}
      <LetsTalkBanner />
    </div>
  );
}
