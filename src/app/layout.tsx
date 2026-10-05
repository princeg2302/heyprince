import type { Metadata, Viewport } from 'next';
import React from 'react';
import '../styles/fonts.css';
import '../styles/main.css';
import '../styles/grid-lines.css';
import '../styles/wp-style.css';
import 'mouse-follower/dist/mouse-follower.min.css';
import 'lenis/dist/lenis.css';

import { Header, Footer, ClientProviders } from '../components';

export const viewport: Viewport = {
  themeColor: '#0b0b0f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://heyprince.in'),
  title: 'Prince — Senior Full Stack IT Consultant & Web Engineer | HeyPrince',
  description:
    'Prince is a Senior Full Stack Engineer & IT Consultant specializing in high-performance React web apps, scalable cloud architecture, and custom IT solutions.',
  keywords: [
    'Prince',
    'HeyPrince',
    'IT Consultant',
    'Senior Full Stack Engineer',
    'Next.js Developer',
    'React Developer',
    'WordPress Developer',
    'Shopify Expert',
    'Web Engineering',
    'Custom Software Development',
    'PHP Backend Engineer',
    'Python Automation',
    'Technical SEO Consultant',
    'AI Services and Automations',
    'UI/UX Design',
    'IT Services India',
    'Global Tech Partner',
  ],
  authors: [{ name: 'Prince', url: 'https://heyprince.in' }],
  creator: 'Prince',
  publisher: 'HeyPrince',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://heyprince.in/',
  },
  openGraph: {
    title: 'Prince — Senior Full Stack IT Consultant & Web Engineer | HeyPrince',
    description:
      'Prince is a Senior Full Stack Engineer & IT Consultant specializing in high-performance React & Next.js apps, custom CMS engineering, and AI workflow automations.',
    url: 'https://heyprince.in/',
    siteName: 'HeyPrince',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
        width: 1200,
        height: 630,
        alt: 'Prince - Senior Full Stack Engineer and IT Consultant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prince — Senior Full Stack IT Consultant & Web Engineer',
    description:
      'Senior Full Stack Engineer & IT Consultant specializing in high-performance React web applications, scalable cloud architectures, and interactive digital solutions.',
    images: ['https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp'],
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://heyprince.in/#person',
      name: 'Prince',
      jobTitle: 'Senior Full Stack Engineer & IT Consultant',
      url: 'https://heyprince.in/',
      image: 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
      email: 'it@heyprince.in',
      sameAs: [
        'https://www.linkedin.com/in/mr-goyal/',
        'https://www.instagram.com/heyprince.in/',
        'https://wa.me/919120900010',
      ],
      knowsAbout: [
        'React.js',
        'Next.js',
        'TypeScript',
        'Full Stack Web Development',
        'WordPress & Custom ACF Themes',
        'Shopify Liquid & E-Commerce',
        'PHP & Backend Engineering',
        'Python & Async Automation',
        'Technical SEO & Core Web Vitals',
        'AI Agents & LLM Pipelines',
        'UI/UX Design Systems',
        'Cloud Architecture',
        'Software Architecture',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://heyprince.in/#website',
      url: 'https://heyprince.in/',
      name: 'HeyPrince',
      description:
        'Prince - Senior Full Stack IT Consultant & Web Engineer. High-performance digital products, full-stack software development, and technical consultation.',
      publisher: {
        '@id': 'https://heyprince.in/#person',
      },
      inLanguage: 'en-US',
    },
    {
      '@type': 'ProfessionalService',
      '@id': 'https://heyprince.in/#service',
      name: 'Prince IT Consulting & Web Engineering',
      url: 'https://heyprince.in/',
      email: 'it@heyprince.in',
      telephone: '+919120900010',
      priceRange: '$$$$',
      areaServed: ['Global Remote', 'India', 'United States', 'Europe', 'Australia'],
      founder: {
        '@id': 'https://heyprince.in/#person',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'IT Consulting & Web Engineering Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'AI Services & Project Automations',
              url: 'https://heyprince.in/services/ai-automation/',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'CMS Development (WordPress, Shopify, Webflow, Squarespace)',
              url: 'https://heyprince.in/services/cms-development/',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'React & Next.js Web Development',
              url: 'https://heyprince.in/services/react-development/',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Enterprise PHP & Backend Engineering',
              url: 'https://heyprince.in/services/php-development/',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Python Engineering & Data Automation',
              url: 'https://heyprince.in/services/python-engineering/',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Technical SEO & Performance Optimization',
              url: 'https://heyprince.in/services/seo-services/',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'UI/UX Design & Brand Graphics',
              url: 'https://heyprince.in/services/ui-ux-design/',
            },
          },
        ],
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" prefix="og: https://ogp.me/ns#" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/fonts/arboria/arboria.css" />
        <link rel="stylesheet" href="/fonts/futuru/futuru.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="home front-page" suppressHydrationWarning>
        <div id="wrapper">
          <ClientProviders>
            <Header />
            <main id="main" className="main-content">
              {children}
            </main>
            <Footer />
          </ClientProviders>
        </div>
      </body>
    </html>
  );
}

