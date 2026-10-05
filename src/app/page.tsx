import type { Metadata } from 'next';
import React from 'react';
import {
  HeroBanner,
  VisionAmbition,
  JourneyTimeline,
  CyberArcade,
  ArticlesSection,
  LetsTalkBanner,
  CapturedMemories,
} from '../components';

export const metadata: Metadata = {
  title: 'Prince — Senior Full Stack IT Consultant & Web Engineer',
  description:
    'Prince is a Senior Full Stack Engineer & IT Consultant specializing in high-performance Next.js apps, bespoke WordPress/CMS development, and Next-Gen AI workflow automations.',
  alternates: {
    canonical: 'https://heyprince.in/',
  },
};

export default function HomePage() {
  return (
    <div className="home-view-container">
      <HeroBanner />
      <VisionAmbition />
      <JourneyTimeline />
      <CyberArcade />
      <ArticlesSection />
      <LetsTalkBanner />
      <CapturedMemories />
    </div>
  );
}

