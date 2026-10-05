'use client';

import React, { useEffect, useState, useRef } from 'react';

export interface InlineSvgProps extends React.HTMLAttributes<HTMLSpanElement> {
  src: string;
  className?: string;
  alt?: string;
}

const svgCache = new Map<string, string>();

export const InlineSvg: React.FC<InlineSvgProps> = ({ src, className = '', alt, ...props }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!src) return;

    if (svgCache.has(src)) {
      setSvgHtml(svgCache.get(src)!);
      return;
    }

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((raw) => {
        if (!isMounted.current) return;
        svgCache.set(src, raw);
        setSvgHtml(raw);
      })
      .catch((err) => {
        console.warn(`[InlineSvg] Failed to load SVG from ${src}:`, err);
      });

    return () => {
      isMounted.current = false;
    };
  }, [src]);

  if (!svgHtml) {
    return <img src={src} className={className} alt={alt || ''} />;
  }

  return (
    <span
      className={`inline-svg-wrapper ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
      aria-label={alt}
      role={alt ? 'img' : undefined}
      {...props}
    />
  );
};

export default InlineSvg;
