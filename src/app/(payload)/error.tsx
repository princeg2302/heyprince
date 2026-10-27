'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

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
          fontWeight: 700,
        }}
      >
        !
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>
        Administration Portal Error
      </h2>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: '480px', fontSize: '0.88rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
        An interface or server communication error occurred while rendering this dashboard view.
      </p>

      {error?.message && (
        <div
          style={{
            maxWidth: '520px',
            background: 'rgba(255, 51, 102, 0.08)',
            border: '1px solid rgba(255, 51, 102, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '20px',
            color: '#ff99aa',
            fontSize: '0.82rem',
            textAlign: 'left',
            fontFamily: 'monospace',
            wordBreak: 'break-word',
          }}
        >
          {error.message}
          {error.digest && (
            <div style={{ fontSize: '0.74rem', color: '#888899', marginTop: '4px' }}>
              Digest ID: {error.digest}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
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
            transition: 'opacity 0.2s',
          }}
        >
          Reload View
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
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '10px 14px',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          {showDetails ? 'Hide Diagnostics' : 'Show Diagnostics'}
        </button>
      </div>

      {showDetails && (
        <div
          style={{
            maxWidth: '640px',
            width: '100%',
            background: '#0d0d14',
            border: '1px solid #1c1c2b',
            borderRadius: '8px',
            padding: '12px 16px',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#9ca3af',
            overflowX: 'auto',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <div><strong>Stack:</strong> {error.stack || 'No client stack trace available'}</div>
          {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
        </div>
      )}
    </div>
  );
}
