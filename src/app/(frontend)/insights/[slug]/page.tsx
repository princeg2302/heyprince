import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPosts } from '@/lib/cms';
import { SingleBlogPage } from '@/components';
import { getCommentsTree, getBlogLikes, CommentNode } from '@/lib/discussions/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Fetch SSR discussions & likes so comments are 100% Google crawlable & indexed in initial HTML
  const [commentsData, likesData] = await Promise.all([
    getCommentsTree(slug).catch((err) => {
      console.warn('Failed to load SSR comments for slug:', slug, err);
      return { count: 0, comments: [] as CommentNode[] };
    }),
    getBlogLikes(slug).catch(() => ({ count: 0, hasLiked: false })),
  ]);

  const absoluteImage = post.image.startsWith('http')
    ? post.image
    : `https://heyprince.in${post.image.startsWith('/') ? '' : '/'}${post.image}`;

  const blogSchema: Record<string, any> = {
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
      jobTitle: post.author?.role || 'Senior Full Stack Engineer & IT Consultant',
      image:
        post.author?.avatar ||
        'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg',
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
    commentCount: commentsData.count,
    comment: commentsData.comments.slice(0, 30).map((c) => ({
      '@type': 'Comment',
      text: c.content,
      dateCreated: c.createdAt,
      author: {
        '@type': 'Person',
        name: c.authorName,
        image: c.authorAvatar,
      },
      upvoteCount: c.likesCount,
    })),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: likesData.count,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: commentsData.count,
      },
    ],
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
      <SingleBlogPage
        slug={post.slug}
        post={post}
        initialComments={commentsData.comments}
        initialCommentCount={commentsData.count}
        initialLikes={likesData.count}
      />
    </div>
  );
}
