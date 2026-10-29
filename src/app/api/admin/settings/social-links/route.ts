import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getAllSocialLinks, updateMultipleSocialLinks } from '@/lib/social-links';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await getAllSocialLinks();
    return NextResponse.json({ success: true, links });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const links = body.links;

    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'Expected an array of social links' }, { status: 400 });
    }

    await updateMultipleSocialLinks(links);

    const updated = await getAllSocialLinks();
    return NextResponse.json({
      success: true,
      message: 'Social media links updated successfully!',
      links: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
