import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muzbzrxwbanzsjvgtexp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_-_0Hj2xs4eK6DQ4CsKvmGw_QKyxgsnd';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Password hashing constants matching the database schema and Payload specification
const HASH_PREFIX = 'pbkdf2-sha256-v1:';
const HASH_ITERATIONS = 600000;
const HASH_KEY_LENGTH = 32;

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  if (!storedHash || !salt) return false;
  let target = storedHash;
  if (target.startsWith(HASH_PREFIX)) {
    target = target.slice(HASH_PREFIX.length);
  }
  const derived = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, 'sha256').toString('hex');
  return derived === target;
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, 'sha256').toString('hex');
  return {
    salt,
    hash: `${HASH_PREFIX}${derived}`,
  };
}

export function generateRowId(): string {
  return crypto.randomBytes(12).toString('hex');
}


export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
  updated_at: string;
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hp_admin_session')?.value;
    if (!sessionCookie) return null;

    let payload: { id: number; email: string; name?: string; role?: string; exp: number };
    try {
      payload = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf8'));
    } catch {
      return null;
    }

    if (!payload || !payload.id || !payload.email) {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    // Try fetching fresh profile data from Supabase
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at, updated_at')
        .eq('id', payload.id)
        .single();

      if (!error && user) {
        return user as AdminUser;
      }
    } catch (dbErr) {
      console.warn('[getCurrentAdmin] Live profile check error:', dbErr);
    }

    // Fall back to valid session payload so transient connection errors do not kick the user out
    return {
      id: payload.id,
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      role: (payload.role as 'admin' | 'editor') || 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function authenticateAdmin(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const isValid = verifyPassword(password, user.salt, user.hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const cookieStore = await cookies();
    const sessionData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    cookieStore.set('hp_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Authentication error' };
  }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('hp_admin_session');
}

// ==============================================================================
// DASHBOARD METRICS
// ==============================================================================

export interface DashboardStats {
  postsCount: number;
  publishedPostsCount: number;
  draftPostsCount: number;
  servicesCount: number;
  publishedServicesCount: number;
  featuredServicesCount: number;
  usersCount: number;
  categoriesCount: number;
  leadsCount: number;
  newLeadsCount: number;
  mediaCount: number;
  recentLeads: any[];
  recentPosts: any[];
  recentServices: any[];
  categoriesSummary: { title: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [
      postsRes,
      publishedPostsRes,
      draftPostsRes,
      servicesRes,
      publishedServicesRes,
      featuredServicesRes,
      usersRes,
      categoriesRes,
      leadsRes,
      newLeadsRes,
      mediaRes,
      recentLeadsRes,
      recentPostsRes,
      recentServicesRes,
    ] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('published', true),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_featured', true),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id, title'),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'NEW'),
      supabase.from('media').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('services').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const categoriesList = categoriesRes.data || [];
    const categoriesSummary = categoriesList.map((cat) => ({
      title: cat.title,
      count: 0,
    }));

    return {
      postsCount: postsRes.count || 0,
      publishedPostsCount: publishedPostsRes.count || 0,
      draftPostsCount: draftPostsRes.count || 0,
      servicesCount: servicesRes.count || 0,
      publishedServicesCount: publishedServicesRes.count || 0,
      featuredServicesCount: featuredServicesRes.count || 0,
      usersCount: usersRes.count || 0,
      categoriesCount: categoriesList.length,
      leadsCount: leadsRes.count || 0,
      newLeadsCount: newLeadsRes.count || 0,
      mediaCount: mediaRes.count || 0,
      recentLeads: recentLeadsRes.data || [],
      recentPosts: recentPostsRes.data || [],
      recentServices: recentServicesRes.data || [],
      categoriesSummary,
    };
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return {
      postsCount: 0,
      publishedPostsCount: 0,
      draftPostsCount: 0,
      servicesCount: 0,
      publishedServicesCount: 0,
      featuredServicesCount: 0,
      usersCount: 0,
      categoriesCount: 0,
      leadsCount: 0,
      newLeadsCount: 0,
      mediaCount: 0,
      recentLeads: [],
      recentPosts: [],
      recentServices: [],
      categoriesSummary: [],
    };
  }
}

// ==============================================================================
// POSTS CRUD
// ==============================================================================

