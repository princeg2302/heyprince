import React from 'react';

export default function Loading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          borderTopColor: '#ff2d55',
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

