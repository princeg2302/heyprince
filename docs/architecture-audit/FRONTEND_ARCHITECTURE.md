# Frontend Architecture & Route Map

## 1. Verified Route Inventory (35 Routes)

### Public Client Routes (`src/app/(frontend)`)
* `/`: Main landing page, hero interactive arcade, journey roadmap, unfiltered narrative.
* `/insights/`: Technical blog directory with search filters and category tags.
* `/insights/[slug]/`: High-conversion single blog article with sticky 3-column layout.
* `/services/`: Architectural consulting services catalog.
* `/services/[slug]/`: Individual service offering deep dive with roadmap & pricing.
* `/about/`: Narrative bio and engineering career journey ("Unfiltered Me").
* `/contact/`: Contact hub with interactive budget/scope selector and HMAC captcha.
* `/gaming-zone/`: Dedicated interactive browser gaming portal.

### Admin Dashboard Routes (`src/app/(payload)/admin`)
* `/admin/`: Executive dashboard KPI overview, telemetry cards, and quick actions.
* `/admin/login/`: Secure admin login page with rate limiting and MFA challenge.
* `/admin/approvals/`: Unified approval queue for scheduled news and Chief of Staff drafts.
* `/admin/chief-of-staff/`: Multi-agent control panel with manual run controls.
* `/admin/outreach/`: B2B lead intelligence, Overpass scraper, and proposal previewer.
* `/admin/posts/`: Full-featured article management table with bulk delete & LinkedIn sharing.
* `/admin/posts/new/`: Interactive long-form article editor with live section preview.
* `/admin/posts/[id]/`: Post inspection view with publishing details and author byline.
* `/admin/posts/[id]/edit/`: Post updating interface.
* `/admin/news-automation/`: Daily AI News RSS ingest manager and topic queue.
* `/admin/services/`: Service catalog editor and pricing manager.
* `/admin/users/`: Admin user permission manager.
* `/admin/categories/`: Blog taxonomy and category CRUD manager.
* `/admin/leads/`: Client lead inquiry dashboard with status updates.
* `/admin/media/`: Supabase media vault explorer and asset uploader.
* `/admin/settings/`: Profile settings, MFA activation, and social links manager.

---

## 2. Reusable Component Hierarchy
* **`AdminLayout.tsx`**: Universal authenticated shell rendering the collapsible navigation sidebar, top breadcrumb bar, Supabase status pill, and the holographic `JarvisAssistant`.
* **`SingleBlogPage.tsx`**: 3-column responsive article layout (Left: sticky Table of Contents & reading progress meter; Center: formatted article text, image figures, pull quotes, pro tips, and consultation CTA; Right: sticky author byline, verified partner badge, dynamic social links, and category exploration).
* **`DiscussionSection.tsx`**: Threaded community commenting component supporting SSR HTML pre-rendering, nested reply trees, optimistic like toggles, and bot honeypot fields.
* **`CustomCaptcha.tsx`**: Zero-third-party challenge slider rendering server-issued mathematical challenges without relying on Google reCAPTCHA or Cloudflare Turnstile.
