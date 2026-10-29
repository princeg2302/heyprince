/**
 * Universal SVG Inliner / Image-to-SVG Converter (Vanilla JS)
 * Converts <img> tags with .svg sources into inline <svg> elements.
 * 
 * HeyPrince Studio - https://heyprince.in
 */
(function (window, document) {
  'use strict';

  var svgCache = {};

  function sanitizeSvg(svg) {
    var scripts = svg.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
      scripts[i].parentNode.removeChild(scripts[i]);
    }
    var all = svg.querySelectorAll('*');
    function cleanAttrs(el) {
      for (var a = el.attributes.length - 1; a >= 0; a--) {
        var attr = el.attributes[a];
        if (attr.name.toLowerCase().indexOf('on') === 0 || attr.value.toLowerCase().indexOf('javascript:') !== -1) {
          el.removeAttribute(attr.name);
        }
      }
    }
    cleanAttrs(svg);
    for (var j = 0; j < all.length; j++) {
      cleanAttrs(all[j]);
    }
  }

  function convertImg(img) {
    var src = img.getAttribute('src');
    if (!src || (src.indexOf('.svg') === -1 && src.indexOf('data:image/svg+xml') === -1)) {
      return;
    }

    if (img.getAttribute('data-svg-processed') === 'true') {
      return;
    }
    img.setAttribute('data-svg-processed', 'true');

    function applySvg(svgText) {
      if (!svgText || svgText.indexOf('<svg') === -1) return;

      var parser = new DOMParser();
      var doc = parser.parseFromString(svgText, 'image/svg+xml');
      if (doc.querySelector('parsererror')) return;

      var svg = doc.querySelector('svg');
      if (!svg) return;

      sanitizeSvg(svg);

      // Copy attributes
      var imgId = img.getAttribute('id');
      if (imgId) svg.setAttribute('id', imgId);

      var imgClass = img.getAttribute('class') || '';
      var existingClass = svg.getAttribute('class') || '';
      svg.setAttribute('class', (existingClass + ' ' + imgClass + ' svg-inlined style-svg').trim());

      var imgStyle = img.getAttribute('style');
      if (imgStyle) {
        var existingStyle = svg.getAttribute('style') || '';
        svg.setAttribute('style', (existingStyle ? existingStyle + '; ' : '') + imgStyle);
      }

      var imgAlt = img.getAttribute('alt');
      if (imgAlt && !svg.getAttribute('aria-label')) {
        svg.setAttribute('aria-label', imgAlt);
        svg.setAttribute('role', 'img');
      }

      var imgWidth = img.getAttribute('width');
      if (imgWidth && !svg.getAttribute('width')) {
        svg.setAttribute('width', imgWidth);
      }
      var imgHeight = img.getAttribute('height');
      if (imgHeight && !svg.getAttribute('height')) {
        svg.setAttribute('height', imgHeight);
      }

      for (var i = 0; i < img.attributes.length; i++) {
        var attr = img.attributes[i];
        if (attr.name.indexOf('data-') === 0 && attr.name !== 'data-svg-processed') {
          svg.setAttribute(attr.name, attr.value);
        }
      }

      // Responsive viewBox handling
      if (!svg.getAttribute('viewBox') && svg.getAttribute('width') && svg.getAttribute('height')) {
        var w = svg.getAttribute('width').replace(/[^0-9.]/g, '');
        var h = svg.getAttribute('height').replace(/[^0-9.]/g, '');
        if (w && h) svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      }

      if (img.parentNode) {
        img.parentNode.replaceChild(svg, img);
        try {
          var evt = new CustomEvent('svg:converted', {
            bubbles: true,
            detail: { originalSrc: src, svgElement: svg }
          });
          svg.dispatchEvent(evt);
        } catch (e) {}
      }
    }

    if (svgCache[src]) {
      applySvg(svgCache[src]);
      return;
    }

    if (src.indexOf('data:image/svg+xml') === 0) {
      var raw = '';
      if (src.indexOf(';base64,') !== -1) {
        raw = atob(src.split(';base64,')[1]);
      } else {
        raw = decodeURIComponent(src.split(',')[1] || '');
      }
      svgCache[src] = raw;
      applySvg(raw);
      return;
    }

    fetch(src, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (text) {
        svgCache[src] = text;
        applySvg(text);
      })
      .catch(function (err) {
        console.warn('[svg-converter] Failed to convert: ' + src, err);
      });
  }

  function convertAll(container) {
    var root = container || document;
    if (!root || !root.querySelectorAll) return;

    var selector = 'img.svg, img.style-svg, img.inline-svg, img[src*=".svg"], img[src*="data:image/svg+xml"], a.navbar-brand img';
    var images = root.querySelectorAll(selector);
    for (var i = 0; i < images.length; i++) {
      convertImg(images[i]);
    }
  }

  function init() {
    convertAll(document);

    if (typeof MutationObserver !== 'undefined' && document.body) {
      var scheduled = false;
      var observer = new MutationObserver(function () {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(function () {
            convertAll(document);
            scheduled = false;
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('load', function () {
    convertAll(document);
  }, { once: true });

  window.convertSvgImages = convertAll;
  window.convertImgToSvg = convertImg;
  window.initSvgConverter = init;

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
