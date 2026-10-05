import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { articlesList } from '../../../data/siteContent';
import { SingleBlogPage } from '../../../components';

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return articlesList.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = articlesList.find((a) => a.slug.toLowerCase() === slug.toLowerCase());

  if (!article) {
    return {
      title: 'Article Not Found | HeyPrince',
      description: 'The requested article could not be found.',
    };
  }

  const absoluteImage = article.image.startsWith('http')
    ? article.image
    : `https://heyprince.in${article.image.startsWith('/') ? '' : '/'}${article.image}`;

  return {
    title: `${article.title} | Prince — Tech Partner`,
    description: article.description,
    keywords: `${article.tags.join(', ')}, Web Development, IT Engineering, Prince, Software Architecture, Full Stack Consultant`,
    alternates: {
      canonical: `https://heyprince.in/blog/${article.slug}/`,
    },
    openGraph: {
      title: `${article.title} | Prince — Tech Partner`,
      description: article.description,
      url: `https://heyprince.in/blog/${article.slug}/`,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author?.name || 'Prince'],
      images: [
        {
          url: absoluteImage,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} | Prince — Tech Partner`,
      description: article.description,
      images: [absoluteImage],
    },
  };
}

export default async function BlogRoute({ params }: BlogPageProps) {
  const { slug } = await params;
  const article = articlesList.find((a) => a.slug.toLowerCase() === slug.toLowerCase());

  if (!article) {
    notFound();
  }

  const absoluteImage = article.image.startsWith('http')
    ? article.image
    : `https://heyprince.in${article.image.startsWith('/') ? '' : '/'}${article.image}`;

  const blogSchema = {
    '@type': 'BlogPosting',
    '@id': `https://heyprince.in/blog/${article.slug}/#article`,
    headline: article.title,
    description: article.description,
    image: [absoluteImage],
    datePublished: article.date || '2026-01-18',
    dateModified: article.date || '2026-10-02',
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Prince',
      url: 'https://heyprince.in/',
      jobTitle: 'Senior Full Stack Engineer & IT Consultant',
    },
    publisher: {
      '@type': 'Person',
      name: 'Prince',
      logo: {
        '@type': 'ImageObject',
        url: 'https://heyprince.in/assets/heyprince-logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://heyprince.in/blog/${article.slug}/`,
    },
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
        name: 'Insights',
        item: 'https://heyprince.in/#articles',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `https://heyprince.in/blog/${article.slug}/`,
      },
    ],
  };

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [blogSchema, breadcrumbSchema],
  };

  return (
    <div className="page-view-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
      <SingleBlogPage slug={article.slug} />
    </div>
  );
}

