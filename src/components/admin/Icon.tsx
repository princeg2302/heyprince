import React from 'react';

export const Icon: React.FC = () => {
  return (
    <img
      src="/favicon.svg"
      alt="Admin"
      width={24}
      height={24}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Icon;