export interface PostRecord {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  read_mins: string;
  category_id?: number | null;
  category_name?: string | null;
  author_name: string;
  author_role: string;
  author_avatar: string;
  featured_image_id?: number | null;
  cover_image?: string | null;
  status: 'published' | 'draft';
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical?: string | null;
  created_at: string;
  updated_at: string;
  tags?: { id?: number; tag: string }[];
  sections?: {
    id?: number;
    heading: string;
    quote?: string;
    pro_tip?: string;
    paragraphs?: { text: string }[];
    bullet_points?: { point: string }[];
  }[];
}

export async function getPostsList(options?: {
  search?: string;
  status?: string;
  categoryId?: number;
  limit?: number;
  page?: number;
}): Promise<{ posts: PostRecord[]; total: number }> {
  try {
    let query = supabase.from('posts').select('*', { count: 'exact' });

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,slug.ilike.%${options.search}%,excerpt.ilike.%${options.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const limit = options?.limit || 20;
    const page = options?.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching posts:', error);
      return { posts: [], total: 0 };
    }

    return { posts: (data || []) as PostRecord[], total: count || 0 };
  } catch (err) {
    console.error('Error in getPostsList:', err);
    return { posts: [], total: 0 };
  }
}

export async function getPostById(id: number): Promise<PostRecord | null> {
  try {
    const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single();
    if (error || !post) return null;

    // Fetch related tags and sections
    const [tagsRes, sectionsRes] = await Promise.all([
      supabase.from('posts_tags').select('*').eq('_parent_id', id).order('_order'),
      supabase.from('posts_sections').select('*').eq('_parent_id', id).order('_order'),
    ]);

    const tags = (tagsRes.data || []).map((t) => ({ id: t.id, tag: t.tag }));
    const sections = await Promise.all(
      (sectionsRes.data || []).map(async (sec) => {
        const [paragraphsRes, bulletsRes] = await Promise.all([
          supabase.from('posts_sections_paragraphs').select('*').eq('_parent_id', sec.id).order('_order'),
          supabase.from('posts_sections_bullet_points').select('*').eq('_parent_id', sec.id).order('_order'),
        ]);
        return {
          id: sec.id,
          heading: sec.heading,
          quote: sec.quote || '',
          pro_tip: sec.pro_tip || '',
          paragraphs: (paragraphsRes.data || []).map((p) => ({ text: p.text })),
          bullet_points: (bulletsRes.data || []).map((b) => ({ point: b.point })),
        };
      })
    );

    return {
      ...post,
      tags,
      sections,
    } as PostRecord;
  } catch (err) {
    console.error('Error fetching post by id:', err);
    return null;
  }
}

export async function createPost(data: Partial<PostRecord>): Promise<{ success: boolean; post?: PostRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const insertPayload = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || '',
      read_mins: data.read_mins || '5 min',
      category_id: data.category_id || null,
      category_name: data.category_name || null,
      author_name: data.author_name || 'Prince',
      author_role: data.author_role || 'Senior Full Stack Engineer & IT Consultant',
      author_avatar: data.author_avatar || 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
      cover_image: data.cover_image || '/assets/blog/photo1.webp',
      status: data.status || 'published',
      published_at: data.published_at || (data.status === 'published' ? now : null),
      seo_title: data.seo_title || `${data.title} | Prince — Tech Partner`,
      seo_description: data.seo_description || data.excerpt || '',
      canonical: data.canonical || `https://heyprince.in/insights/${data.slug}/`,
      created_at: now,
      updated_at: now,
    };

    const { data: created, error } = await supabase.from('posts').insert([insertPayload]).select().single();
    if (error || !created) {
      return { success: false, error: error?.message || 'Failed to create post' };
    }

    const postId = created.id;

    // Insert tags if any
    if (data.tags && data.tags.length > 0) {
      const tagRows = data.tags.map((t, index) => ({
        id: generateRowId(),
        _parent_id: postId,
        _order: index + 1,
        tag: t.tag,
      }));
      await supabase.from('posts_tags').insert(tagRows);
    }

    // Insert sections if any
    if (data.sections && data.sections.length > 0) {
      for (let sIdx = 0; sIdx < data.sections.length; sIdx++) {
        const sec = data.sections[sIdx];
        const secId = generateRowId();
        const { data: createdSec } = await supabase
          .from('posts_sections')
          .insert([
            {
              id: secId,
              _parent_id: postId,
              _order: sIdx + 1,
              heading: sec.heading,
              quote: sec.quote || '',
              pro_tip: sec.pro_tip || '',
            },
          ])
          .select()
          .single();

        if (createdSec) {
          if (sec.paragraphs && sec.paragraphs.length > 0) {
            const pRows = sec.paragraphs.map((p, pIdx) => ({
              id: generateRowId(),
              _parent_id: createdSec.id,
              _order: pIdx + 1,
              text: p.text,
            }));
            await supabase.from('posts_sections_paragraphs').insert(pRows);
          }
          if (sec.bullet_points && sec.bullet_points.length > 0) {
            const bRows = sec.bullet_points.map((b, bIdx) => ({
              id: generateRowId(),
              _parent_id: createdSec.id,
              _order: bIdx + 1,
              point: b.point,
            }));
            await supabase.from('posts_sections_bullet_points').insert(bRows);
          }
        }
      }
    }

    return { success: true, post: created as PostRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating post' };
  }
}

