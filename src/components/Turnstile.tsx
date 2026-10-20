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

export interface TurnstileHandle {
  reset: () => void;
  getResponse: () => string | undefined;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
          'refresh-expired'?: 'auto' | 'manual' | 'never';
          'refresh-timeout'?: 'auto' | 'manual' | 'never';
          retry?: 'auto' | 'never';
          'retry-interval'?: number;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

export const Turnstile = React.forwardRef<TurnstileHandle, TurnstileProps>(
  (
    {
      onSuccess,
      onError,
      onExpire,
      theme = 'dark',
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [domainError, setDomainError] = useState<string | null>(null);

    // Keep latest callbacks in refs so re-renders in parent form don't cause widget re-render
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
      onSuccessRef.current = onSuccess;
      onErrorRef.current = onError;
      onExpireRef.current = onExpire;
    });

    React.useImperativeHandle(ref, () => ({
      reset: () => {
        if (typeof window !== 'undefined' && window.turnstile) {
          try {
            if (widgetIdRef.current) {
              window.turnstile.reset(widgetIdRef.current);
            } else {
              window.turnstile.reset();
            }
          } catch {}
        }
      },
      getResponse: () => {
        if (typeof window !== 'undefined' && window.turnstile) {
          try {
            return widgetIdRef.current
              ? window.turnstile.getResponse(widgetIdRef.current)
              : window.turnstile.getResponse();
          } catch {}
        }
        return undefined;
      },
    }));

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  // Detect when turnstile script is available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.turnstile) {
      setIsScriptLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.turnstile) {
        setIsScriptLoaded(true);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Render Turnstile widget once when script & container are ready
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.turnstile) return;

    // Avoid duplicate render
    if (widgetIdRef.current) return;

      try {
        const widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          'refresh-expired': 'auto',
          'refresh-timeout': 'auto',
          retry: 'auto',
          'retry-interval': 1500,
          callback: (token: string) => {
            setDomainError(null);
            onSuccessRef.current(token);
          },
          'error-callback': (errorCode?: string) => {
            // Cloudflare Turnstile error 110200 = Domain not authorized (usually on localhost)
            const isLocal =
              typeof window !== 'undefined' &&
              (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1');

            if (isLocal && siteKey !== '1x00000000000000000000AA') {
              setDomainError(
                'Localhost Domain Notice: To test with this sitekey on localhost, add "localhost" to your Allowed Hostnames in the Cloudflare Turnstile dashboard.'
              );
            }

            onErrorRef.current?.();
          },
          'expired-callback': () => {
            onExpireRef.current?.();
            // Automatically reset and request fresh token when expired
            if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
              try {
                window.turnstile.reset(widgetIdRef.current);
              } catch {}
            }
          },
        });

        widgetIdRef.current = widgetId;
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
  }, [isScriptLoaded, siteKey, theme]);

  return (
    <div
      className={`turnstile-wrapper ${className}`}
      style={{
        margin: '16px 0',
        minHeight: '65px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div ref={containerRef} />

      {domainError && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '6px',
            color: '#f59e0b',
            fontSize: '11px',
            textAlign: 'center',
            maxWidth: '380px',
            lineHeight: 1.4,
          }}
        >
          {domainError}
          <div style={{ marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                onSuccessRef.current('XXXX.DUMMY.TOKEN.XXXX');
                setDomainError(null);
              }}
              style={{
                background: '#2d2d42',
                border: 'none',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Simulate Verified Check (Dev Mode)
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

Turnstile.displayName = 'Turnstile';

export default Turnstile;
