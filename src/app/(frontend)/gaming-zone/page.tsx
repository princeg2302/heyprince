import type { Metadata } from 'next';
import React from 'react';
import { GamingZoneView } from '@/components';

export const metadata: Metadata = {
  title: 'Retro Gaming Zone & 8-Bit Arcade Vault — Super Mario Bros, Sudoku & Contra',
  description:
    'Experience the 1985 classic Super Mario Bros, solve the in-browser Cyber Sudoku Matrix, and trigger the 30-Lives Contra Code. Built with legal integrity and official platform links.',
  keywords: [
    'Gaming Zone',
    'Super Mario Bros 1985',
    'Play Classic Mario',
    'Retro Gaming',
    'Cyber Sudoku Matrix',
    'Sudoku In-Browser',
    'Contra 1987',
    'Konami Code',
    'HeyPrince Gaming Zone',
    '8-Bit Vault',
    'NES Classics',
  ],
  alternates: {
    canonical: 'https://heyprince.in/gaming-zone/',
  },
  openGraph: {
    title: 'Retro Gaming Zone & 8-Bit Vault | HeyPrince',
    description:
      'Original 1985 Super Mario Bros, playable Cyber Sudoku, and classic Contra with the Konami Code. 100% legal, official platform verified.',
    url: 'https://heyprince.in/gaming-zone/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retro Gaming Zone & 8-Bit Vault | HeyPrince',
    description:
      'Original 1985 Super Mario Bros, playable Cyber Sudoku, and classic Contra with the Konami Code. 100% legal, official platform verified.',
  },
};

export default function GamingZonePage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'HeyPrince Retro Gaming Zone & 8-Bit Arcade Vault',
    description:
      'Curated retro gaming hub and interactive web engineering puzzles featuring Super Mario Bros (1985), Cyber Sudoku Matrix, and Contra (1987).',
    url: 'https://heyprince.in/gaming-zone/',
    hasPart: [
      {
        '@type': 'VideoGame',
        name: 'Super Mario Bros.',
        gamePlatform: 'Nintendo Entertainment System (NES)',
        author: {
          '@type': 'Organization',
          name: 'Nintendo',
        },
        datePublished: '1985-09-13',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Cyber Sudoku Matrix',
        applicationCategory: 'GameApplication',
        operatingSystem: 'All web browsers',
      },
      {
        '@type': 'VideoGame',
        name: 'Contra',
        gamePlatform: 'NES / Arcade',
        author: {
          '@type': 'Organization',
          name: 'Konami',
        },
        datePublished: '1987-02-20',
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