export async function updatePost(id: number, data: Partial<PostRecord>): Promise<{ success: boolean; post?: PostRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const updatePayload: any = {
      updated_at: now,
    };

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.excerpt !== undefined) updatePayload.excerpt = data.excerpt;
    if (data.read_mins !== undefined) updatePayload.read_mins = data.read_mins;
    if (data.category_id !== undefined) updatePayload.category_id = data.category_id;
    if (data.category_name !== undefined) updatePayload.category_name = data.category_name;
    if (data.author_name !== undefined) updatePayload.author_name = data.author_name;
    if (data.author_role !== undefined) updatePayload.author_role = data.author_role;
    if (data.author_avatar !== undefined) updatePayload.author_avatar = data.author_avatar;
    if (data.cover_image !== undefined) updatePayload.cover_image = data.cover_image;
    if (data.status !== undefined) {
      updatePayload.status = data.status;
      if (data.status === 'published' && !data.published_at) {
        updatePayload.published_at = now;
      }
    }
    if (data.published_at !== undefined) updatePayload.published_at = data.published_at;
    if (data.seo_title !== undefined) updatePayload.seo_title = data.seo_title;
    if (data.seo_description !== undefined) updatePayload.seo_description = data.seo_description;
    if (data.canonical !== undefined) updatePayload.canonical = data.canonical;

    const { data: updated, error } = await supabase.from('posts').update(updatePayload).eq('id', id).select().single();
    if (error || !updated) {
      return { success: false, error: error?.message || 'Failed to update post' };
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      await supabase.from('posts_tags').delete().eq('_parent_id', id);
      if (data.tags.length > 0) {
        const tagRows = data.tags.map((t, idx) => ({
          id: generateRowId(),
          _parent_id: id,
          _order: idx + 1,
          tag: t.tag,
        }));
        await supabase.from('posts_tags').insert(tagRows);
      }
    }

    // Update sections if provided
    if (data.sections !== undefined) {
      // Find old sections and delete children
      const { data: oldSections } = await supabase.from('posts_sections').select('id').eq('_parent_id', id);
      if (oldSections && oldSections.length > 0) {
        const oldSecIds = oldSections.map((s) => s.id);
        await Promise.all([
          supabase.from('posts_sections_paragraphs').delete().in('_parent_id', oldSecIds),
          supabase.from('posts_sections_bullet_points').delete().in('_parent_id', oldSecIds),
        ]);
        await supabase.from('posts_sections').delete().eq('_parent_id', id);
      }

      for (let sIdx = 0; sIdx < data.sections.length; sIdx++) {
        const sec = data.sections[sIdx];
        const secId = generateRowId();
        const { data: createdSec } = await supabase
          .from('posts_sections')
          .insert([
            {
              id: secId,
              _parent_id: id,
              _order: sIdx + 1,
              heading: sec.heading,
              quote: sec.quote || '',
              pro_tip: sec.pro_tip || '',
            },
          ])
          .select()
          .single();

        if (createdSec) {
          if (sec.paragraphs && sec.paragraphs.length > 0) {
            const pRows = sec.paragraphs.map((p, pIdx) => ({
              id: generateRowId(),
              _parent_id: createdSec.id,
              _order: pIdx + 1,
              text: p.text,
            }));
            await supabase.from('posts_sections_paragraphs').insert(pRows);
          }
          if (sec.bullet_points && sec.bullet_points.length > 0) {
            const bRows = sec.bullet_points.map((b, bIdx) => ({
              id: generateRowId(),
              _parent_id: createdSec.id,
              _order: bIdx + 1,
              point: b.point,
            }));
            await supabase.from('posts_sections_bullet_points').insert(bRows);
          }
        }
      }
    }

    return { success: true, post: updated as PostRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating post' };
  }
}

