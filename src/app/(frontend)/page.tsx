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
import { getPosts } from '@/lib/cms';

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
      <ArticlesSection articles={latestArticles} />
      <LetsTalkBanner />
      <CyberArcade />
      <CapturedMemories />
    </div>
  );
}
