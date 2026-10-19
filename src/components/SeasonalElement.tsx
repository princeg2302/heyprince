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
    accentColor?: string;
    glowColor?: string;
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
  const [isLocating, setIsLocating] = useState(false);
  const [isExact, setIsExact] = useState(false);
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
      }
    } catch (err) {
      console.warn('[SeasonalElement] Fetch error:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const requestExactLocation = useCallback((isManualClick: boolean = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (isManualClick) {
        alert('Geolocation is not supported by your browser.');
      }
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        let exactCity = '';
        try {
          const revRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
            { signal: AbortSignal.timeout(3500) }
          );
          if (revRes.ok) {
            const rev = await revRes.json();
            const place = rev.locality || rev.city || rev.principalSubdivision;
            if (place) {
              exactCity = rev.countryName ? `${place}, ${rev.countryName}` : place;
            }
          }
        } catch (revErr) {
          console.warn('[SeasonalElement] Client reverse geocode fallback:', revErr);
        }

        const exactLoc: UserGeoCoords = {
          lat,
          lon,
          city: exactCity || undefined,
        };

        try {
          localStorage.setItem('hp_exact_location', JSON.stringify(exactLoc));
          sessionStorage.setItem('hp_user_geo', JSON.stringify(exactLoc));
        } catch {}

        setIsExact(true);
        setIsLocating(false);
        fetchSeasonal(exactLoc);
      },
      (err) => {
        setIsLocating(false);
        console.log('[SeasonalElement] Geolocation request dismissed or unavailable:', err.message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [fetchSeasonal]);

  useEffect(() => {
    // 1. Check if user dismissed capsule in current session
    try {
      if (sessionStorage.getItem('hp_season_dismissed') === '1') {
        setIsDismissed(true);
        return;
      }
    } catch {}

    // 2. Check for previously saved exact GPS location
    let savedExactLoc: UserGeoCoords | null = null;
    try {
      const stored = localStorage.getItem('hp_exact_location') || sessionStorage.getItem('hp_user_geo');
      if (stored) {
        savedExactLoc = JSON.parse(stored);
      }
    } catch {}

    if (savedExactLoc && typeof savedExactLoc.lat === 'number' && typeof savedExactLoc.lon === 'number') {
      setIsExact(true);
      fetchSeasonal(savedExactLoc);
    } else {
      // Fetch initial data (from Vercel Geo headers in production or default)
      fetchSeasonal();
    }

    // 3. Proactively request device GPS location so exact locality is displayed
    requestExactLocation(false);
  }, [fetchSeasonal, requestExactLocation]);

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

  const handleCapsuleClick = () => {
    requestExactLocation(true);
  };

  const accentColor = data.weather?.accentColor || data.season?.accentColor || '#38bdf8';
  const glowColor = data.weather?.glowColor || data.season?.glowColor || 'rgba(56, 189, 248, 0.2)';
  const primaryIcon = data.weather?.conditionIcon || '🌤️';

  // Defensive clean-up: Ensure NO duplicate icon/sun or season names ever appear in the text
  let cleanedPillText = data.displayPillText || '';
  if (primaryIcon && cleanedPillText.startsWith(primaryIcon)) {
    cleanedPillText = cleanedPillText.slice(primaryIcon.length).trim();
  }
  // Strip any residual leading emoji character from the text span
  cleanedPillText = cleanedPillText.replace(/^[\u2600-\u26FF\u2700-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF\uFE0F]+\s*/, '').trim();
  // Strip any residual season label defensively (e.g. "• Autumn Harvest")
  cleanedPillText = cleanedPillText.replace(/\s*•\s*(?:Autumn|Winter|Spring|Summer|Monsoon)[^•]*$/i, '').trim();

  return (
    <div
      className={`seasonal-floating-capsule ${isHovered ? 'is-hovered' : ''}`}
      style={{
        border: `1px solid ${accentColor}40`,
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.45), 0 0 15px ${glowColor}`,
        cursor: 'pointer',
      }}
      onClick={handleCapsuleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${data.tooltipText} • ${isExact ? '📍 Exact location active' : 'Click to detect exact GPS location'}`}
      role="status"
      aria-live="polite"
    >
      {/* Exactly ONE leading icon (dynamic weather condition: sun, cloudy, rain, cold, fog) */}
      <span className="seasonal-pill-icon">
        {isLocating ? '📍' : primaryIcon}
      </span>

      {/* Clean text with temperature and location (ZERO season name) */}
      <span className="seasonal-pill-text">
        {isLocating ? 'Detecting exact location...' : cleanedPillText}
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
