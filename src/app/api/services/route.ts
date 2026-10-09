import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { servicesList, ServiceData } from '@/data/servicesData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muzbzrxwbanzsjvgtexp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_-_0Hj2xs4eK6DQ4CsKvmGw_QKyxgsnd';
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data: dbServices, error } = await supabase
      .from('services')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (!error && dbServices && dbServices.length > 0) {
      const mapped: ServiceData[] = dbServices.map((doc: any) => {
        const staticMatch = servicesList.find((s) => s.slug === doc.slug);
        return {
          id: doc.slug,
          slug: doc.slug,
          title: doc.title,
          shortTitle: doc.short_title || doc.title,
          tagline: doc.tagline || staticMatch?.tagline || '',
          category: doc.category_name || staticMatch?.category || 'Engineering & Consulting',
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

