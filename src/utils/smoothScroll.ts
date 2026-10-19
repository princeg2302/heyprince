import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

export const initSmoothScroll = (): Lenis | null => {
  if (typeof window === 'undefined') return null;
  if (lenisInstance) return lenisInstance;

  // Register GSAP ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth easeOutExpo curve
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.0,
    autoRaf: false,
  });

  lenisInstance = lenis;
  (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

  // Direct synchronization with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  tickerCallback = (time: number) => {
    lenis.raf(time * 1000);
  };

  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(500, 33);

  return lenis;
};

export const getSmoothScroll = (): Lenis | null => lenisInstance;

export const destroySmoothScroll = (): void => {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
};
