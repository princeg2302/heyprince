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
        return -(track.scrollWidth - window.innerWidth + 140);
      };

      const getScrollDistance = () => {
        if (!track) return 2000;
        return Math.max(track.scrollWidth - window.innerWidth + 400, 2000);
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
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // Subtle organic floating parallax on speed classes
      gsap.to('.img-wrapper.slower', {
        y: -35,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: 1.2,
        },
      });

      gsap.to('.img-wrapper.slower-down', {
        y: 40,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: 1.2,
        },
      });

      gsap.to('.img-wrapper.faster', {
        y: 28,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: 1,
        },
      });
    }, sectionRef);

    // Refresh ScrollTrigger calculations after initial layout and when images settle
    const refreshScroll = () => {
      ScrollTrigger.refresh();
    };
    const t1 = setTimeout(refreshScroll, 150);
    const t2 = setTimeout(refreshScroll, 600);
    const t3 = setTimeout(refreshScroll, 1200);

    window.addEventListener('load', refreshScroll);
    window.addEventListener('resize', refreshScroll);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('load', refreshScroll);
      window.removeEventListener('resize', refreshScroll);
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
                    loading="lazy"
                    decoding="async"
                    onLoad={() => ScrollTrigger.refresh()}
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
