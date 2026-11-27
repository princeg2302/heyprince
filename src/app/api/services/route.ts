import { NextResponse } from 'next/server';
import { supabase } from '@/lib/admin-db';
import { servicesList, ServiceData } from '@/data/servicesData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [{ data: dbServices, error }, { data: dbCategories }] = await Promise.all([
      supabase
        .from('services')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('categories')
        .select('id, title, slug'),
    ]);

    const categoryMap = new Map<number, string>();
    (dbCategories || []).forEach((c: any) => categoryMap.set(c.id, c.title));

    if (!error && dbServices && dbServices.length > 0) {
      const mapped: ServiceData[] = dbServices.map((doc: any) => {
        const staticMatch = servicesList.find((s) => s.slug === doc.slug);
        const liveCategory = doc.category_id ? categoryMap.get(doc.category_id) : null;

        return {
          id: doc.slug,
          slug: doc.slug,
          title: doc.title,
          shortTitle: doc.short_title || doc.title,
          tagline: doc.tagline || staticMatch?.tagline || '',
          category: liveCategory || doc.category_name || staticMatch?.category || 'Engineering & Consulting',
          cardTheme: (doc.card_theme as any) || (doc.is_featured ? 'featured' : 'black'),
          isFeatured: Boolean(doc.is_featured),
          featuredBadge: doc.featured_badge || (doc.is_featured ? '★ FEATURED // AI AUTOMATIONS' : undefined),
          iconName: doc.icon_name || staticMatch?.iconName || 'FaBrain',
          heroDescription: doc.hero_description || doc.short_description || staticMatch?.heroDescription || '',
          overview: staticMatch?.overview || (doc.description ? [doc.description] : []),
          deliverables: staticMatch?.deliverables || [],
          techStack: staticMatch?.techStack || [],
          process: staticMatch?.process || [],
          highlights: staticMatch?.highlights || [],
          faqs: staticMatch?.faqs || [],
          metaTitle: doc.seo_title || `${doc.title} | HeyPrince`,
          metaDescription: doc.seo_description || doc.short_description || staticMatch?.metaDescription || '',
        };
      });

      return NextResponse.json(mapped, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      });
    }
  } catch (err) {
    console.warn('[/api/services] Error fetching dynamic services from Supabase:', err);
  }

  // Fallback to static servicesList
  return NextResponse.json(servicesList, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}

