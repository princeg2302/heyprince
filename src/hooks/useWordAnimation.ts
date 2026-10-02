import { useEffect } from 'react';

export function useWordAnimation(dependency?: any) {
  useEffect(() => {
    const wordBlocks = document.querySelectorAll('.word');
    const intervals: ReturnType<typeof setInterval>[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    wordBlocks.forEach((word) => {
      const spans = word.querySelectorAll('span');
      if (!spans.length) return;

      const animateSpans = () => {
        spans.forEach((span, idx) => {
          const t1 = setTimeout(() => {
            span.classList.add('active');
          }, 750 * idx);
          timeouts.push(t1);

          const t2 = setTimeout(() => {
            span.classList.remove('active');
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
      });

      animateSpans();
      const iv = setInterval(animateSpans, Math.max(750 * spans.length, 3000));
      intervals.push(iv);
    });

    return () => {
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
    };
  }, [dependency]);
}

export default useWordAnimation;

