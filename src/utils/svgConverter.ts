/**
 * Universal SVG Inliner / Image-to-SVG Converter
 * Converts <img> tags with SVG src into inline <svg> elements.
 */

const svgCache = new Map<string, string>();

/**
 * Converts a single <img> element containing an SVG path to an inline <svg>
 */
export async function convertImgToSvg(img: HTMLImageElement): Promise<SVGElement | null> {
  const src = img.getAttribute('src');
  if (!src || !src.includes('.svg')) {
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
      const response = await fetch(src);
      if (!response.ok) {
        console.warn(`[SVG Converter] Failed to fetch SVG from: ${src}`);
        return null;
      }
      svgText = await response.text();
      svgCache.set(src, svgText);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) {
      console.warn(`[SVG Converter] No valid <svg> found in: ${src}`);
      return null;
    }

    // Transfer attributes from <img> to <svg>
    const imgId = img.getAttribute('id');
    if (imgId) svg.setAttribute('id', imgId);

    const imgClass = img.getAttribute('class');
    if (imgClass) {
      const existingClass = svg.getAttribute('class') || '';
      const combined = `${existingClass} ${imgClass} svg-inlined`.trim();
      svg.setAttribute('class', combined);
    } else {
      svg.classList.add('svg-inlined');
    }

    const imgStyle = img.getAttribute('style');
    if (imgStyle) {
      const existingStyle = svg.getAttribute('style') || '';
      svg.setAttribute('style', `${existingStyle}; ${imgStyle}`);
    }

    const imgAlt = img.getAttribute('alt');
    if (imgAlt && !svg.getAttribute('aria-label')) {
      svg.setAttribute('aria-label', imgAlt);
      svg.setAttribute('role', 'img');
    }

    const imgWidth = img.getAttribute('width');
    if (imgWidth && !svg.getAttribute('width')) {
      svg.setAttribute('width', imgWidth);
    }

    const imgHeight = img.getAttribute('height');
    if (imgHeight && !svg.getAttribute('height')) {
      svg.setAttribute('height', imgHeight);
    }

    // Copy data-* attributes
    Array.from(img.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-') && attr.name !== 'data-svg-processed') {
        svg.setAttribute(attr.name, attr.value);
      }
    });

    // Ensure responsive viewBox and dimensions
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

    // Replace <img> with <svg>
    if (img.parentNode) {
      img.parentNode.replaceChild(svg, img);
    }

    return svg;
  } catch (error) {
    console.error(`[SVG Converter] Error converting SVG (${src}):`, error);
    return null;
  }
}

/**
 * Scans the container (default: document) and converts all SVG <img> tags
 */
export function convertAllSvgImages(container: HTMLElement | Document = document): void {
  // Matches <img class="svg">, <img class="style-svg">, or any <img> ending with .svg or containing .svg
  const selector = 'img.svg, img.style-svg, img.inline-svg, img[src*=".svg"], a.navbar-brand img';
  const images = container.querySelectorAll<HTMLImageElement>(selector);

  images.forEach((img) => {
    convertImgToSvg(img);
  });
}

/**
 * Initializes continuous SVG conversion with a MutationObserver
 */
export function initSvgConverter(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Initial conversion
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => convertAllSvgImages());
  } else {
    convertAllSvgImages();
  }

  // Observe dynamically added images
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      convertAllSvgImages();
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Attach to window for global developer access
  (window as unknown as { convertSvgImages: typeof convertAllSvgImages }).convertSvgImages = convertAllSvgImages;

  return () => observer.disconnect();
}
