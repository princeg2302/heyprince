import type { Metadata } from 'next';
import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServices, getServiceBySlug, getPosts } from '@/lib/cms';
import { getSiteVisibilitySettings } from '@/lib/site-settings';
import { SingleServicePage } from '@/components';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return {
      title: 'Service Not Found | HeyPrince',
      description: 'The requested service could not be found.',
    };
  }

  return {
    title: service.metaTitle.includes('HeyPrince') ? service.metaTitle : `${service.metaTitle} | HeyPrince`,
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
  const settings = await getSiteVisibilitySettings();
  if (!settings.services_and_contact_enabled) {
    redirect('/');
  }

  const { slug } = await params;
  const [service, allServices, allPosts] = await Promise.all([
    getServiceBySlug(slug),
    getServices(),
    getPosts(),
  ]);

  if (!service) {
    notFound();
  }

  const serviceSchema = {
    '@type': 'Service',
    '@id': `https://heyprince.in/services/${service.slug}/#service`,
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

  const breadcrumbSchema = {
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
        name: 'Services',
        item: 'https://heyprince.in/#services',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: service.title,
        item: `https://heyprince.in/services/${service.slug}/`,
      },
    ],
  };

  const faqSchema =
    service.faqs && service.faqs.length > 0
      ? {
          '@type': 'FAQPage',
          mainEntity: service.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.a,
            },
          })),
        }
      : null;

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [serviceSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])],
  };

  const matchedArticles = allPosts.filter(
    (p) =>
      p.tags?.some((t) => service.techStack.includes(t)) ||
      p.category === service.category ||
      p.description.toLowerCase().includes(service.shortTitle.toLowerCase())
  );
  const relatedArticles = matchedArticles.length > 0 ? matchedArticles.slice(0, 3) : allPosts.slice(0, 3);

  return (
    <div className="page-view-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
      <SingleServicePage
        slug={service.slug}
        initialService={service}
        allServices={allServices}
        relatedArticles={relatedArticles}
      />
    </div>
  );
}
