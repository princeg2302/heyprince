# Single Blog Banner Image Gap Analysis & Fix

## Executive Summary

On the single blog page (`/insights/[slug]/` and `SingleBlogPage.tsx`), visitors previously observed an unwanted empty gap (dark void) underneath the hero banner image before the 3-column article layout began. This report documents the mathematical and CSS root cause, the structural fix applied, and verification across desktop and mobile form factors.

## Mathematical and CSS Root Cause Diagnosis

Inspection of `src/styles/wp-style.css` lines 6114 to 6133 revealed the exact cause:

```css
/* Previous problematic styles */
.blog-featured-img-wrap {
  margin: 36px 0 50px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f1118;
}

.blog-featured-img {
  width: 100%;
  height: 100%;
  max-height: 540px;          /* ROOT CAUSE #1 */
  aspect-ratio: 16 / 9;
  object-fit: cover !important;
  object-position: center;
  display: block;
}
```

### The Conflict:
1. Container Aspect Ratio: On standard desktop screens, the container width is 1200px. With `aspect-ratio: 16 / 9;`, the computed height of `.blog-featured-img-wrap` is:
   1200px * (9 / 16) = 675px.
2. Hardcoded Image Restriction: The inner image `.blog-featured-img` had `max-height: 540px;`.
3. The Internal Gap: The image stopped expanding at 540px, while the parent container extended to 675px. The remaining 135px (675px - 540px) was rendered as empty background space (`background: #0f1118;`), appearing as an artificial dark bar directly under the image.
4. Cumulative External Margin: The wrapper had `margin: 36px 0 50px;`. Added to the 135px internal void, visitors experienced an unwanted 185px vertical gap before reaching the table of contents and body text.
5. Inline Style Conflicts: The `<img>` tag in `SingleBlogPage.tsx` included conflicting inline `style={{ objectFit: 'cover', width: '100%', height: '100%', aspectRatio: '16 / 9' }}` which interfered with CSS cascade rules.

## Remediation Applied

### 1. CSS Normalization (`src/styles/wp-style.css`)
- Removed the conflicting `max-height: 540px;` restriction from `.blog-featured-img`.
- Synchronized the wrapper and image so the image fills 100% of the container:
```css
.blog-featured-img-wrap {
  margin: 32px 0 36px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f1118;
  position: relative;
  display: block;
}

.blog-featured-img {
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover !important;
  object-position: center;
  display: block;
  margin: 0;
  padding: 0;
}
```

### 2. Component Refinement (`src/components/SingleBlogPage.tsx`)
- Removed conflicting inline `aspectRatio` styles that created letterboxing.
- Added default blog image fallback: `DEFAULT_BLOG_IMAGE = '/assets/blog/photo1.webp'`.
- Implemented `onError` fallback listener so broken or missing banner images immediately switch to the verified fallback asset without layout shifts or blank voids:
```tsx
<div className="blog-featured-img-wrap">
  <img
    src={article.image || DEFAULT_BLOG_IMAGE}
    alt={`${article.title} - Article by Prince`}
    className="blog-featured-img"
    fetchPriority="high"
    decoding="async"
    width="1200"
    height="675"
    onError={(e) => {
      const target = e.currentTarget as HTMLImageElement;
      if (target.src !== DEFAULT_BLOG_IMAGE && !target.src.endsWith(DEFAULT_BLOG_IMAGE)) {
        target.src = DEFAULT_BLOG_IMAGE;
      }
    }}
  />
</div>
```

## Verification Across Breakpoints

- Large Desktop (>1200px): Banner image fills the complete 16:9 container (1200x675) with zero empty space. Clean 36px margin connects to the sticky sidebar and content grid.
- Laptop / Tablet (768px - 1199px): Image scales smoothly maintaining 16:9 ratio with zero letterboxing or dark bars.
- Mobile (<768px): Wrapper shrinks responsively; image stays crisp and centered with `object-fit: cover`.
- Negative Margin Hacks: Avoided entirely. The layout is solved structurally through CSS aspect ratio alignment.
