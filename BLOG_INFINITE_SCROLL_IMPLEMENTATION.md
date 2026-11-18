# Blog Listing Infinite Scroll Implementation

## Executive Summary

The blog listing at `/insights/` (and `/blog/` redirect) has been upgraded from a static all-at-once render to a high-performance, cursor-based infinite scroll system. Initial page visits load exactly 9 published posts via SSR for full SEO crawlability. When the visitor scrolls near the bottom, the next 9 posts load automatically without requiring button clicks.

## Key Technical Requirements Fulfilled

1. Initial Load: Exactly 9 published blog posts rendered on first view.
2. Auto-load on Scroll: `IntersectionObserver` triggers the next 9 posts with a 250px bottom margin.
3. Cursor-Based Pagination: Orders posts by `published_at DESC, id DESC` to eliminate offset drift.
4. Zero Duplicates: Client-side deduplication maintains a `Set` of known slugs.
5. Loading Indicator: Dark-mode pulsing status badge displayed while fetching.
6. End-of-List Message: Shows a verified catch-up confirmation when all posts are loaded.
7. Error and Retry Handling: Displays error message with an immediate "Retry Loading" action.
8. Filter Compatibility: Preserves category filter pills, keyword search, date period selector, and sort order.

## Implementation Architecture

### 1. Database Query Engine (`src/lib/cms.ts`)
Function: `getPostsPaginated(options: PaginatedPostsOptions)`:
- Accepts `limit` (default 9), `cursorPublishedAt`, `cursorSlug`, `category`, `period`, `search`, and `sort`.
- Queries Supabase `posts` table with `.eq('status', 'published')`.
- Applies cursor condition: `.lt('published_at', cursorPublishedAt)` for newest sort, `.gt('published_at', cursorPublishedAt)` for oldest sort.
- Fetches `limit + 1` records. If `records.length > limit`, `hasMore` is true, and `nextCursor` is populated with the last post's timestamp and slug.
- Falls back to static dataset slicing if database is unreachable.

### 2. Public API Route (`src/app/api/insights/feed/route.ts`)
- URL: `/api/insights/feed`
- Method: `GET`
- Parameters: `limit`, `cursorPublishedAt`, `cursorSlug`, `category`, `period`, `q`, `sort`
- Returns:
  ```json
  {
    "success": true,
    "posts": [ ... ],
    "nextCursor": { "publishedAt": "2026-11-09T04:06:35.414Z", "slug": "sovereign-ai-..." },
    "hasMore": true,
    "totalCount": 36
  }
  ```
- Caching: `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`.

### 3. Client Component (`src/components/InsightsListingClient.tsx`)
- Maintains reactive state: `posts`, `isLoading`, `hasMore`, `nextCursor`, and `errorMessage`.
- Concurrency Lock: `isLoadingRef` prevents simultaneous duplicate network dispatches.
- Filter Resets: When the visitor changes category or enters a search query, the list resets and retrieves page 1 for the new criteria.
- Sentinel Element: `<div ref={sentinelRef} />` placed at bottom of article grid.
- Observer Lifecycle: Disconnects automatically when `hasMore` becomes false or component unmounts.
- Image Resilience: Each card features `onError` image fallback to `/assets/blog/photo1.webp`.

### 4. Server-Side Page (`src/app/(frontend)/insights/page.tsx`)
- Server queries all published posts for complete Google JSON-LD structured data (`BlogPosting` schema) maintaining 100% SEO visibility.
- Passes `posts.slice(0, 9)` and `totalCount={posts.length}` to `InsightsListingClient`.

## Test Results

Ran test suite: `npx tsx src/scripts/test-blog-pagination-suite.ts`
- Total Published Articles Found: 36
- Initial Batch Retrieval (Page 1): PASS (Exactly 9 posts returned, hasMore: true)
- Cursor Batch Retrieval (Page 2): PASS (Next 9 posts returned with cursor)
- Zero-Duplicate Verification: PASS (0 overlapping slugs between batches)
- Category Filtering: PASS (Filters accurately by topic)
- Empty Search State: PASS (Clean empty array, hasMore: false, nextCursor: null)
- Image and Fallback Integrity: PASS (All retrieved posts contain valid images)
- Overall Result: 12 Passed, 0 Failed.
