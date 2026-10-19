import { NextRequest, NextResponse } from 'next/server';
import { getDailyNewsSettings } from '@/lib/daily-news/db';
import { getSeasonalPresentation } from '@/lib/seasonal/weather';

export const dynamic = 'force-dynamic';

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const trimmed = ip.trim();
  return (
    trimmed === '127.0.0.1' ||
    trimmed === '::1' ||
    trimmed === 'localhost' ||
    trimmed.startsWith('10.') ||
    trimmed.startsWith('192.168.') ||
    trimmed.startsWith('172.16.') ||
    trimmed.startsWith('172.17.') ||
    trimmed.startsWith('172.18.') ||
    trimmed.startsWith('172.19.') ||
    trimmed.startsWith('172.20.') ||
    trimmed.startsWith('172.21.') ||
    trimmed.startsWith('172.22.') ||
    trimmed.startsWith('172.23.') ||
    trimmed.startsWith('172.24.') ||
    trimmed.startsWith('172.25.') ||
    trimmed.startsWith('172.26.') ||
    trimmed.startsWith('172.27.') ||
    trimmed.startsWith('172.28.') ||
    trimmed.startsWith('172.29.') ||
    trimmed.startsWith('172.30.') ||
    trimmed.startsWith('172.31.')
  );
}

export async function GET(request: NextRequest) {
  try {
    const settings = await getDailyNewsSettings();
    const { searchParams } = new URL(request.url);

    // 1. Check client query parameters (?lat=...&lon=...&city=...)
    const qLat = searchParams.get('lat');
    const qLon = searchParams.get('lon');
    const qCity = searchParams.get('city');

    let latitude: number | undefined;
    let longitude: number | undefined;
    let city: string | undefined;

    if (qLat && qLon) {
      const pLat = parseFloat(qLat);
      const pLon = parseFloat(qLon);
      if (!isNaN(pLat) && !isNaN(pLon) && pLat >= -90 && pLat <= 90 && pLon >= -180 && pLon <= 180) {
        latitude = pLat;
        longitude = pLon;
      }
    }

    if (qCity && qCity.trim()) {
      try {
        city = decodeURIComponent(qCity.trim());
      } catch {
        city = qCity.trim();
      }
    }

    // 2. Check Vercel Geo headers (automatically provided in production on Vercel)
    if (latitude === undefined || longitude === undefined || !city) {
      const vLat = request.headers.get('x-vercel-ip-latitude');
      const vLon = request.headers.get('x-vercel-ip-longitude');
      const vCity = request.headers.get('x-vercel-ip-city');
      const vCountry = request.headers.get('x-vercel-ip-country');

      if (latitude === undefined && vLat && vLon) {
        const pLat = parseFloat(vLat);
        const pLon = parseFloat(vLon);
        if (!isNaN(pLat) && !isNaN(pLon)) {
          latitude = pLat;
          longitude = pLon;
        }
      }

      if (!city && vCity) {
        try {
          const decodedCity = decodeURIComponent(vCity);
          city = vCountry ? `${decodedCity}, ${vCountry}` : decodedCity;
        } catch {
          city = vCountry ? `${vCity}, ${vCountry}` : vCity;
        }
      }
    }

    // 3. If running in a custom proxy/server where Vercel headers are missing, check client IP
    if (latitude === undefined || longitude === undefined || !city) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip');

      if (clientIp && !isPrivateIp(clientIp)) {
        try {
          const geoRes = await fetch(`https://freeipapi.com/api/json/${clientIp}`, {
            headers: { 'User-Agent': 'HeyPrince-Location-Resolver/1.0' },
            signal: AbortSignal.timeout(2000),
          });
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.latitude && geo.longitude) {
              latitude = Number(geo.latitude);
              longitude = Number(geo.longitude);
              if (!city && geo.cityName) {
                city = `${geo.cityName}, ${geo.countryName || geo.countryCode || 'India'}`;
              }
            }
          }
        } catch {}
      }
    }

    // 4. Reverse geocode exact coordinates if city is still missing or if precise GPS was passed without a city
    if (latitude !== undefined && longitude !== undefined && (!city || city === 'Delhi, India')) {
      try {
        const revRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          {
            headers: { 'User-Agent': 'HeyPrince-Reverse-Geocode/1.0' },
            signal: AbortSignal.timeout(2500),
          }
        );
        if (revRes.ok) {
          const rev = await revRes.json();
          const place = rev.locality || rev.city || rev.principalSubdivision;
          if (place) {
            city = rev.countryName ? `${place}, ${rev.countryName}` : place;
          }
        }
      } catch {}
    }

    // 4. Default fallback if location cannot be detected
    const finalCity = city || settings.weatherCity || 'Yamunanagar, India';
    const finalLat = latitude ?? settings.weatherLatitude ?? 30.1;
    const finalLon = longitude ?? settings.weatherLongitude ?? 77.28;

    const presentation = await getSeasonalPresentation({
      enabled: settings.isSeasonalEnabled ?? true,
      mode: (settings.seasonalMode as any) || 'auto',
      manualTheme: settings.seasonalManualTheme,
      city: finalCity,
      latitude: finalLat,
      longitude: finalLon,
    });

    return NextResponse.json(presentation, {
      headers: {
        // Private cache for client browser so shared CDN does not cross-serve visitor locations
        'Cache-Control': 'private, max-age=180, stale-while-revalidate=360',
      },
    });
  } catch (err: any) {
    console.warn('[Seasonal API] Error returning seasonal presentation:', err);
    return NextResponse.json({
      enabled: true,
      mode: 'auto',
      city: 'Yamunanagar, India',
      displayPillText: 'Yamunanagar',
      tooltipText: 'Live Weather in Yamunanagar, India',
      source: 'fallback',
    });
  }
}
