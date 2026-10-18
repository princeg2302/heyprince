'use client';

import React, { useEffect, useState } from 'react';

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

export const SeasonalElement: React.FC = () => {
  const [data, setData] = useState<SeasonalData | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      if (sessionStorage.getItem('hp_season_dismissed') === '1') {
        setIsDismissed(true);
        return;
      }
    } catch {}

    let isMounted = true;
    fetch('/api/seasonal/current/')
      .then((res) => res.json())
      .then((resData: SeasonalData) => {
        if (isMounted && resData && resData.enabled) {
          setData(resData);
        }
      })
      .catch((err) => {
        console.warn('[SeasonalElement] Fetch error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  return (
    <div
      className="seasonal-floating-capsule"
      style={{
        position: 'fixed',
        bottom: '22px',
        left: '24px',
        zIndex: 998,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px 6px 12px',
        borderRadius: '999px',
        background: 'rgba(15, 17, 23, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${accentColor}40`,
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.45), 0 0 15px ${glowColor}`,
        fontSize: '0.74rem',
        fontWeight: 600,
        color: '#ffffff',
        cursor: 'default',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={data.tooltipText}
      role="status"
      aria-live="polite"
    >
      <span
        style={{
          display: 'inline-block',
          fontSize: '0.85rem',
          lineHeight: 1,
        }}
      >
        {data.weather?.conditionIcon || data.season?.emoji || '✨'}
      </span>

      <span
        style={{
          color: '#f8fafc',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {data.displayPillText}
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

