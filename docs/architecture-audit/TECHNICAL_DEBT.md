# Technical Debt & Codebase Maintenance Audit

## 1. Monolithic Files
* **`src/styles/wp-style.css` (11,324 lines)**: Contains legacy WordPress CSS merged with modern single blog 3-column styles and responsive overrides.
  * *Recommendation*: Split into modular CSS files (`blog-layout.css`, `header.css`, `legacy-wp.css`).
* **`src/lib/admin-db.ts` (1,451 lines)**: Handles password hashing, session signing, post CRUD, category CRUD, and service queries in a single file.
  * *Recommendation*: Break down into `src/lib/admin/auth.ts`, `src/lib/admin/posts.ts`, etc.

---

## 2. Legacy Payload CMS Residue
* Root configuration `payload.config.ts` and route group `(payload)` remain from an earlier Payload CMS setup. The application currently operates directly on Supabase PostgreSQL without requiring Payload server runtime.
  * *Recommendation*: Safely deprecate unreferenced `@payloadcms/*` dependencies in a future sprint.

---

## 3. Parallel AI Implementations
* With the creation of `heyprince-ai-backend`, AI generation code exists in both TypeScript (`src/lib/daily-news/`, `src/lib/chief-of-staff/`) and Python (`heyprince-ai-backend/app/`).
  * *Status*: Next.js is configured with zero-downtime fallback. Once VPS is verified, the legacy TypeScript LLM callers can be streamlined.
