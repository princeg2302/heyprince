import config from '@payload-config';
import { getPayload } from 'payload';
import { createClient } from '@supabase/supabase-js';
import { servicesList, ServiceData } from '../data/servicesData';
import { articlesList, Article } from '../data/siteContent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muzbzrxwbanzsjvgtexp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_-_0Hj2xs4eK6DQ4CsKvmGw_QKyxgsnd';
const supabase = createClient(supabaseUrl, supabaseKey);

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
        'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg',
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
 * Retrieve all published insights/posts from Supabase / Payload with static fallback
 */
export async function getPosts(): Promise<Article[]> {
  try {
    // 1. Direct Supabase query for real-time posts
    const [{ data: dbPosts, error: sbError }, { data: adminUser }] = await Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase
        .from('users')
        .select('name, role, avatar_url')
        .limit(1)
        .single(),
    ]);

    if (!sbError && dbPosts && dbPosts.length > 0) {
      return dbPosts.map((doc: any) => ({
        slug: doc.slug,
        title: doc.title,
        description: doc.excerpt || doc.seo_description || '',
        readMins: doc.read_mins || '5 min',
        image: doc.cover_image || '/assets/blog/photo1.webp',
        url: `/insights/${doc.slug}/`,
        date: doc.published_at
          ? new Date(doc.published_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recent',
        category: doc.category_name || 'Engineering & Strategy',
        author: {
          name: adminUser?.name || doc.author_name || 'Prince',
          role:
            (adminUser?.role === 'admin'
              ? 'Senior Full Stack Engineer & IT Consultant'
              : adminUser?.role) ||
            doc.author_role ||
            'Senior Full Stack Engineer & IT Consultant',
          avatar:
            adminUser?.avatar_url ||
            doc.author_avatar ||
            'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg',
        },
        tags: [],
        sections: [],
      }));
    }

    // 2. Payload query fallback
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

  // Fallback to static articles with dynamic avatar sync
  try {
    const { data: adminUser } = await supabase.from('users').select('avatar_url').limit(1).single();
    if (adminUser?.avatar_url) {
      return articlesList.map((a) => ({
        ...a,
        author: {
          ...a.author,
          avatar: adminUser.avatar_url,
        },
      }));
    }
  } catch {}

  return articlesList;
}

/**
 * Retrieve a single insight/post by slug from Supabase / Payload with static fallback
 */
export async function getPostBySlug(slug: string): Promise<Article | null> {
  const normalizedSlug = slug.toLowerCase().trim();
  try {
    // 1. Direct Supabase query for real-time article data & live sections
    const { data: dbPost, error: sbError } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', normalizedSlug)
      .eq('status', 'published')
      .single();

    if (!sbError && dbPost) {
      const [tagsRes, sectionsRes, userRes] = await Promise.all([
        supabase.from('posts_tags').select('*').eq('_parent_id', dbPost.id).order('_order'),
        supabase.from('posts_sections').select('*').eq('_parent_id', dbPost.id).order('_order'),
        supabase.from('users').select('name, role, avatar_url').limit(1).single(),
      ]);

      const adminUser = userRes.data;
      const tags = (tagsRes.data || []).map((t: any) => t.tag);
      const rawSections = sectionsRes.data || [];
      const sections = await Promise.all(
        rawSections.map(async (sec: any) => {
          const [pRes, bRes] = await Promise.all([
            supabase.from('posts_sections_paragraphs').select('*').eq('_parent_id', sec.id).order('_order'),
            supabase.from('posts_sections_bullet_points').select('*').eq('_parent_id', sec.id).order('_order'),
          ]);
          return {
            heading: sec.heading || '',
            quote: sec.quote || undefined,
            proTip: sec.pro_tip || undefined,
            paragraphs: (pRes.data || []).map((p: any) => p.text),
            bulletPoints: (bRes.data || []).length > 0 ? (bRes.data || []).map((b: any) => b.point) : undefined,
          };
        })
      );

      return {
        slug: dbPost.slug,
        title: dbPost.title,
        description: dbPost.excerpt || dbPost.seo_description || '',
        readMins: dbPost.read_mins || '5 min',
        image: dbPost.cover_image || '/assets/blog/photo1.webp',
        url: `/insights/${dbPost.slug}/`,
        date: dbPost.published_at
          ? new Date(dbPost.published_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recent',
        category: dbPost.category_name || 'Engineering & Strategy',
        author: {
          name: adminUser?.name || dbPost.author_name || 'Prince',
          role:
            (adminUser?.role === 'admin'
              ? 'Senior Full Stack Engineer & IT Consultant'
              : adminUser?.role) ||
            dbPost.author_role ||
            'Senior Full Stack Engineer & IT Consultant',
          avatar:
            adminUser?.avatar_url ||
            dbPost.author_avatar ||
            'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg',
        },
        tags: tags.length > 0 ? tags : ['Technology', 'Engineering'],
        sections: sections.length > 0 ? sections : [],
      };
    }

    // 2. Payload query fallback
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
  if (staticMatch) {
    try {
      const { data: adminUser } = await supabase.from('users').select('avatar_url').limit(1).single();
      if (adminUser?.avatar_url) {
        return {
          ...staticMatch,
          author: {
            ...staticMatch.author,
            avatar: adminUser.avatar_url,
          },
        };
      }
    } catch {}
    return staticMatch;
  }
  return null;
}

