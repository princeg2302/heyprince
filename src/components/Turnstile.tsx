'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileScriptLoaded?: () => void;
  }
}

export const Turnstile: React.FC<TurnstileProps> = ({
  onSuccess,
  onError,
  onExpire,
  theme = 'dark',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Default to Cloudflare official testing sitekey (always passes) if not configured in .env
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.turnstile) {
      setIsScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.turnstile) return;

    try {
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => {
          onSuccess(token);
        },
        'error-callback': () => {
          onError?.();
        },
        'expired-callback': () => {
          onExpire?.();
        },
      });
    } catch (err) {
      console.warn('[Turnstile] Widget render issue:', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {}
      }
    };
  }, [isScriptLoaded, siteKey, theme, onSuccess, onError, onExpire]);

  return (
    <div
      className={`turnstile-wrapper ${className}`}
      style={{
        margin: '16px 0',
        minHeight: '65px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div ref={containerRef} />
    </div>
  );
};

export default Turnstile;
