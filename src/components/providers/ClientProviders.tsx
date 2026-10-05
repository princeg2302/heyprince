'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { initSmoothScroll, getSmoothScroll, destroySmoothScroll } from '../../utils/smoothScroll';
import { initSecurityShield } from '../../utils/security';
import { initSvgConverter } from '../../utils/svgConverter';
import { useWordAnimation } from '../../hooks/useWordAnimation';
import { CustomCursor } from '../CustomCursor';
import { Preloader } from '../Preloader';
import { BackToTop } from '../BackToTop';
import { CookieConsent } from '../CookieConsent';

interface ClientProvidersProps {
  children: ReactNode;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  const pathname = usePathname();
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Initialize Lenis smooth scroll with GSAP ticker sync
  useEffect(() => {
    initSmoothScroll();
    initSecurityShield();
    const cleanupSvg = initSvgConverter();

    return () => {
      destroySmoothScroll();
      if (typeof cleanupSvg === 'function') cleanupSvg();
    };
  }, []);

  // Word letter cycle animation on every route change
  useWordAnimation(pathname);

  // Instant scroll reset & hash scroll handling on pathname changes
  useEffect(() => {
    const lenis = getSmoothScroll();
    const hash = (typeof window !== 'undefined' ? window.location.hash : '')
      .replace(/^#\/?/, '')
      .replace(/\/+$/, '');

    if (hash && hash !== 'home' && pathname === '/') {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          if (lenis) {
            lenis.scrollTo(el, { duration: 1.2, offset: -20 });
          } else {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [pathname]);

  // High-performance GPU-accelerated scroll progress tracking for Home page
  useEffect(() => {
    if (pathname !== '/') return;

    const lenis = getSmoothScroll();
    if (lenis) {
      const handleLenisScroll = (e: any) => {
        if (progressBarRef.current && typeof e.progress === 'number') {
          progressBarRef.current.style.transform = `scaleX(${e.progress})`;
        }
      };
      lenis.on('scroll', handleLenisScroll);
      return () => {
        lenis.off('scroll', handleLenisScroll);
      };
    }

    let ticking = false;
    const updateProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? window.scrollY / total : 0;
      const clamped = Math.min(1, Math.max(0, progress));
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${clamped})`;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [pathname]);

  return (
    <>
      <CustomCursor />
      <Preloader />
      {pathname === '/' && (
        <div
          ref={progressBarRef}
          className="reading-progress-bar"
          aria-hidden="true"
        />
      )}
      {children}
      <BackToTop />
      <CookieConsent />
    </>
  );
};

export default ClientProviders;

