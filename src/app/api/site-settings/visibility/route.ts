import { NextResponse } from 'next/server';
import { getSiteVisibilitySettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getSiteVisibilitySettings();
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { services_and_contact_enabled: true, error: err?.message },
      { status: 500 }
    );
  }
}

