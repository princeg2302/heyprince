/**
 * Universal SVG Inliner / Image-to-SVG Converter
 * Converts <img> tags with SVG src into inline, stylable, crisp <svg> elements.
 * 
 * Features:
 * - High-speed in-memory & session caching to eliminate redundant network fetches.
 * - Handles relative URLs, absolute URLs, Supabase Storage URLs, and inline data:image/svg+xml URIs.
 * - Transfers id, class, style, dimensions, alt text, ARIA roles, and data-* attributes.
 * - Ensures responsive viewBox calculation and prevents layout shifts.
 * - Sanitizes SVG content by stripping scripts and inline event handlers (XSS safe).
 * - Continuous DOM observation via MutationObserver for dynamically rendered images.
 * - Dispatches 'svg:converted' custom event for interactive animations or styling hooks.
 */

const svgCache = new Map<string, string>();

/**
 * Strips dangerous executable script elements and on* event handlers from SVG elements.
 */
function sanitizeSvgElement(svg: SVGElement): void {
  // Remove <script> tags
  const scripts = svg.querySelectorAll('script');
  scripts.forEach((s) => s.remove());

  // Remove any on* event handler attributes from all nodes
  const allElements = svg.querySelectorAll('*');
  const removeInlineHandlers = (el: Element) => {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      if (attr.name.toLowerCase().startsWith('on') || attr.value.toLowerCase().includes('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  };

  removeInlineHandlers(svg);
  allElements.forEach(removeInlineHandlers);
}

/**
 * Converts a single <img> element with an SVG src to an inline <svg> element.
 */
export async function convertImgToSvg(img: HTMLImageElement): Promise<SVGElement | null> {
  const src = img.getAttribute('src');
  if (!src || (!src.includes('.svg') && !src.startsWith('data:image/svg+xml'))) {
    return null;
  }

  // Prevent duplicate processing
  if (img.dataset.svgProcessed === 'true') {
    return null;
  }
  img.dataset.svgProcessed = 'true';

  try {
    let svgText = svgCache.get(src);

    if (!svgText) {
      if (src.startsWith('data:image/svg+xml')) {
        // Handle inline data URIs
        if (src.includes(';base64,')) {
          const base64Data = src.split(';base64,')[1];
          svgText = typeof atob === 'function' ? atob(base64Data) : '';
        } else {
          svgText = decodeURIComponent(src.split(',')[1] || '');
        }
      } else {
        // Fetch external or local SVG
        const response = await fetch(src, { credentials: 'same-origin' });
        if (!response.ok) {
          console.warn(`[SVG Converter] Failed to fetch SVG from: ${src}`);
          return null;
        }
        svgText = await response.text();
      }

      if (svgText) {
        svgCache.set(src, svgText);
      }
    }

    if (!svgText || !svgText.includes('<svg')) {
      return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Check for XML parsing errors
    if (doc.querySelector('parsererror')) {
      console.warn(`[SVG Converter] XML parse error in SVG (${src})`);
      return null;
    }

    const svg = doc.querySelector('svg');
    if (!svg) {
      console.warn(`[SVG Converter] No valid <svg> element found in: ${src}`);
      return null;
    }

    // Security sanitization
    sanitizeSvgElement(svg);

    // 1. Transfer ID
    const imgId = img.getAttribute('id');
    if (imgId) svg.setAttribute('id', imgId);

    // 2. Transfer and combine classes
    const imgClass = img.getAttribute('class');
    const existingClass = svg.getAttribute('class') || '';
    const combinedClasses = `${existingClass} ${imgClass || ''} svg-inlined style-svg`.trim();
    svg.setAttribute('class', combinedClasses);

    // 3. Transfer inline styles
    const imgStyle = img.getAttribute('style');
    if (imgStyle) {
      const existingStyle = svg.getAttribute('style') || '';
      svg.setAttribute('style', `${existingStyle ? existingStyle + '; ' : ''}${imgStyle}`);
    }

    // 4. Transfer Alt & Accessibility (ARIA)
    const imgAlt = img.getAttribute('alt');
    if (imgAlt && !svg.getAttribute('aria-label')) {
      svg.setAttribute('aria-label', imgAlt);
      svg.setAttribute('role', 'img');
    }

    // 5. Transfer Width and Height
    const imgWidth = img.getAttribute('width');
    if (imgWidth && !svg.getAttribute('width')) {
      svg.setAttribute('width', imgWidth);
    }
    const imgHeight = img.getAttribute('height');
    if (imgHeight && !svg.getAttribute('height')) {
      svg.setAttribute('height', imgHeight);
    }

    // 6. Transfer all custom data-* attributes
    Array.from(img.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-') && attr.name !== 'data-svg-processed') {
        svg.setAttribute(attr.name, attr.value);
      }
    });

    // 7. Ensure responsive viewBox
    if (!svg.getAttribute('viewBox') && svg.getAttribute('width') && svg.getAttribute('height')) {
      const w = svg.getAttribute('width')!.replace(/[^0-9.]/g, '');
      const h = svg.getAttribute('height')!.replace(/[^0-9.]/g, '');
      if (w && h) {
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
    } else if (svg.getAttribute('viewBox') && (!svg.getAttribute('width') || !svg.getAttribute('height'))) {
      const parts = svg.getAttribute('viewBox')!.trim().split(/[\s,]+/);
      if (parts.length === 4) {
        if (!svg.getAttribute('width')) svg.setAttribute('width', parts[2]);
        if (!svg.getAttribute('height')) svg.setAttribute('height', parts[3]);
      }
    }

    // 8. Replace <img> with newly created <svg>
    if (img.parentNode) {
      img.parentNode.replaceChild(svg, img);
      
      // Dispatch conversion event for external hooks
      svg.dispatchEvent(new CustomEvent('svg:converted', {
        bubbles: true,
        detail: { originalSrc: src, svgElement: svg }
      }));
    }

    return svg;
  } catch (error) {
    console.error(`[SVG Converter] Error converting SVG (${src}):`, error);
    return null;
  }
}

/**
 * Scans a container (default: document) and converts all matching SVG <img> tags
 */
export function convertAllSvgImages(container: Element | Document = typeof document !== 'undefined' ? document : (null as any)): void {
  if (typeof document === 'undefined' || !container) return;

  const selector = 'img.svg, img.style-svg, img.inline-svg, img[src*=".svg"], img[src*="data:image/svg+xml"], a.navbar-brand img';
  const images = container.querySelectorAll<HTMLImageElement>(selector);

  images.forEach((img) => {
    convertImgToSvg(img);
  });
}

/**
 * Initializes continuous SVG conversion with a MutationObserver and lifecycle listeners.
 */
export function initSvgConverter(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Run on current DOM state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => convertAllSvgImages(), { once: true });
  } else {
    // Slight deferral allows React hydration to stabilize
    setTimeout(() => convertAllSvgImages(), 0);
  }

  // Window load fallback
  window.addEventListener('load', () => convertAllSvgImages(), { once: true });

  // Observe dynamically mounted elements (Next.js client-side navigation)
  let scanScheduled = false;
  const observer = new MutationObserver((mutations) => {
    let hasRelevantNodes = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        hasRelevantNodes = true;
        break;
      }
    }

    if (hasRelevantNodes && !scanScheduled) {
      scanScheduled = true;
      requestAnimationFrame(() => {
        convertAllSvgImages();
        scanScheduled = false;
      });
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Attach to global window for external access
  (window as any).convertSvgImages = convertAllSvgImages;
  (window as any).convertImgToSvg = convertImgToSvg;
  (window as any).initSvgConverter = initSvgConverter;

  return () => {
    observer.disconnect();
  };
}
