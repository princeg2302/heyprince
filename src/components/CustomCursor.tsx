'use client';

import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import MouseFollower from 'mouse-follower';

export const CustomCursor: React.FC = () => {
  useEffect(() => {
    let cursor: MouseFollower | null = null;
    try {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        MouseFollower.registerGSAP(gsap);
        cursor = new MouseFollower({
          speed: 0.6,
          skewing: 1,
        });
      }
    } catch {
      // Fallback gracefully on mobile/touch or unsupported environments
    }

    return () => {
      cursor?.destroy();
    };
  }, []);

  return null;
};

export default CustomCursor;

