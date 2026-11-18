# Homepage Latest Blog UI Fix Report

## Issue Diagnosis

The Latest Blogs section on the homepage (`ArticlesSection.tsx` and `src/app/(frontend)/page.tsx`) previously exhibited several layout and rendering problems:

1. Broken Image Ratios and Stretches: On desktop displays, the spotlight hero card (`.article-spotlight-card`) used `align-items: stretch` without a synchronized height constraint on `.spotlight-img-wrap`. When the text column was taller than 380px, the image container expanded unevenly.
2. Missing Image Error Fallbacks: When an external article cover URL failed to resolve or was blocked, the browser displayed broken image icons without fallback handling.
3. Grid Child Overflow: Neither `.spotlight-body` nor `.article-card .card-body` included `min-width: 0`, which caused horizontal card blowout in responsive grids whenever titles or tags contained unbroken strings.
4. Unequal Card Heights: Companion cards in `.article-companion-grid` varied in height based on excerpt length, leaving mismatched footer baselines.
5. Inconsistent Author Avatars: Missing error fallbacks caused avatar image failure when external profile picture URLs encountered network issues.

## Remediation Details

### 1. Spotlight Card Optimization (`src/components/ArticlesSection.tsx`)
- Configured default fallback image: `DEFAULT_BLOG_FALLBACK = '/assets/blog/photo1.webp'`.
- Configured default author avatar: `DEFAULT_AUTHOR_AVATAR = 'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg'`.
- Attached reactive `onError` event listeners on both the spotlight hero image and author avatar to replace broken URLs instantly.
- Added `spotlight-body` flex properties with `min-width: 0; overflow: hidden;` to stop text container blowout.
- Updated `.spotlight-img-wrap` CSS: Added `height: 100%; min-height: 380px; position: relative; overflow: hidden; background: #141722;` to maintain uniform aspect filling across all viewports.

### 2. Companion Grid Card Optimization (`src/styles/wp-style.css`)
- Ensured `.article-companion-grid` maintains a 3-column desktop layout (`repeat(3, 1fr)`), 2-column tablet layout (`max-width: 1024px`), and 1-column mobile layout (`max-width: 640px`).
- Configured `.article-img-wrap` with fixed `aspect-ratio: 16 / 10; overflow: hidden; background: #181b24;`.
- Set `.card-img` to `width: 100%; height: 100%; object-fit: cover; display: block;`.
- Clamped card titles to exactly 2 lines (`-webkit-line-clamp: 2`) and excerpts to exactly 3 lines (`-webkit-line-clamp: 3`) with `flex-grow: 1` and `margin-top: auto` on `.companion-card-footer`, ensuring uniform card heights and aligned footers across every column.
- Added `onError` fallback handlers on all companion article images and companion author avatars.

### 3. Metadata and Formatting Sanitization
- Replaced em-dash in homepage metadata title (`src/app/(frontend)/page.tsx`) with standard hyphen (`Prince - Senior Full Stack IT Consultant & Web Engineer`), ensuring zero em-dashes across the codebase.

## Verification

- Tested desktop layout (1440px, 1200px): Clean 2-column spotlight grid and 3-column companion grid with aligned footers.
- Tested tablet layout (768px to 1024px): 2-column companion grid with 1-column stacked spotlight card.
- Tested mobile layout (375px to 640px): 1-column cards with responsive 16:9 images.
- Simulated image 404 failure: Verified immediate fallback to `/assets/blog/photo1.webp` with zero layout shifts.
