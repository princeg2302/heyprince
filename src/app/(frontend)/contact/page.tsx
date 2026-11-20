import type { Metadata } from 'next';
import React from 'react';
import { redirect } from 'next/navigation';
import { ContactPage } from '@/components';
import { getSiteVisibilitySettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Contact Prince: Senior IT Consultant & Systems Architect | HeyPrince',
  description:
    'Get in touch with Prince for senior IT consulting, full-stack Next.js engineering, custom web applications, performance audits, and high-conversion software architecture.',
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
    title: 'Contact Prince: Senior IT Consultant & Systems Architect | HeyPrince',
    description:
      'Get in touch with Prince for senior IT consulting, full-stack Next.js engineering, custom web applications, performance audits, and high-conversion software architecture.',
    url: 'https://heyprince.in/contact/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Prince: Senior IT Consultant & Systems Architect | HeyPrince',
    description:
      'Get in touch with Prince for senior IT consulting, full-stack Next.js engineering, custom web applications, performance audits, and high-conversion software architecture.',
  },
};

export default async function ContactRoute() {
  const settings = await getSiteVisibilitySettings();
  if (!settings.services_and_contact_enabled) {
    redirect('/');
  }

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Prince & HeyPrince',
    description:
      'Direct contact and engineering consultation inquiry page for Prince, Senior IT Consultant and founder of HeyPrince.',
    url: 'https://heyprince.in/contact/',
    mainEntity: {
      '@type': 'Person',
      name: 'Prince',
      jobTitle: 'Senior Full Stack Engineer & IT Consultant',
      url: 'https://heyprince.in/',
      sameAs: [
        'https://www.linkedin.com/in/mr-goyal/',
        'https://wa.me/919120900010',
      ],
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://heyprince.in/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Contact',
        item: 'https://heyprince.in/contact/',
      },
    ],
  };

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [contactSchema, breadcrumbSchema],
  };

  return (
    <div className="page-view-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
      <ContactPage />
    </div>
  );
}
