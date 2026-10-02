import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { memoriesList } from '../data/siteContent';

export const CapturedMemories: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const pinWrap = pinWrapRef.current;
    const track = trackRef.current;
    if (!section || !pinWrap || !track) return;

    const ctx = gsap.context(() => {
      // Calculate total horizontal travel needed so the last item is fully revealed
      const getScrollAmount = () => {
        if (!track) return 0;
        return -(track.scrollWidth - window.innerWidth + 120);
      };

      const getScrollDistance = () => {
        if (!track) return 1200;
        return Math.max(Math.abs(getScrollAmount()) * 1.05, 1000);
      };

      // Pin the inner wrapper while section provides the scroll space
      gsap.to(track, {
        x: getScrollAmount,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: pinWrap,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // Subtle organic floating parallax on speed classes
      gsap.to('.img-wrapper.slower', {
        y: -14,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: true,
        },
      });

      gsap.to('.img-wrapper.slower-down', {
        y: 16,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: true,
        },
      });

      gsap.to('.img-wrapper.faster', {
        y: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: true,
        },
      });
    }, sectionRef);

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };

    const initialTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);

    window.addEventListener('resize', debouncedRefresh);

    return () => {
      clearTimeout(initialTimer);
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
              <span className="text-red word">
                <span>P</span>
                <span>R</span>
                <span style={{ marginRight: '-10px' }}>👁️</span>
                <span>👁️</span>
                <span>F</span>
              </span>
              <br /> I Go Outside
            </h2>
            <p>
              Work is important, but life matters too. I step out to reset my mind, explore new places, and come back with fresh ideas.
            </p>
          </div>
        </div>
        <div className="external">
          <div className="horizontal-scroll-wrapper" ref={trackRef}>
            {memoriesList.map((item, idx) => (
              <div className={`img-wrapper ${item.speedClass}`} key={idx}>
                <a href={item.image} target="_blank" rel="noopener noreferrer">
                  <img
                    src={item.image}
                    alt={`Prince outdoor travel and photography memory #${idx + 1}`}
                    decoding="async"
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
