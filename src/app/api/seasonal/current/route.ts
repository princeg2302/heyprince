import { NextResponse } from 'next/server';
import { getDailyNewsSettings } from '@/lib/daily-news/db';
import { getSeasonalPresentation } from '@/lib/seasonal/weather';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 minutes cache header

export async function GET() {
  try {
    const settings = await getDailyNewsSettings();

    const presentation = await getSeasonalPresentation({
      enabled: settings.isSeasonalEnabled,
      mode: settings.seasonalMode as any,
      manualTheme: settings.seasonalManualTheme,
      city: settings.weatherCity,
      latitude: settings.weatherLatitude,
      longitude: settings.weatherLongitude,
    });

    return NextResponse.json(presentation, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (err: any) {
    console.warn('[Seasonal API] Error returning seasonal presentation:', err);
    return NextResponse.json({
      enabled: false,
      mode: 'disabled',
      city: 'Delhi, India',
      displayPillText: '',
      tooltipText: '',
      source: 'fallback',
    });
  }
}

