'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

interface SeasonalData {
  enabled: boolean;
  mode: 'auto' | 'manual' | 'disabled';
  city: string;
  season?: {
    id: string;
    label: string;
    emoji: string;
    accentColor: string;
    glowColor: string;
    greeting: string;
  };
  weather?: {
    temperature: number;
    humidity: number;
    conditionText: string;
    conditionIcon: string;
  } | null;
  displayPillText: string;
  tooltipText: string;
  source: string;
}

interface UserGeoCoords {
  lat: number;
  lon: number;
  city?: string;
}

export const SeasonalElement: React.FC = () => {
  const [data, setData] = useState<SeasonalData | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchSeasonal = useCallback(async (coords?: UserGeoCoords) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      let url = '/api/seasonal/current/';
      if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
        const params = new URLSearchParams({
          lat: coords.lat.toString(),
          lon: coords.lon.toString(),
        });
        if (coords.city) {
          params.set('city', coords.city);
        }
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;
      const resData: SeasonalData = await res.json();

      if (resData && resData.enabled) {
        setData(resData);

        // Cache location in sessionStorage for instant subsequent navigations
        if (resData.city && !sessionStorage.getItem('hp_user_geo') && coords?.lat && coords?.lon) {
          try {
            sessionStorage.setItem(
              'hp_user_geo',
              JSON.stringify({ lat: coords.lat, lon: coords.lon, city: resData.city })
            );
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[SeasonalElement] Fetch error:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Check if user dismissed capsule in current session
    try {
      if (sessionStorage.getItem('hp_season_dismissed') === '1') {
        setIsDismissed(true);
        return;
      }
    } catch {}

    // 2. Check if we have cached coordinates from earlier in this session
    let cachedCoords: UserGeoCoords | null = null;
    try {
      const stored = sessionStorage.getItem('hp_user_geo');
      if (stored) {
        cachedCoords = JSON.parse(stored);
      }
    } catch {}

    if (cachedCoords) {
      fetchSeasonal(cachedCoords);
    } else {
      // Fetch initial data (will use Vercel Geo headers in production)
      fetchSeasonal().then(() => {
        // If in localhost / dev environment where Vercel Geo headers don't exist,
        // do a quick client-side IP lookup so local dev also shows real user location
        if (
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ) {
          fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
            .then((r) => r.json())
            .then((geo) => {
              if (geo.latitude && geo.longitude && geo.city) {
                const detectedLoc: UserGeoCoords = {
                  lat: Number(geo.latitude),
                  lon: Number(geo.longitude),
                  city: `${geo.city}, ${geo.country_name || 'India'}`,
                };
                try {
                  sessionStorage.setItem('hp_user_geo', JSON.stringify(detectedLoc));
                } catch {}
                fetchSeasonal(detectedLoc);
              }
            })
            .catch(() => {});
        }
      });
    }

    // 3. If user has already granted high-accuracy browser geolocation permission,
    // seamlessly upgrade to exact GPS coordinates without prompting
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.geolocation) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const gpsCoords: UserGeoCoords = {
                  lat: pos.coords.latitude,
                  lon: pos.coords.longitude,
                };
                fetchSeasonal(gpsCoords);
              },
              undefined,
              { timeout: 8000, maximumAge: 600000 }
            );
          }
        })
        .catch(() => {});
    }
  }, [fetchSeasonal]);

  if (!data || !data.enabled || isDismissed) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem('hp_season_dismissed', '1');
    } catch {}
  };

  const accentColor = data.season?.accentColor || '#38bdf8';
  const glowColor = data.season?.glowColor || 'rgba(56, 189, 248, 0.2)';
  const primaryIcon = data.weather?.conditionIcon || data.season?.emoji || '✨';

  // Defensive clean-up: Ensure NO duplicate icon/sun ever appears at the start of the text
  let cleanedPillText = data.displayPillText || '';
  if (primaryIcon && cleanedPillText.startsWith(primaryIcon)) {
    cleanedPillText = cleanedPillText.slice(primaryIcon.length).trim();
  }
  // Strip any residual leading emoji character from the text span
  cleanedPillText = cleanedPillText.replace(/^[\u2600-\u26FF\u2700-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF\uFE0F]+\s*/, '').trim();

  return (
    <div
      className={`seasonal-floating-capsule ${isHovered ? 'is-hovered' : ''}`}
      style={{
        border: `1px solid ${accentColor}40`,
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.45), 0 0 15px ${glowColor}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={data.tooltipText}
      role="status"
      aria-live="polite"
    >
      {/* Exactly ONE leading icon (weather condition or season emoji) */}
      <span className="seasonal-pill-icon">
        {primaryIcon}
      </span>

      {/* Clean text with temperature, location, and season label without repeated icon */}
      <span className="seasonal-pill-text">
        {cleanedPillText}
      </span>

      {isHovered && (
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss seasonal info"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '0.75rem',
            lineHeight: 1,
            marginLeft: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SeasonalElement;
