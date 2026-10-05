import type { Metadata } from 'next';
import React from 'react';
import { PrivacyPolicyPage } from '../../components';

export const metadata: Metadata = {
  title: 'Privacy Policy | Prince — Senior IT Consultant & Web Engineer | HeyPrince',
  description:
    'Read the HeyPrince Privacy Policy to understand how we protect your personal data, manage cookie consent preferences, and guarantee transparency.',
  keywords: [
    'Privacy Policy',
    'HeyPrince',
    'Prince IT Consultant',
    'Cookie Consent',
    'GDPR Compliance',
    'Data Protection',
    'User Rights',
  ],
  alternates: {
    canonical: 'https://heyprince.in/privacy-policy/',
  },
  openGraph: {
    title: 'Privacy Policy | Prince — Senior IT Consultant & Web Engineer | HeyPrince',
    description:
      'Read the HeyPrince Privacy Policy to understand how we protect your personal data, manage cookie consent preferences, and guarantee transparency.',
    url: 'https://heyprince.in/privacy-policy/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Prince — Senior IT Consultant & Web Engineer | HeyPrince',
    description:
      'Read the HeyPrince Privacy Policy to understand how we protect your personal data, manage cookie consent preferences, and guarantee transparency.',
  },
};

export default function PrivacyPolicyRoute() {
  return (
    <div className="page-view-wrapper">
      <PrivacyPolicyPage />
    </div>
  );
}

