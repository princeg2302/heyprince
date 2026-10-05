import type { Metadata } from 'next';
import React from 'react';
import { ContactPage } from '@/components';

export const metadata: Metadata = {
  title: 'Contact Prince — Senior IT Consultant & Full Stack Web Engineer | HeyPrince',
  description:
    'Get in touch with Prince for senior IT consulting, full-stack React engineering, custom web applications, performance audits, and high-conversion software architecture.',
  keywords: [
    'Contact Prince',
    'Hire IT Consultant',
    'Full Stack React Developer',
    'Web Engineer India',
    'Remote Tech Partner',
    'Senior Software Architect',
    'HeyPrince Contact',
    'Custom Web Solutions',
  ],
  alternates: {
    canonical: 'https://heyprince.in/contact/',
  },
  openGraph: {
    title: 'Contact Prince — Senior IT Consultant & Full Stack Web Engineer | HeyPrince',
    description:
      'Get in touch with Prince for senior IT consulting, full-stack React engineering, custom web applications, performance audits, and high-conversion software architecture.',
    url: 'https://heyprince.in/contact/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Prince — Senior IT Consultant & Full Stack Web Engineer | HeyPrince',
    description:
      'Get in touch with Prince for senior IT consulting, full-stack React engineering, custom web applications, performance audits, and high-conversion software architecture.',
  },
};

export default function ContactRoute() {
  return (
    <div className="page-view-wrapper">
      <ContactPage />
    </div>
  );
}

