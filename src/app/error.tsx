'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error securely
    console.error('App runtime error caught by Next.js boundary:', error);
  }, [error]);

  return (
    <section
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 20px',
        color: '#fff',
      }}
    >
      <div className="container" style={{ maxWidth: '640px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(212, 0, 39, 0.15)',
            border: '1px solid #d40027',
            color: '#d40027',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '20px',
          }}
        >
          ANOMALY DETECTED
        </span>
        <h1
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(42px, 8vw, 72px)',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}
        >
          SOMETHING WENT <span style={{ color: '#d40027' }}>OFF-GRID</span>
        </h1>
        <p
          style={{
            color: '#a0a0a8',
            fontSize: '17px',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          An unexpected glitch interrupted execution. Our self-healing systems are ready to reload the component state.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="portal-btn"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <span className="mr-right">Try Again</span>
            <span className="arrow">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="white" />
                <path
                  d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                  fill="#000"
                />
              </svg>
            </span>
          </button>

          <Link href="/" className="portal-btn">
            <span className="mr-right">Return Home</span>
            <span className="arrow">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="white" />
                <path
                  d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                  fill="#000"
                />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
