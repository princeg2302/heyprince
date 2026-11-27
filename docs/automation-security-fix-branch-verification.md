# Automation and Security Fix Branch — Verification Notes

Branch: `fix/automation-security-reliability`

This branch contains code changes only. It has not been merged into `main`, deployed to production, or applied to the Supabase production database.

## Changes made

### Cron endpoint authentication
- Added a shared, fail-closed cron authentication helper.
- Removed trust in spoofable `x-vercel-cron`, User-Agent and query-string credentials.
- Applied the shared check to Daily News, Lead Scout, Chief of Staff and Company Workforce endpoints.
- Requires `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`.

**Deployment verification:** `CRON_SECRET` is now present in Vercel Production and the external cron Authorization header has already been configured. The cron endpoint code accepts `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`. Do not repeat this setup or put the secret in Git.

### Duplicate automation and scheduler behavior
- Supabase does not currently have the `pg_cron` extension installed; the database has no `cron.job` table. The configured schedules are therefore not being run by Supabase Postgres itself.

- Removed the autonomous-workforce heartbeat from the two admin dashboard GET endpoints. Dashboard polling is now read-only.
- The Chief of Staff sweep skips Alex Vance (the Company Workforce route owns the workforce cycle) and Lead Scout (which has its own dedicated cron).
- Python APScheduler is now disabled by default and requires both explicit opt-in flags. Its jobs use single-instance/coalescing behavior.
- The Chief of Staff route now returns HTTP 500 if one of its agent executions reports failure.

**Still outstanding:** Agent-specific cadence is not fully implemented. In particular, the configured four-hour Website Guardian cadence cannot be guaranteed by the current once-daily Vercel route. A durable scheduler/queue design is still required.

### Python backend request authentication
- TypeScript now signs `METHOD:path:millisecond_timestamp:body`, matching the Python verifier.
- Python now fails closed when `AI_SERVICE_SECRET` is missing rather than using a built-in development secret.
- Added Python standard-library unittest coverage for valid signatures, missing signatures, expired timestamps and missing secrets.
- Admin session verification now rejects unsigned legacy Base64 tokens, requires a configured signing secret (no hardcoded fallback), rejects sessions when the live admin record cannot be revalidated, and compares password hashes using a timing-safe comparison.

**Deployment prerequisite:** The Vercel project currently has no `AI_BACKEND_URL` or `AI_SERVICE_SECRET`, so the Python backend delegation path is not active in the inspected production configuration. Configure matching secrets on both services before enabling it. Python backend deployment/restart is separate from Vercel deployment.

### Database connection hardening
- Removed the implicit local `postgres:postgres@127.0.0.1` fallback when no database URL is configured.
- Remote PostgreSQL connections can verify the Supabase CA chain and hostname when `SUPABASE_DB_CA_CERT` is configured; the connection URL's SSL query parameters are removed when this CA is supplied.
- The first strict-verification preview test failed with `SELF_SIGNED_CERT_IN_CHAIN` because the project-specific Supabase CA was not configured in Vercel. To avoid breaking production connectivity, the existing compatibility fallback remains until the CA is supplied. This TLS hardening is therefore **not yet active**.

### Daily News stale-run reconciliation
- Added a database update that marks runs still in `running` for more than three minutes as failed before a new run starts.
- Removed the immediate forced retry from the cron route, avoiding a second expensive run after the first failure within the same 60-second function window.
- Failed run results now produce HTTP 500.

**Still outstanding:** Daily News still has a 60-second Vercel execution ceiling. The durable solution is to split collection, generation, media and publishing into resumable background steps/queue jobs. This branch does not claim to eliminate runtime timeouts.

### Honest task and proposal states
- Company tasks now remain in `review_ready` until an actual independent reviewer verifies them. Generated criteria are explicitly marked `verified: false`.
- Outreach, site-modification and financial proposals no longer get marked executed when their external side effects have not been implemented. They remain approved and return a clear unsupported-executor result.
- Existing historical rows were not rewritten.

## Critical Supabase security issue — intentionally not migrated here

Live read-only inspection confirmed:
- 23 public tables have RLS disabled.
- 55 public tables have RLS enabled but no policies.
- `anon` and `authenticated` have broad table privileges across 78 public tables.
- The `anon` role has SELECT/INSERT/UPDATE/DELETE privileges on `public.users` and `public.leads`, including SELECT on password hash, salt and reset-token columns in `public.users`.

A blanket revoke/RLS migration is deliberately not included yet. The current server-side CMS/admin implementation uses the publishable-key Supabase client from `src/lib/admin-db.ts`, including reads/writes for admin workflows. The inspected Vercel project also has no `SUPABASE_SERVICE_ROLE_KEY` (or equivalent server-only secret) configured. It also has no `SUPABASE_DB_CA_CERT`, so strict PostgreSQL TLS certificate verification remains pending. Applying a blanket restriction before migrating server-side access to a privileged, server-only client could break the admin CMS and public site. The next security phase must:
1. inventory every Supabase client use and public Data API dependency;
2. migrate privileged server-side operations to a server-only secret client;
3. explicitly define public read-only policies for published content/services and required public forms;
4. deny anonymous access to users, sessions, leads and internal automation tables;
5. run role-based tests and Supabase advisors before applying the migration.

No Supabase production data, policies, grants or schema were changed by this branch.

## Verification status

- Git branch created from `main`.
- Vercel preview deployments have been created automatically for intermediate commits; several were superseded/cancelled by newer commits.
- Latest code preview deployment is READY: `https://heyprince-n0ng92ij9-heyprince1.vercel.app` (commit `c1158a6461b0f4bf4a05b9ae5586199fb443319f`). Vercel reported successful Next.js compilation, TypeScript checks and static page generation, with no TLS-chain errors after making CA verification conditional on the supplied certificate.
- GitHub Actions run `45962206666` completed successfully.
- `nextjs-typecheck`: passed (`npx tsc --noEmit`).
- `python-auth-tests`: passed (4 tests covering valid signature, missing signature, expired timestamp and missing service secret).
- The first Python CI attempt had failed because the workflow omitted the existing `httpx` dependency; the workflow was corrected to install `requirements.txt`, and the subsequent run passed.
- No live cron endpoint was triggered, to avoid starting production automation.
- No live Python backend request was sent, because the backend URL/secret are not configured in Vercel.
- No production database mutations were made.

## Remaining verification before merge
- Vercel preview build is READY and GitHub Actions typecheck/Python auth tests pass.
- Review the preview build output for route/type errors.
- `CRON_SECRET` is present in Vercel Production and the external cron Authorization header is configured; no repeat setup is required.
- Add the project's Supabase root CA certificate as `SUPABASE_DB_CA_CERT` in Vercel and verify a successful PostgreSQL connection before enabling strict TLS verification.
- Complete the separate Supabase server-client migration and security migration before claiming the database exposure is fixed.
- Implement durable queues/idempotency for long-running work and a real reviewer/approval execution workflow.


## Admin database secret prerequisite
- Admin/CMS database access now uses a server-only Supabase secret key and no longer falls back to a publishable key.
- Configure Vercel Production (and Preview if testing admin preview flows) with `SUPABASE_SECRET_KEY` using a Supabase secret key. The legacy `SUPABASE_SERVICE_ROLE_KEY` is accepted only as a compatibility fallback.
- Do not use a `NEXT_PUBLIC_` variable for this key and never expose it to browser code.
- Until the server-only key is configured, admin database operations intentionally fail closed; the public website's publishable-key client is not changed by this patch.