export async function deletePost(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete child relations
    const { data: sections } = await supabase.from('posts_sections').select('id').eq('_parent_id', id);
    if (sections && sections.length > 0) {
      const secIds = sections.map((s) => s.id);
      await Promise.all([
        supabase.from('posts_sections_paragraphs').delete().in('_parent_id', secIds),
        supabase.from('posts_sections_bullet_points').delete().in('_parent_id', secIds),
      ]);
      await supabase.from('posts_sections').delete().eq('_parent_id', id);
    }
    await supabase.from('posts_tags').delete().eq('_parent_id', id);

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting post' };
  }
}

// ==============================================================================
// SERVICES CRUD
// ==============================================================================

export interface ServiceRecord {
  id: number;
  title: string;
  slug: string;
  short_title?: string | null;
  tagline?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  card_theme: string;
  is_featured: boolean;
  featured_badge?: string | null;
  icon_name?: string | null;
  short_description?: string | null;
  hero_description?: string | null;
  description?: string | null;
  pricing_type: string;
  starting_price?: number | null;
  published: boolean;
  sort_order: number;
  hero_image?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at: string;
  updated_at: string;
  overview?: { paragraph: string }[];
  deliverables?: { title: string; desc: string }[];
  tech_stack?: { name: string }[];
  process?: { step: string; title: string; desc: string }[];
  highlights?: { text: string }[];
  faqs?: { q: string; a: string }[];
}

