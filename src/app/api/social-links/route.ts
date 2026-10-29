import { NextResponse } from 'next/server';
import { getAllSocialLinks } from '@/lib/social-links';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 60 seconds cache

export async function GET() {
  try {
    const all = await getAllSocialLinks();
    const active = all.filter((item) => item.is_active && item.url);
    const map: Record<string, string> = {};
    for (const item of active) {
      map[item.platform] = item.url;
    }
    return NextResponse.json({
      success: true,
      socialLinks: map,
      items: active,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch social links' }, { status: 500 });
  }
}

