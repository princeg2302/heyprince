'use client';

import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa6';
import { getSmoothScroll } from '../utils/smoothScroll';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setVisible(scrollY > 380);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(checkScroll);
        ticking = true;
      }
    };

    // Check with Lenis if available
    const lenis = getSmoothScroll();
    const handleLenisScroll = (e: any) => {
      if (typeof e.scroll === 'number') {
        setVisible(e.scroll > 380);
      }
    };

    if (lenis) {
      lenis.on('scroll', handleLenisScroll);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    checkScroll();

    return () => {
      if (lenis) {
        lenis.off('scroll', handleLenisScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const lenis = getSmoothScroll();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <button
      type="button"
      className={`back-to-top-btn ${visible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top of page"
      title="Back to top"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <span className="back-to-top-inner">
        <FaArrowUp size={18} />
      </span>
      <span className="back-to-top-label">TOP</span>
    </button>
  );
};

export default BackToTop;
