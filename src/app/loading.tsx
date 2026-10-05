import React from 'react';

export default function Loading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0b0f',
      }}
      aria-label="Loading page..."
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(212, 0, 39, 0.2)',
          borderTopColor: '#d40027',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
