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

