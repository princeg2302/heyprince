import config from '@payload-config';
import { getPayload } from 'payload';
import { servicesList, ServiceData } from '../data/servicesData';
import { articlesList, Article } from '../data/siteContent';

/**
 * Maps a database Service document to the frontend ServiceData format
 */
function mapPayloadServiceToServiceData(doc: any): ServiceData {
  return {
    id: doc.id ? String(doc.id) : doc.slug,
    slug: doc.slug,
    title: doc.title,
    shortTitle: doc.shortTitle || doc.title,
    tagline: doc.tagline || '',
    category:
      typeof doc.category === 'object' && doc.category?.title
        ? doc.category.title
        : doc.categoryName || 'Engineering & Advisory',
    cardTheme: doc.cardTheme || 'black',
    isFeatured: Boolean(doc.isFeatured),
    featuredBadge: doc.featuredBadge || (doc.isFeatured ? '★ FEATURED' : undefined),
    iconName: doc.iconName || 'FaCode',
    heroDescription: doc.heroDescription || doc.shortDescription || '',
    overview: Array.isArray(doc.overview)
      ? doc.overview.map((o: any) => (typeof o === 'string' ? o : o.paragraph || ''))
      : [],
    deliverables: Array.isArray(doc.deliverables)
      ? doc.deliverables.map((d: any) => ({
          title: d.title || '',
          desc: d.desc || '',
        }))
      : [],
    techStack: Array.isArray(doc.techStack)
      ? doc.techStack.map((t: any) => (typeof t === 'string' ? t : t.name || ''))
      : [],
    process: Array.isArray(doc.process)
      ? doc.process.map((p: any) => ({
          step: p.step || '01',
          title: p.title || '',
          desc: p.desc || '',
        }))
      : [],
    highlights: Array.isArray(doc.highlights)
      ? doc.highlights.map((h: any) => (typeof h === 'string' ? h : h.text || ''))
      : [],
    faqs: Array.isArray(doc.faqs)
      ? doc.faqs.map((f: any) => ({
          q: f.q || '',
          a: f.a || '',
        }))
      : [],
    metaTitle: doc.seoTitle || `${doc.title} | HeyPrince`,
    metaDescription: doc.seoDescription || doc.shortDescription || doc.heroDescription || '',
  };
}

/**
 * Maps a database Post document to the frontend Article format
 */
function mapPayloadPostToArticle(doc: any): Article {
  const coverImg =
    doc.featuredImage && typeof doc.featuredImage === 'object' && doc.featuredImage.url
      ? doc.featuredImage.url
      : doc.coverImage || '/assets/blog/photo1.webp';

  return {
    slug: doc.slug,
    title: doc.title,
    description: doc.excerpt || doc.seoDescription || '',
    readMins: doc.readMins || '5 min',
    image: coverImg,
    url: `/insights/${doc.slug}/`,
    date: doc.publishedAt
      ? new Date(doc.publishedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Recent',
    category:
      typeof doc.category === 'object' && doc.category?.title
        ? doc.category.title
        : doc.categoryName || 'Engineering & Strategy',
    author: {
      name: doc.author?.name || 'Prince',
      role: doc.author?.role || 'Senior Full Stack Engineer & IT Consultant',
      avatar:
        doc.author?.avatar ||
        'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
    },
    tags: Array.isArray(doc.tags)
      ? doc.tags.map((t: any) => (typeof t === 'string' ? t : t.tag || ''))
      : [],
    sections: Array.isArray(doc.sections)
      ? doc.sections.map((s: any) => ({
          heading: s.heading || '',
          paragraphs: Array.isArray(s.paragraphs)
            ? s.paragraphs.map((p: any) => (typeof p === 'string' ? p : p.text || ''))
            : [],
          bulletPoints: Array.isArray(s.bulletPoints)
            ? s.bulletPoints.map((bp: any) => (typeof bp === 'string' ? bp : bp.point || ''))
            : undefined,
          quote: s.quote || undefined,
          proTip: s.proTip || undefined,
        }))
      : [],
  };
}

/**
 * Retrieve all published services from Payload/PostgreSQL with static fallback
 */
export async function getServices(): Promise<ServiceData[]> {
  try {
    if (process.env.DATABASE_URI || process.env.POSTGRES_URL) {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: 'services',
        where: {
          published: { equals: true },
        },
        sort: 'sortOrder',
        limit: 100,
      });

      if (result.docs && result.docs.length > 0) {
        return result.docs.map(mapPayloadServiceToServiceData);
      }
    }
  } catch (error) {
    // Graceful fallback to static data
  }
  return servicesList;
}

/**
 * Retrieve a single service by slug from Payload/PostgreSQL with static fallback
 */
export async function getServiceBySlug(slug: string): Promise<ServiceData | null> {
  const normalizedSlug = slug.toLowerCase().trim();
  try {
    if (process.env.DATABASE_URI || process.env.POSTGRES_URL) {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: 'services',
        where: {
          slug: { equals: normalizedSlug },
          published: { equals: true },
        },
        limit: 1,
      });

      if (result.docs && result.docs.length > 0) {
        return mapPayloadServiceToServiceData(result.docs[0]);
      }
    }
  } catch (error) {
    // Graceful fallback
  }

  const staticMatch = servicesList.find((s) => s.slug.toLowerCase() === normalizedSlug);
  return staticMatch || null;
}

/**
 * Retrieve all published insights/posts from Payload/PostgreSQL with static fallback
 */
export async function getPosts(): Promise<Article[]> {
  try {
    if (process.env.DATABASE_URI || process.env.POSTGRES_URL) {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: 'posts',
        where: {
          status: { equals: 'published' },
        },
        sort: '-publishedAt',
        limit: 100,
      });

      if (result.docs && result.docs.length > 0) {
        return result.docs.map(mapPayloadPostToArticle);
      }
    }
  } catch (error) {
    // Graceful fallback
  }
  return articlesList;
}

/**
 * Retrieve a single insight/post by slug from Payload/PostgreSQL with static fallback
 */
export async function getPostBySlug(slug: string): Promise<Article | null> {
  const normalizedSlug = slug.toLowerCase().trim();
  try {
    if (process.env.DATABASE_URI || process.env.POSTGRES_URL) {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: 'posts',
        where: {
          slug: { equals: normalizedSlug },
          status: { equals: 'published' },
        },
        limit: 1,
      });

      if (result.docs && result.docs.length > 0) {
        return mapPayloadPostToArticle(result.docs[0]);
      }
    }
  } catch (error) {
    // Graceful fallback
  }

  const staticMatch = articlesList.find((a) => a.slug.toLowerCase() === normalizedSlug);
  return staticMatch || null;
}

