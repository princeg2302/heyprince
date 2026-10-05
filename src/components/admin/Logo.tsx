import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '4px 0' }}>
      <img
        src="/heyprince-logo.svg"
        alt="Admin"
        width={34}
        height={34}
        style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255, 51, 102, 0.4))' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.04em', color: '#ffffff', textTransform: 'uppercase' }}>
          Admin
        </span>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', color: '#ff3366', textTransform: 'uppercase', marginTop: '-2px' }}>
          Portal
        </span>
      </div>
    </div>
  );
};

export default Logo;
