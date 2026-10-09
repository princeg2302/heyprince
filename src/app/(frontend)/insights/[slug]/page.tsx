import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPosts } from '@/lib/cms';
import { SingleBlogPage } from '@/components';

interface InsightPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: InsightPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Insight Not Found | HeyPrince',
      description: 'The requested engineering insight could not be found.',
    };
  }

  const absoluteImage = post.image.startsWith('http')
    ? post.image
    : `https://heyprince.in${post.image.startsWith('/') ? '' : '/'}${post.image}`;

  return {
    title: `${post.title} | Prince — Tech Partner`,
    description: post.description,
    keywords: `${post.tags.join(', ')}, Web Development, IT Engineering, Prince, Software Architecture, Full Stack Consultant`,
    alternates: {
      canonical: `https://heyprince.in/insights/${post.slug}/`,
    },
    openGraph: {
      title: `${post.title} | Prince — Tech Partner`,
      description: post.description,
      url: `https://heyprince.in/insights/${post.slug}/`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author?.name || 'Prince'],
      images: [
        {
          url: absoluteImage,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Prince — Tech Partner`,
      description: post.description,
      images: [absoluteImage],
    },
  };
}

export default async function InsightRoute({ params }: InsightPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const absoluteImage = post.image.startsWith('http')
    ? post.image
    : `https://heyprince.in${post.image.startsWith('/') ? '' : '/'}${post.image}`;

  const blogSchema = {
    '@type': 'BlogPosting',
    '@id': `https://heyprince.in/insights/${post.slug}/#article`,
    headline: post.title,
    description: post.description,
    image: [absoluteImage],
    datePublished: post.date || '2026-01-18',
    dateModified: post.date || '2026-10-02',
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Prince',
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
      '@id': `https://heyprince.in/insights/${post.slug}/`,
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
        name: post.title,
        item: `https://heyprince.in/insights/${post.slug}/`,
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
      <SingleBlogPage slug={post.slug} post={post} />
    </div>
  );
}
