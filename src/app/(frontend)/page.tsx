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
} from '@/components';
import { getPosts } from '@/lib/cms';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Prince — Senior Full Stack IT Consultant & Web Engineer',
  description:
    'Prince is a Senior Full Stack Engineer & IT Consultant specializing in high-performance Next.js apps, bespoke WordPress/CMS development, and Next-Gen AI workflow automations.',
  alternates: {
    canonical: 'https://heyprince.in/',
  },
};

export default async function HomePage() {
  const latestArticles = await getPosts();

  return (
    <div className="home-view-container">
      <HeroBanner />
      <VisionAmbition />
      <JourneyTimeline />
      <CyberArcade />
      <ArticlesSection articles={latestArticles} />
      <LetsTalkBanner />
      <CapturedMemories />
    </div>
  );
}

