import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { servicesList } from '../../../data/servicesData';
import { SingleServicePage } from '../../../components';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return servicesList.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = servicesList.find((s) => s.slug.toLowerCase() === slug.toLowerCase());

  if (!service) {
    return {
      title: 'Service Not Found | HeyPrince',
      description: 'The requested service could not be found.',
    };
  }

  return {
    title: `${service.metaTitle} | HeyPrince`,
    description: service.metaDescription,
    keywords: `${service.techStack.join(', ')}, ${service.category}, Prince IT Consultant, HeyPrince Services`,
    alternates: {
      canonical: `https://heyprince.in/services/${service.slug}/`,
    },
    openGraph: {
      title: `${service.metaTitle} | HeyPrince`,
      description: service.metaDescription,
      url: `https://heyprince.in/services/${service.slug}/`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.metaTitle} | HeyPrince`,
      description: service.metaDescription,
    },
  };
}

export default async function ServiceRoute({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = servicesList.find((s) => s.slug.toLowerCase() === slug.toLowerCase());

  if (!service) {
    notFound();
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.heroDescription,
    provider: {
      '@type': 'Person',
      name: 'Prince',
      url: 'https://heyprince.in/',
    },
    serviceType: service.category,
    areaServed: 'Worldwide',
  };

  return (
    <div className="page-view-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <SingleServicePage slug={service.slug} />
    </div>
  );
}

