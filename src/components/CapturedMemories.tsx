'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { memoriesList } from '../data/siteContent';

export const CapturedMemories: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const pinWrap = pinWrapRef.current;
    const track = trackRef.current;
    if (!section || !pinWrap || !track) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Calculate total horizontal travel needed so items glide across smoothly
      const getScrollAmount = () => {
        if (!track) return 0;
        const maxScroll = track.scrollWidth - window.innerWidth;
        return maxScroll > 0 ? -maxScroll : 0;
      };

      // Fluid horizontal filmstrip scrub as user naturally scrolls past the section
      // Zero viewport pinning, zero scroll trap, zero hitching
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        track,
        {
          x: getScrollAmount,
          ease: 'none',
        },
        0
      );

      // Subtle organic floating parallax on speed classes
      tl.to(
        '.img-wrapper.slower',
        {
          y: -14,
          ease: 'none',
        },
        0
      );

      tl.to(
        '.img-wrapper.slower-down',
        {
          y: 16,
          ease: 'none',
        },
        0
      );

      tl.to(
        '.img-wrapper.faster',
        {
          y: 10,
          ease: 'none',
        },
        0
      );
    }, sectionRef);

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };

    window.addEventListener('resize', debouncedRefresh);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener('resize', debouncedRefresh);
      ctx.revert();
    };
  }, []);

  return (
    <section className="captured-memories" id="memories" ref={sectionRef}>
      <div className="captured-memories-pin-wrap" ref={pinWrapRef}>
        <div className="container">
          <div className="section-heading-group text-center">
            <h2>
              <span className="text-red word" suppressHydrationWarning>
                <span suppressHydrationWarning>P</span>
                <span suppressHydrationWarning>R</span>
                <span style={{ marginRight: '-10px' }} suppressHydrationWarning>👁️</span>
                <span suppressHydrationWarning>👁️</span>
                <span suppressHydrationWarning>F</span>
              </span>
              <br /> I Go Outside
            </h2>
            <p>
              Great code comes from a clear mind. Beyond the terminal and dual monitors, I explore architecture, urban landscapes, and culture to return with fresh perspectives and creative energy.
            </p>
          </div>
        </div>
        <div className="external">
          <div className="horizontal-scroll-wrapper" ref={trackRef}>
            {memoriesList.map((item, idx) => (
              <div className={`img-wrapper ${item.speedClass}`} key={idx}>
                <a
                  href={item.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View full resolution photography memory ${idx + 1}`}
                >
                  <img
                    src={item.image}
                    alt={`Prince outdoor travel and photography memory #${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="300"
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CapturedMemories;
