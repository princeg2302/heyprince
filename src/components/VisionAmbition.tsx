import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const VisionAmbition: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const e = '.vision-graphic';
      const t = gsap.timeline({
        scrollTrigger: {
          trigger: e,
          start: 'top bottom-=200',
          end: '+=450',
          scrub: true,
        },
      });

      t.fromTo('.about__circle', { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0)
        .fromTo('.about__circles', { rotate: -160 }, { rotate: 0, duration: 3 }, 0)
        .fromTo('.about__circle--circle1', { yPercent: 0 }, { yPercent: -90, duration: 3 }, 0)
        .fromTo('.about__circle--circle2', { yPercent: 0, xPercent: 0 }, { yPercent: 90, xPercent: 87.5, duration: 3 }, 0)
        .fromTo('.about__circle--circle3', { yPercent: 0, xPercent: 0 }, { yPercent: 90, xPercent: -87.5, duration: 3 }, 0)
        .fromTo('.about__line', { opacity: 0 }, { opacity: 1, ease: 'power1.inOut', duration: 3 }, 0)
        .fromTo('.about__line', { scaleX: 0 }, { scaleX: 1, ease: 'power2.inOut', duration: 3 }, 0)
        .fromTo('.about__circle span', { opacity: 0 }, { opacity: 1, delay: 0.75, ease: 'power2.inOut', duration: 2.25 }, 0)
        .to('.about-content .text-subheading', { opacity: 0, ease: 'power2.inOut', duration: 2.25 }, '<')
        .to('.about-content .section-heading-group', { opacity: 1, ease: 'power2.inOut', duration: 2.25, delay: 1.5 }, '<');
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="vision-ambition" id="about" ref={sectionRef}>
      <div className="vision-content-wrapper">
        <div className="container">
          <h2>
            I’m not here to sound perfect — I’m here to be real. I build websites, solve problems, and keep learning every single day. Some days it’s clean code... some days it’s just coffee and hope 😄
          </h2>
          <div className="vision-graphic">
            <div className="about-circles-wrap">
              <div className="about__circles">
                <div className="about__circle about__circle--circle1">
                  <div className="magnet-text">
                    <span>
                      Gadget <br /> Hoarder
                    </span>
                  </div>
                </div>
                <div className="about__circle about__circle--circle2">
                  <div className="magnet-text">
                    <span>
                      Code <br /> Whisperer
                    </span>
                  </div>
                </div>
                <div className="about__circle about__circle--circle3">
                  <div className="magnet-text">
                    <span>
                      AI <br /> Dreamer
                    </span>
                  </div>
                </div>
                <div className="about__line about__line-1"></div>
                <div className="about__line about__line-2"></div>
                <div className="about__line about__line-3"></div>
              </div>
            </div>

            <div className="about-content">
              {/* BEFORE SCROLL: text-subheading (fades out on scroll) */}
              <div className="ms-auto text-subheading">
                <p>
                  From designing modern websites to fixing bugs and improving performance — I enjoy turning ideas into working digital products. I believe in simple design, fast speed, and smart solutions that actually help people and businesses grow online.
                </p>
                <p>
                  I don’t just create websites that “look good” — I build experiences that feel smooth, load fast, and work perfectly on every device. Whether it’s a business website, a landing page, or a custom WordPress setup, my goal is always the same: clean UI, strong functionality, and real results.
                </p>
              </div>

              {/* AFTER SCROLL: section-heading-group (fades in on scroll) */}
              <div className="section-heading-group text-start">
                <h2 style={{ fontWeight: 700 }}>
                  If (awake) → &#123; <br />
                  code(); &#125; else &#123; <br />
                  coffee(); &#125;
                </h2>
                <p>
                  From designing modern websites to fixing bugs and improving performance — I enjoy turning ideas into working digital products. I believe in simple design, fast speed, and smart solutions that actually help people and businesses grow online.
                </p>
                <a className="portal-btn" href="#contact">
                  <span className="mr-right">Curious About Me?</span>
                  <span className="arrow">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="20" fill="white" />
                      <path
                        d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                        fill="#000"
                      />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionAmbition;