export async function getServicesList(options?: {
  search?: string;
  published?: boolean;
  categoryId?: number;
  limit?: number;
  page?: number;
}): Promise<{ services: ServiceRecord[]; total: number }> {
  try {
    let query = supabase.from('services').select('*', { count: 'exact' });

    if (options?.published !== undefined) {
      query = query.eq('published', options.published);
    }
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,slug.ilike.%${options.search}%,tagline.ilike.%${options.search}%`);
    }

    query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

    const limit = options?.limit || 20;
    const page = options?.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching services:', error);
      return { services: [], total: 0 };
    }

    return { services: (data || []) as ServiceRecord[], total: count || 0 };
  } catch (err) {
    console.error('Error in getServicesList:', err);
    return { services: [], total: 0 };
  }
}

export async function getServiceById(id: number): Promise<ServiceRecord | null> {
  try {
    const { data: service, error } = await supabase.from('services').select('*').eq('id', id).single();
    if (error || !service) return null;

    const [overviewRes, deliverablesRes, techRes, processRes, highlightsRes, faqsRes] = await Promise.all([
      supabase.from('services_overview').select('*').eq('_parent_id', id).order('_order'),
      supabase.from('services_deliverables').select('*').eq('_parent_id', id).order('_order'),
      supabase.from('services_tech_stack').select('*').eq('_parent_id', id).order('_order'),
      supabase.from('services_process').select('*').eq('_parent_id', id).order('_order'),
      supabase.from('services_highlights').select('*').eq('_parent_id', id).order('_order'),
      supabase.from('services_faqs').select('*').eq('_parent_id', id).order('_order'),
    ]);

    return {
      ...service,
      overview: (overviewRes.data || []).map((o) => ({ paragraph: o.paragraph })),
      deliverables: (deliverablesRes.data || []).map((d) => ({ title: d.title, desc: d.desc })),
      tech_stack: (techRes.data || []).map((t) => ({ name: t.name })),
      process: (processRes.data || []).map((p) => ({ step: p.step, title: p.title, desc: p.desc })),
      highlights: (highlightsRes.data || []).map((h) => ({ text: h.text })),
      faqs: (faqsRes.data || []).map((f) => ({ q: f.q, a: f.a })),
    } as ServiceRecord;
  } catch (err) {
    console.error('Error fetching service by id:', err);
    return null;
  }
}

export async function createService(data: Partial<ServiceRecord>): Promise<{ success: boolean; service?: ServiceRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const insertPayload = {
      title: data.title,
      slug: data.slug,
      short_title: data.short_title || data.title,
      tagline: data.tagline || '',
      category_id: data.category_id || null,
      category_name: data.category_name || null,
      card_theme: data.card_theme || 'black',
      is_featured: Boolean(data.is_featured),
      featured_badge: data.featured_badge || null,
      icon_name: data.icon_name || 'FaCode',
      short_description: data.short_description || '',
      hero_description: data.hero_description || data.short_description || '',
      description: data.description || '',
      pricing_type: data.pricing_type || 'custom',
      starting_price: data.starting_price || null,
      published: data.published !== undefined ? data.published : true,
      sort_order: data.sort_order || 0,
      hero_image: data.hero_image || null,
      seo_title: data.seo_title || `${data.title} | Prince — Senior IT Consultant`,
      seo_description: data.seo_description || data.short_description || '',
      created_at: now,
      updated_at: now,
    };

    const { data: created, error } = await supabase.from('services').insert([insertPayload]).select().single();
    if (error || !created) {
      return { success: false, error: error?.message || 'Failed to create service' };
    }

    const serviceId = created.id;

    // Insert child arrays
    if (data.overview && data.overview.length > 0) {
      const rows = data.overview.map((o, idx) => ({ id: generateRowId(), _parent_id: serviceId, _order: idx + 1, paragraph: o.paragraph }));
      await supabase.from('services_overview').insert(rows);
    }
    if (data.deliverables && data.deliverables.length > 0) {
      const rows = data.deliverables.map((d, idx) => ({ id: generateRowId(), _parent_id: serviceId, _order: idx + 1, title: d.title, desc: d.desc }));
      await supabase.from('services_deliverables').insert(rows);
    }
    if (data.tech_stack && data.tech_stack.length > 0) {
      const rows = data.tech_stack.map((t, idx) => ({ id: generateRowId(), _parent_id: serviceId, _order: idx + 1, name: t.name }));
      await supabase.from('services_tech_stack').insert(rows);
    }
    if (data.process && data.process.length > 0) {
      const rows = data.process.map((p, idx) => ({ id: generateRowId(), _parent_id: serviceId, _order: idx + 1, step: p.step, title: p.title, desc: p.desc }));
      await supabase.from('services_process').insert(rows);
    }
    if (data.highlights && data.highlights.length > 0) {
      const rows = data.highlights.map((h, idx) => ({ id: generateRowId(), _parent_id: serviceId, _order: idx + 1, text: h.text }));
      await supabase.from('services_highlights').insert(rows);
    }
    if (data.faqs && data.faqs.length > 0) {
      const rows = data.faqs.map((f, idx) => ({ id: generateRowId(), _parent_id: serviceId, _order: idx + 1, q: f.q, a: f.a }));
      await supabase.from('services_faqs').insert(rows);
    }

    return { success: true, service: created as ServiceRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating service' };
  }
}

export async function updateService(id: number, data: Partial<ServiceRecord>): Promise<{ success: boolean; service?: ServiceRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const updatePayload: any = { updated_at: now };

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.short_title !== undefined) updatePayload.short_title = data.short_title;
    if (data.tagline !== undefined) updatePayload.tagline = data.tagline;
    if (data.category_id !== undefined) updatePayload.category_id = data.category_id;
    if (data.category_name !== undefined) updatePayload.category_name = data.category_name;
    if (data.card_theme !== undefined) updatePayload.card_theme = data.card_theme;
    if (data.is_featured !== undefined) updatePayload.is_featured = data.is_featured;
    if (data.featured_badge !== undefined) updatePayload.featured_badge = data.featured_badge;
    if (data.icon_name !== undefined) updatePayload.icon_name = data.icon_name;
    if (data.short_description !== undefined) updatePayload.short_description = data.short_description;
    if (data.hero_description !== undefined) updatePayload.hero_description = data.hero_description;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.pricing_type !== undefined) updatePayload.pricing_type = data.pricing_type;
    if (data.starting_price !== undefined) updatePayload.starting_price = data.starting_price;
    if (data.published !== undefined) updatePayload.published = data.published;
    if (data.sort_order !== undefined) updatePayload.sort_order = data.sort_order;
    if (data.hero_image !== undefined) updatePayload.hero_image = data.hero_image;
    if (data.seo_title !== undefined) updatePayload.seo_title = data.seo_title;
    if (data.seo_description !== undefined) updatePayload.seo_description = data.seo_description;

    const { data: updated, error } = await supabase.from('services').update(updatePayload).eq('id', id).select().single();
    if (error || !updated) {
      return { success: false, error: error?.message || 'Failed to update service' };
    }

    // Refresh child arrays if specified
    if (data.overview !== undefined) {
      await supabase.from('services_overview').delete().eq('_parent_id', id);
      if (data.overview.length > 0) {
        const rows = data.overview.map((o, idx) => ({ id: generateRowId(), _parent_id: id, _order: idx + 1, paragraph: o.paragraph }));
        await supabase.from('services_overview').insert(rows);
      }
    }
    if (data.deliverables !== undefined) {
      await supabase.from('services_deliverables').delete().eq('_parent_id', id);
      if (data.deliverables.length > 0) {
        const rows = data.deliverables.map((d, idx) => ({ id: generateRowId(), _parent_id: id, _order: idx + 1, title: d.title, desc: d.desc }));
        await supabase.from('services_deliverables').insert(rows);
      }
    }
    if (data.tech_stack !== undefined) {
      await supabase.from('services_tech_stack').delete().eq('_parent_id', id);
      if (data.tech_stack.length > 0) {
        const rows = data.tech_stack.map((t, idx) => ({ id: generateRowId(), _parent_id: id, _order: idx + 1, name: t.name }));
        await supabase.from('services_tech_stack').insert(rows);
      }
    }
    if (data.process !== undefined) {
      await supabase.from('services_process').delete().eq('_parent_id', id);
      if (data.process.length > 0) {
        const rows = data.process.map((p, idx) => ({ id: generateRowId(), _parent_id: id, _order: idx + 1, step: p.step, title: p.title, desc: p.desc }));
        await supabase.from('services_process').insert(rows);
      }
    }
    if (data.highlights !== undefined) {
      await supabase.from('services_highlights').delete().eq('_parent_id', id);
      if (data.highlights.length > 0) {
        const rows = data.highlights.map((h, idx) => ({ id: generateRowId(), _parent_id: id, _order: idx + 1, text: h.text }));
        await supabase.from('services_highlights').insert(rows);
      }
    }
    if (data.faqs !== undefined) {
      await supabase.from('services_faqs').delete().eq('_parent_id', id);
      if (data.faqs.length > 0) {
        const rows = data.faqs.map((f, idx) => ({ id: generateRowId(), _parent_id: id, _order: idx + 1, q: f.q, a: f.a }));
        await supabase.from('services_faqs').insert(rows);
      }
    }

    return { success: true, service: updated as ServiceRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating service' };
  }
}

export async function deleteService(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await Promise.all([
      supabase.from('services_overview').delete().eq('_parent_id', id),
      supabase.from('services_deliverables').delete().eq('_parent_id', id),
      supabase.from('services_tech_stack').delete().eq('_parent_id', id),
      supabase.from('services_process').delete().eq('_parent_id', id),
      supabase.from('services_highlights').delete().eq('_parent_id', id),
      supabase.from('services_faqs').delete().eq('_parent_id', id),
    ]);
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting service' };
  }
}

// ==============================================================================
// USERS CRUD
// ==============================================================================

export async function getUsersList(): Promise<AdminUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return (data || []) as AdminUser[];
  } catch {
    return [];
  }
}

export async function getUserById(id: number): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as AdminUser;
  } catch {
    return null;
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor';
}): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await supabase.from('users').select('id').eq('email', normalizedEmail).limit(1);
    if (existing.data && existing.data.length > 0) {
      return { success: false, error: 'A user with this email address already exists.' };
    }

    const plainPassword = data.password || 'HeyPrinceAdmin2026!';
    const { salt, hash } = hashPassword(plainPassword);
    const now = new Date().toISOString();

    const insertPayload = {
      name: data.name.trim(),
      email: normalizedEmail,
      role: data.role || 'admin',
      salt,
      hash,
      created_at: now,
      updated_at: now,
    };

    const { data: created, error } = await supabase
      .from('users')
      .insert([insertPayload])
      .select('id, name, email, role, created_at, updated_at')
      .single();

    if (error || !created) {
      return { success: false, error: error?.message || 'Failed to create user' };
    }

    return { success: true, user: created as AdminUser };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating user' };
  }
}

export async function updateUser(
  id: number,
  data: {
    name?: string;
    email?: string;
    role?: 'admin' | 'editor';
    password?: string;
  }
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const now = new Date().toISOString();
    const updatePayload: any = { updated_at: now };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
    if (data.role !== undefined) updatePayload.role = data.role;

    if (data.password && data.password.trim().length > 0) {
      const { salt, hash } = hashPassword(data.password.trim());
      updatePayload.salt = salt;
      updatePayload.hash = hash;
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select('id, name, email, role, created_at, updated_at')
      .single();

    if (error || !updated) {
      return { success: false, error: error?.message || 'Failed to update user' };
    }

    return { success: true, user: updated as AdminUser };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating user' };
  }
}

export async function deleteUser(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if it's the last admin
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if ((count || 0) <= 1) {
      return { success: false, error: 'Cannot delete the only existing administrator account.' };
    }

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting user' };
  }
}

// ==============================================================================
// CATEGORIES CRUD
// ==============================================================================

export interface CategoryRecord {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCategoriesList(): Promise<CategoryRecord[]> {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('title');
    if (error) return [];
    return (data || []) as CategoryRecord[];
  } catch {
    return [];
  }
}

export async function createCategory(data: {
  title: string;
  slug: string;
  description?: string;
}): Promise<{ success: boolean; category?: CategoryRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const { data: created, error } = await supabase
      .from('categories')
      .insert([
        {
          title: data.title.trim(),
          slug: data.slug.trim().toLowerCase(),
          description: data.description || '',
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error || !created) {
      return { success: false, error: error?.message || 'Failed to create category' };
    }
    return { success: true, category: created as CategoryRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating category' };
  }
}

export async function updateCategory(
  id: number,
  data: {
    title?: string;
    slug?: string;
    description?: string;
  }
): Promise<{ success: boolean; category?: CategoryRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const payload: any = { updated_at: now };
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.slug !== undefined) payload.slug = data.slug.trim().toLowerCase();
    if (data.description !== undefined) payload.description = data.description;

    const { data: updated, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
    if (error || !updated) {
      return { success: false, error: error?.message || 'Failed to update category' };
    }
    return { success: true, category: updated as CategoryRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating category' };
  }
}

export async function deleteCategory(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting category' };
  }
}

// ==============================================================================
// LEADS CRM CRUD
// ==============================================================================

export interface LeadRecord {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service: string;
  budget?: string | null;
  timeline?: string | null;
  message: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getLeadsList(options?: {
  search?: string;
  status?: string;
  limit?: number;
  page?: number;
}): Promise<{ leads: LeadRecord[]; total: number }> {
  try {
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%,company.ilike.%${options.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const limit = options?.limit || 20;
    const page = options?.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      return { leads: [], total: 0 };
    }
    return { leads: (data || []) as LeadRecord[], total: count || 0 };
  } catch {
    return { leads: [], total: 0 };
  }
}

export async function updateLeadStatus(
  id: number,
  status: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const payload: any = { status, updated_at: now };
    if (notes !== undefined) payload.notes = notes;

    const { error } = await supabase.from('leads').update(payload).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating lead' };
  }
}

export async function deleteLead(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting lead' };
  }
}

// ==============================================================================
// MEDIA ASSETS CRUD
// ==============================================================================

export interface MediaRecord {
  id: number;
  alt: string;
  caption?: string | null;
  filename: string;
  mime_type?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getMediaList(): Promise<MediaRecord[]> {
  try {
    const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as MediaRecord[];
  } catch {
    return [];
  }
}

export async function createMediaRecord(data: {
  alt: string;
  caption?: string;
  filename: string;
  mime_type?: string;
  filesize?: number;
  width?: number;
  height?: number;
  url: string;
}): Promise<{ success: boolean; media?: MediaRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const insertPayload = {
      alt: data.alt,
      caption: data.caption || '',
      filename: data.filename,
      mime_type: data.mime_type || 'image/webp',
      filesize: data.filesize || 0,
      width: data.width || 800,
      height: data.height || 600,
      url: data.url,
      created_at: now,
      updated_at: now,
    };

    const { data: created, error } = await supabase.from('media').insert([insertPayload]).select().single();
    if (error || !created) return { success: false, error: error?.message || 'Failed to create media record' };
    return { success: true, media: created as MediaRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating media record' };
  }
}

export async function deleteMediaRecord(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('media').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting media' };
  }
}
