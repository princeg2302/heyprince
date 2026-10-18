import type { Metadata } from 'next';
import React from 'react';
import { GamingZoneView } from '@/components';

export const metadata: Metadata = {
  title: 'Play Retro Games Online — 8-Bit Platformer, Snake, Brick Breaker, Sudoku & 2048 | HeyPrince Gaming Zone',
  description:
    'Play classic retro arcade games directly in your browser: 8-Bit Pixel Platformer (running, jumping, powerups, flagpole), Neon Snake (60fps), Cyber Brick Breaker, Sudoku, and 2048.',
  keywords: [
    'Gaming Zone',
    'Play Retro Games Online',
    '8-Bit Platformer Online',
    'Classic Side Scroller',
    'Play Snake Game',
    'Retro Neon Snake',
    'Brick Breaker Online',
    'Cyber Breakout',
    'Cyber Sudoku Matrix',
    '2048 Game Online',
    'Contra 1987',
    'HeyPrince Gaming Zone',
    'Free Web Games',
  ],
  alternates: {
    canonical: 'https://heyprince.in/gaming-zone/',
  },
  openGraph: {
    title: 'Play Retro Games Online | HeyPrince Gaming Zone',
    description:
      'Directly playable in-browser arcade games: Neon Snake, Brick Breaker, Sudoku Matrix, and 2048. High scores, sound synth, touch controls.',
    url: 'https://heyprince.in/gaming-zone/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Play Retro Games Online | HeyPrince Gaming Zone',
    description:
      'Directly playable in-browser arcade games: Neon Snake, Brick Breaker, Sudoku Matrix, and 2048. High scores, sound synth, touch controls.',
  },
};

export default function GamingZonePage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'HeyPrince Retro Gaming Zone & Arcade Vault',
    description:
      'Playable in-browser retro arcade games and numerical puzzles: Retro Neon Snake, Cyber Brick Breaker, Cyber Sudoku Matrix, and Cyber 2048.',
    url: 'https://heyprince.in/gaming-zone/',
    hasPart: [
      {
        '@type': 'SoftwareApplication',
        name: '8-Bit Pixel Platformer',
        applicationCategory: 'GameApplication',
        operatingSystem: 'All web browsers',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Retro Neon Snake',
        applicationCategory: 'GameApplication',
        operatingSystem: 'All web browsers',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Cyber Brick Breaker',
        applicationCategory: 'GameApplication',
        operatingSystem: 'All web browsers',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Cyber Sudoku Matrix',
        applicationCategory: 'GameApplication',
        operatingSystem: 'All web browsers',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Cyber 2048 Matrix',
        applicationCategory: 'GameApplication',
        operatingSystem: 'All web browsers',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <GamingZoneView />
    </>
  );
}

