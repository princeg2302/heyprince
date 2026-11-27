# Supabase public-schema lockdown plan

## Current audit (read-only; 2026-11-27)

The live Supabase project `muzbzrxwbanzsjvgtexp` has 78 tables in the exposed `public` schema:
- 23 tables have RLS disabled.
- The remaining 55 have RLS enabled but no RLS policies.
- The Supabase security advisor reports broad `anon` / `authenticated` privileges on public tables and 8 `SECURITY DEFINER` functions callable by API roles.
- Role inspection confirms `anon` and `authenticated` do not bypass RLS; `service_role` and `postgres` do bypass RLS.
- The project currently has no recorded migrations in Supabase migration history. Do not infer that SQL files already in the repository have been applied.

## Application access model

The PR has moved the app's Supabase table reads/writes to server-only paths:
- `src/lib/admin-db.ts` now requires `SUPABASE_SECRET_KEY` (or the legacy server-only `SUPABASE_SERVICE_ROLE_KEY`) and imports `server-only`.
- `src/lib/cms.ts`, `src/app/api/author/route.ts`, `src/app/api/services/route.ts`, and `src/lib/captcha/db.ts` use that server-side client.
- The unused/test todos page was moved off the public-key client too.
- CAPTCHA and all CMS/admin CRUD execute server-side. Blog discussion/social/settings and automation database work use the server-side `DATABASE_URI` pool.

Vercel Production and Preview were checked without decrypting values: `SUPABASE_SECRET_KEY` is present as a sensitive variable in both environments.

## Prepared migration

`supabase/migrations/20261127_public_schema_server_only_lockdown.sql` is prepared on this PR branch but **has not been applied**.

It is designed to:
1. Enable RLS on all current tables in `public`.
2. Revoke schema, table, sequence, and function access from `PUBLIC`, `anon`, and `authenticated`.
3. Preserve server access for `service_role` and the `postgres` connection.
4. Remove permissive default privileges for future tables, sequences, and functions created by `postgres` or `supabase_admin`, while retaining server-role grants.
5. Leave per-user RLS policies absent intentionally: this design makes public-schema data access server-only. If browser-side Supabase data access is added in future, it must use narrow, table-specific policies instead.

**Do not run this migration until a Preview deployment and the application smoke tests below are green.** It intentionally disables direct Supabase PostgREST table/function access for anonymous and authenticated clients. This is a meaningful security improvement, but it will break any untracked external consumer using the public key to query the public schema.

## Required verification before applying

- Confirm Preview build is READY on the same PR head.
- Verify public pages: home, published services, author profile, insights list/detail, sitemap.
- Verify contact form CAPTCHA flow and server-side lead creation.
- Verify admin login, MFA, dashboard, and read/write operations for users, posts, services, categories, leads, and media.
- Verify company / Chief of Staff dashboards and internal API routes backed by `DATABASE_URI`.
- Verify server-side Supabase secret client can read/write required tables.
- Verify direct `anon` and `authenticated` PostgREST table/function calls are denied after the migration.
- Re-run Supabase security advisor and check that no public-schema table or function remains available to the public API roles.
- Keep production cron endpoints and outbound integrations untriggered during verification.

## Separate open prerequisite

The inbound WhatsApp webhook requires `WHATSAPP_WEBHOOK_SECRET` in Vercel and the matching `X-HeyPrince-Webhook-Secret` custom header in Whapi.Cloud. On 2026-11-27, Vercel metadata showed the variable is present for Production and Preview; its secret value was not decrypted or inspected, and the Whapi.Cloud header was not independently verified. Confirm the provider header matches the configured Vercel value before relying on inbound WhatsApp lead capture.

`AI_BACKEND_URL` and `AI_SERVICE_SECRET` were not present in the Vercel environment-variable inventory on 2026-11-27. Python backend delegation therefore remains inactive until the actual reachable backend URL and a matching shared secret are supplied and configured.
