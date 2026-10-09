'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminError Boundary Caught]:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#07070a',
        color: '#ffffff',
        fontFamily: "'Arboria-Book', 'Arboria', sans-serif",
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(255, 51, 102, 0.1)',
          border: '1px solid rgba(255, 51, 102, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          color: '#ff3366',
          fontSize: '24px',
        }}
      >
        !
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>
        Administration Portal Error
      </h2>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: '440px', fontSize: '0.88rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
        An interface error occurred while rendering the administration dashboard. Click reload to refresh the state or return to the dashboard.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '10px 20px',
            background: '#ff3366',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.88rem',
          }}
        >
          Reload Dashboard
        </button>
        <Link
          href="/admin/"
          style={{
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '0.88rem',
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

