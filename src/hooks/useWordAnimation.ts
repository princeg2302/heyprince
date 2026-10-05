import { useEffect } from 'react';

export function useWordAnimation(dependency?: any) {
  useEffect(() => {
    let isCancelled = false;
    const intervals: ReturnType<typeof setInterval>[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const listeners: Array<{ el: HTMLElement; enter: () => void }> = [];

    // Delay word animation start until after React initial hydration is fully settled
    const initialDelay = setTimeout(() => {
      if (isCancelled) return;
      const wordBlocks = document.querySelectorAll('.word');

      wordBlocks.forEach((word) => {
        const spans = word.querySelectorAll('span');
        if (!spans.length) return;

        const animateSpans = () => {
          spans.forEach((span, idx) => {
            const t1 = setTimeout(() => {
              if (!isCancelled) span.classList.add('active');
            }, 750 * idx);
            timeouts.push(t1);

            const t2 = setTimeout(() => {
              if (!isCancelled) span.classList.remove('active');
            }, 750 * idx + 700);
            timeouts.push(t2);
          });
        };

        spans.forEach((span) => {
          const handleEnter = () => {
            span.classList.add('active');
            const th = setTimeout(() => {
              span.classList.remove('active');
            }, 1200);
            timeouts.push(th);
          };
          span.addEventListener('mouseenter', handleEnter);
          listeners.push({ el: span as HTMLElement, enter: handleEnter });
        });

        animateSpans();
        const iv = setInterval(animateSpans, Math.max(750 * spans.length, 3000));
        intervals.push(iv);
      });
    }, 1000);

    return () => {
      isCancelled = true;
      clearTimeout(initialDelay);
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
      listeners.forEach(({ el, enter }) => {
        el.removeEventListener('mouseenter', enter);
      });
      document.querySelectorAll('.word span.active').forEach((span) => {
        span.classList.remove('active');
      });
    };
  }, [dependency]);
}

export default useWordAnimation;

