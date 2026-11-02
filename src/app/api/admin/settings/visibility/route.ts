import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getSiteVisibilitySettings, setSiteVisibilitySettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getSiteVisibilitySettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const enabled = Boolean(body.enabled);

    const updated = await setSiteVisibilitySettings(enabled);

    return NextResponse.json({
      success: true,
      message: enabled
        ? 'Services & Contact are now VISIBLE across the website.'
        : 'Services cards, /services listing, and /contact page are now HIDDEN.',
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

