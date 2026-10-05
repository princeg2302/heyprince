'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        background: '#0d0d0d',
        color: '#ffffff',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-anton, sans-serif)',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          color: '#ffffff',
        }}
      >
        Something went <span style={{ color: '#ff2d55' }}>wrong</span>
      </h1>
      <p
        style={{
          maxWidth: '520px',
          fontSize: '1.05rem',
          lineHeight: '1.6',
          color: 'rgba(255, 255, 255, 0.75)',
          marginBottom: '2rem',
        }}
      >
        An unexpected error occurred while rendering this page. You can try refreshing the component or return to the home page.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => reset()}
          className="portal-btn"
          style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
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
          <span className="mr-right">Back to Home</span>
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
  );
}

