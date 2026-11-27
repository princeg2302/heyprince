# HeyPrince Complete System Audit

**Repository:** `princeg2302/heyprince`  
**Audit date:** 2026-11-27  
**Branch reviewed:** `main`  
**Method:** Static review of repository files through the GitHub connector  
**Scope:** Next.js frontend/API, Python AI backend, workforce orchestration, authentication, cron jobs, database access, deployment configuration and project documentation.

> **Important scope limitation:** This is a source-code audit, not a live production penetration test. I did not access Vercel environment variables/logs, Supabase production data/settings, the VPS, or external provider dashboards. I did not run builds, tests, migrations, cron jobs, or live authenticated requests. Findings below are based on the committed source reviewed and should be confirmed in the deployed environment before remediation.

## 1. Executive summary

HeyPrince is a substantial hybrid application: Next.js 16 / React 19 handles the public site, admin experience and API routes; PostgreSQL on Supabase is accessed through server-side database clients; a Python FastAPI service is intended to handle AI agents and longer-running workloads; and Vercel Cron triggers scheduled workflows. The repository also contains a multi-agent company/workforce layer with employees, tasks, discussions, proposals and memory.

The architecture has a sensible separation of concerns in principle, but the current source contains several high-impact security and correctness issues. The most urgent are:

1. **The Next.js-to-Python HMAC authentication implementations do not agree on either the signed message format or timestamp units.** Authenticated backend calls are therefore expected to fail.
2. **Several cron endpoints accept caller-controlled headers as proof that a request came from Vercel Cron.** Two endpoints also contain a hard-coded query-string credential. This creates a serious risk of unauthorized scheduled work being triggered.
3. **Admin session verification accepts an unsigned Base64 legacy token and can fall back to trusting token claims when the user lookup fails.** Combined with a hard-coded session-secret fallback, this is a critical authentication design flaw.
4. **The Python scheduler is enabled by default while Vercel also schedules overlapping agent work.** Duplicate execution is possible.
5. **The workforce task processor marks all acceptance criteria verified and claims independent review without actually running a reviewer.** This makes the system's completion and verification status unreliable.
6. **Proposal execution is not visibly protected against concurrent/repeated execution.** Some proposal types also report that work was deployed or queued when the implementation only changes proposal status.

**Overall assessment:** Do not treat the AI workforce, admin session system, or cron endpoints as production-hardened until the Critical and High findings are addressed and tested.

## 2. Findings by severity

### C-01 — Admin session accepts unsigned legacy tokens
**Severity:** Critical  
**File:** `src/lib/admin-db.ts`

The current verifier first handles signed `payload.signature` tokens, but if the token has no dot it also decodes it as plain Base64 JSON and accepts it when `id`, `email` and a future `exp` are present. Base64 is encoding, not authentication; an attacker can construct a payload without knowing a signing secret.

There is a second trust issue in `getCurrentAdmin()`: if the Supabase user lookup does not return a user, the function constructs an admin object from the session payload and defaults the role to `admin`. A signed but stale/forged claim should not grant access when the authoritative user record is unavailable.

**Impact:** Potential admin impersonation and access to admin-only routes, depending on route usage and deployment conditions.

**Recommended fix:**
- Remove acceptance of unsigned legacy Base64 session tokens. Invalidate existing legacy sessions and require re-authentication.
- Fail closed if the authoritative user record cannot be verified. Do not synthesize an admin identity or default a role to `admin`.
- Require a strong `ADMIN_SESSION_SECRET` (or a deliberately managed secret) in production; remove the hard-coded fallback.
- Verify role and account status from the database on every authenticated request or use a carefully designed short-lived session with revocation strategy.
- Add tests for unsigned tokens, expired tokens, deleted users, database outages, role changes and timing-safe signature comparison.

### C-02 — Cron authentication can be bypassed with spoofed request headers
**Severity:** Critical  
**Files:**
- `src/app/api/cron/company-workforce/route.ts`
- `src/app/api/cron/chief-of-staff/route.ts`
- `src/app/api/cron/lead-scout/route.ts`
- `src/app/api/cron/daily-news/route.ts`

The routes infer that a request is a Vercel Cron request from request headers such as `x-vercel-cron`, `x-vercel-cron-schedule`, or a User-Agent containing `vercel-cron`. These are ordinary HTTP request values and can be supplied by a caller; they are not, by themselves, cryptographic proof of origin.

The company-workforce and chief-of-staff routes additionally accept a hard-coded query-string credential in source. This credential should be treated as compromised because it is committed in a public repository.

**Impact:** An unauthenticated caller may be able to trigger AI workforce cycles, agent execution, global scans, lead discovery or daily automation. This can cause database writes, provider costs, duplicate work and operational disruption.

**Recommended fix:**
- Remove the hard-coded query credential entirely and rotate any equivalent credential that may have been used.
- Require a high-entropy `CRON_SECRET` for every externally callable cron route. Validate it using a constant-time comparison.
- Do not bypass authentication based only on User-Agent or caller-supplied `x-vercel-cron*` headers. If relying on Vercel's cron invocation model, use the documented authenticated secret mechanism.
- Reject production cron requests when the secret is missing. Add rate limits, idempotency keys and audit logging.
- Review existing logs for unexpected invocations and rotate the production cron secret.

### C-03 — Next.js and Python HMAC request signing are incompatible
**Severity:** Critical  
**Files:**
- `src/lib/ai-backend-client.ts`
- `heyprince-ai-backend/app/core/security.py`

The Next.js client signs `timestamp:body`. The Python verifier calculates its expected signature from `METHOD:path:timestamp:body`. Those messages are different, so the signatures cannot match.

There is also a timestamp-unit mismatch: Next.js sends Unix seconds (`Date.now() / 1000`), while Python compares the received value against `time.time() * 1000` (milliseconds) and uses a millisecond replay window. A normal seconds timestamp will be treated as far outside the allowed window.

**Impact:** Requests delegated to the Python AI service are expected to fail authentication. The TypeScript fallback may hide this failure, leaving the Python backend apparently configured but unused.

**Recommended fix:**
- Define one canonical signing contract and implement it identically in both languages. Include method, exact request path, timestamp and raw body bytes in the signed message.
- Use one timestamp unit (prefer Unix seconds) and one documented replay-window calculation.
- Ensure both sides canonicalize the path and body identically; verify signatures with constant-time comparison.
- Add shared cross-language test vectors and integration tests for valid requests, modified bodies, modified paths, expired timestamps and clock skew.
- Log delegation failures distinctly and expose a health/diagnostic signal so fallback does not conceal a broken bridge.

### H-01 — Python scheduler and Vercel Cron can run overlapping agents
**Severity:** High  
**Files:** `heyprince-ai-backend/app/main.py`, `heyprince-ai-backend/app/scheduler/jobs.py`, `heyprince-ai-backend/app/core/config.py`, `vercel.json`

FastAPI startup calls `start_scheduler()`. The scheduler is enabled by default through `ENABLE_AUTONOMOUS_CRON=True`, and schedules a Website Guardian sweep every six hours and SEO analysis every 24 hours. Vercel separately schedules the Chief of Staff workflow, which can also run the same agent types. There is no demonstrated distributed lock or shared idempotency mechanism protecting these overlapping runs.

The Python config also defines `ENABLE_SCHEDULER`, but the scheduler implementation checks `ENABLE_AUTONOMOUS_CRON`; this makes the intended control ambiguous.

**Impact:** Duplicate audits, repeated task/draft creation, inflated metrics, provider costs and race conditions.

**Recommended fix:**
- Choose one authoritative scheduler for each job family. If Vercel is the master, disable Python autonomous scheduling in production.
- Remove or consolidate the unused/ambiguous scheduler flag.
- Add database-backed distributed locks and idempotency keys for every scheduled workflow, so duplicate triggers remain safe.
- Document the owner, cadence, timezone and retry policy for each job.

### H-02 — Workforce task verification is not independent
**Severity:** High  
**File:** `src/lib/company/orchestrator.ts` (`processCompanyTask`)

The task processor generates one AI deliverable, then maps every acceptance criterion to `verified: true`. It constructs a verification note claiming independent verification by the reviewer agent, but no reviewer execution or evidence check is performed in this function.

**Impact:** The admin dashboard and company memory can report tasks as completed and independently verified even when the criteria were not tested. This undermines the trustworthiness of the AI workforce's status, reports and learning data.

**Recommended fix:**
- Keep task status at `review_ready` until a separate reviewer process actually evaluates each criterion.
- Store criterion-level evidence, reviewer identity, review timestamp and pass/fail result.
- Never set `verified: true` by default. Missing evidence should remain unverified.
- Add tests for failed criteria, incomplete deliverables, reviewer failure and re-review.

### H-03 — Proposal execution can be repeated and is not visibly atomic
**Severity:** High  
**Files:** `src/lib/company/orchestrator.ts`, `src/app/api/admin/company/proposals/[id]/execute/route.ts`

The execution function checks whether a proposal's status is `approved`, then performs the action and marks it executed afterward. The check and status transition are not atomic in the inspected code. Two simultaneous requests can both observe `approved` and execute the same action before either marks it executed.

For `publish_content`, this can create duplicate published posts and potentially duplicate LinkedIn publication. The route relies on `getCurrentAdmin()`, so the admin-session issue in C-01 also affects this boundary.

**Impact:** Duplicate external publication or repeated business actions.

**Recommended fix:**
- Atomically claim an approved proposal in the database with a conditional status update/row lock before performing side effects.
- Add a unique idempotency key for each action and persist external provider response IDs.
- Use a durable execution state machine (`approved -> executing -> executed/failed`) with safe retry handling.
- Require a fresh, verified admin identity and explicit approval record.

### H-04 — Proposal success messages overstate what is actually executed
**Severity:** High  
**File:** `src/lib/company/orchestrator.ts` (`executeApprovedProposal`)

The `site_modification` branch marks the proposal executed and returns a message saying the change was deployed, but the inspected branch does not apply a site change. The `outreach_campaign` branch says the campaign was queued into the email dispatch engine, but the inspected branch only marks the proposal executed and returns a queued-contact count.

**Impact:** The CEO/admin UI may show a completed deployment or queued campaign when no corresponding operation was performed.

**Recommended fix:**
- Make each proposal type call a real, verifiable execution adapter or return `not_implemented` and keep the proposal unexecuted.
- Persist execution evidence such as deployment ID, commit SHA, campaign ID or provider response.
- Separate `accepted`, `queued`, `executed` and `verified` states; never infer success from a status update alone.

### H-05 — Database TLS certificate verification is disabled
**Severity:** High  
**File:** `src/lib/outreach/db.ts`

The PostgreSQL pool enables SSL for remote connections but sets `rejectUnauthorized: false`. This encrypts the connection but disables certificate-chain/hostname verification.

**Impact:** It weakens protection against man-in-the-middle attacks on database connections.

**Recommended fix:**
- Use the provider's recommended CA/certificate validation settings and keep certificate verification enabled.
- Configure the correct Supabase pooler connection string and TLS options through environment variables.
- Test connection behavior in production-like CI without weakening TLS validation.

### H-06 — Production database configuration can silently fall back to local defaults
**Severity:** High  
**File:** `src/lib/outreach/db.ts`

The database connection string falls back to a local `postgres:postgres@127.0.0.1:5432/heyprince` value when environment variables are absent. In production, missing configuration should fail immediately rather than silently attempt a local database.

**Impact:** Misconfigured deployments can fail unpredictably, or different parts of the application can point at different databases.

**Recommended fix:**
- Require `DATABASE_URI` or an explicitly supported production connection variable at startup.
- Permit local defaults only in an explicit development environment.
- Add startup validation and a safe database connectivity health check.

### M-01 — Admin authentication has a hard-coded signing-secret fallback
**Severity:** Medium (part of C-01)  
**File:** `src/lib/admin-db.ts`

The session signing secret falls back to a fixed string when `ADMIN_SESSION_SECRET` and `PAYLOAD_SECRET` are absent. A production deployment missing both variables would use a predictable secret.

**Recommended fix:** Fail startup in production if the session secret is absent; rotate it and invalidate existing sessions after deployment.

### M-02 — `.gitignore` does not cover all environment-file naming patterns
**Severity:** Medium  
**File:** `.gitignore`

The ignore list covers `.env`, `.env*.local`, `.env.production` and `.env.development`, but does not use a general pattern for every environment-specific file (for example, `.env.staging` or `.env.test`).

**Impact:** A developer could accidentally commit environment credentials under a filename not currently ignored.

**Recommended fix:** Add a general environment-file ignore rule such as `.env.*`, then explicitly unignore the safe example template (for example, `!.env.example`). Review tracked files and Git history for accidental secrets; rotate any exposed credentials.

### M-03 — Documentation and runtime configuration disagree
**Severity:** Medium  
**Files:** `vercel.json`, `docs/ai-company/AI_COMPANY_CURRENT_ARCHITECTURE.md`, `docs/architecture-audit/AUTOMATION_AND_WORKERS.md`, `docs/architecture-audit/AI_WORKFLOW_EXECUTION_MAP.md`, `docs/architecture-audit/PYTHON_BACKEND_IMPLEMENTATION_STATUS.md`

The committed `vercel.json` currently schedules four daily jobs at 03:30, 04:00, 05:00 and 06:00 UTC. Some architecture notes describe a 15-minute company-workforce cadence or only three cron schedules. The Python backend implementation-status document also reports missing imports/config fields that are present in the currently inspected `app/core/database.py` and `app/core/config.py`. This indicates that parts of the documentation are stale or refer to a different code revision.

**Impact:** Operators and future agents may make unsafe decisions based on obsolete architecture claims.

**Recommended fix:** Regenerate the architecture inventory from current source, record the commit SHA and date of each verification, and label proposed/target architecture separately from implemented behavior.

### M-04 — No Content Security Policy is configured in Next.js headers
**Severity:** Medium  
**File:** `next.config.mjs`

The configuration sets several useful response headers (HSTS, nosniff, frame options, referrer and permissions policy), but the inspected headers configuration does not define a Content Security Policy.

**Impact:** The browser has fewer defenses against script injection and unexpected third-party resource loading.

**Recommended fix:** Design and roll out a CSP compatible with the app's scripts, styles, analytics and image hosts. Start with report-only mode, inspect violations, then enforce it.

### L-01 — Password hash comparison is not explicitly timing-safe
**Severity:** Low  
**File:** `src/lib/admin-db.ts`

The PBKDF2-derived hash is compared using ordinary string equality. Use a constant-time comparison after validating equal-length buffers.

### L-02 — Admin database client embeds fallback project configuration
**Severity:** Low  
**File:** `src/lib/admin-db.ts`

The Supabase URL and publishable key have source-code fallbacks. A publishable key is designed to be public and is not equivalent to a service-role secret, but production configuration should still be explicit to avoid silently connecting to an unintended project.

## 3. Architecture and capability observations

### Current implementation shape
- **Frontend/application:** Next.js App Router, React 19 and TypeScript.
- **CMS:** Payload CMS integration is present in the dependency list and Next.js configuration.
- **Database:** Supabase PostgreSQL, accessed through Supabase JS and direct PostgreSQL clients.
- **AI service:** Python FastAPI service under `heyprince-ai-backend/`.
- **AI workforce:** Employee registry, company rooms, discussions, tasks, proposals and memory are implemented in TypeScript modules and SQL schema.
- **Scheduling:** Vercel Cron plus Python APScheduler.
- **External integrations:** The repository documents LinkedIn, Resend/SMTP, Cloudflare R2, Gemini, Ollama and OpenStreetMap/Google Places integrations.

### Important architecture distinction
The repository contains both implemented code and target-state architecture documents. Employee names/personas and collaboration features exist in code, but the presence of a class, schema or documentation entry does not prove the full production workflow is healthy. In particular, the Python bridge currently has the HMAC mismatch above, and task review currently marks criteria verified without an actual independent reviewer.

### Database/RLS limitation
The review inspected selected SQL schema and migration files, but did not exhaustively enumerate every migration, every table policy, the live Supabase RLS state, grants, triggers or production roles. Treat database authorization as **not fully audited** until a complete migration and live-policy review is performed.

## 4. Recommended remediation order

### Phase 0 — Contain risk immediately
1. Rotate the cron secret and remove the committed static cron credential from all cron routes.
2. Make all production cron routes require authenticated secrets; remove header/User-Agent-only trust.
3. Remove unsigned legacy admin session acceptance and the default-admin fallback.
4. Confirm production `ADMIN_SESSION_SECRET`, `CRON_SECRET`, `AI_SERVICE_SECRET` and database credentials are unique, high entropy and not reused.
5. Review Vercel logs for unexpected cron invocations and admin authentication anomalies.

### Phase 1 — Restore reliable service-to-service execution
1. Define a canonical Next.js/Python HMAC contract.
2. Align timestamp units and signed message construction.
3. Add cross-language test vectors and integration tests.
4. Verify FastAPI startup and each router import in a clean Python environment.
5. Confirm that TypeScript fallback is observable and does not mask persistent Python failures.

### Phase 2 — Make autonomous execution trustworthy
1. Choose a single authoritative scheduler and disable duplicate schedules.
2. Add distributed locks/idempotency for cron jobs and proposal execution.
3. Implement real independent task review with criterion-level evidence.
4. Ensure proposal types only report success after a real side effect and persisted evidence.
5. Add retry-safe execution states and operator-visible failure alerts.

### Phase 3 — Harden platform operations
1. Enable PostgreSQL certificate verification.
2. Remove production database fallbacks and validate required environment variables at startup.
3. Add CSP in report-only mode, then enforce it.
4. Expand environment-file ignore rules and scan Git history for secrets.
5. Rebuild architecture documentation from the current main branch.

## 5. Required validation checklist

- [ ] Unsigned Base64 session token is rejected.
- [ ] Expired, revoked, deleted-user and database-outage sessions fail closed.
- [ ] No cron endpoint accepts a spoofed User-Agent or `x-vercel-cron*` header as sole authorization.
- [ ] No hard-coded cron credential remains in tracked source or Git history.
- [ ] Valid Next.js HMAC request is accepted by Python; tampered body/path and expired timestamps are rejected.
- [ ] Python FastAPI starts cleanly from a clean install with production-like environment variables.
- [ ] Only one scheduler owns each recurring workflow.
- [ ] Repeated/concurrent cron requests do not duplicate tasks or drafts.
- [ ] A task cannot become verified without independent evidence.
- [ ] Concurrent proposal execution produces exactly one side effect.
- [ ] Site-modification and outreach proposals report success only when their actual operation has completed.
- [ ] PostgreSQL TLS validates the server certificate.
- [ ] Production startup fails clearly when required secrets or database configuration are missing.
- [ ] Build, unit tests, integration tests and deployment smoke tests pass.

## 6. Files inspected (selected)

- `package.json`, `.gitignore`, `.env.example`, `heyprince-ai-backend/.env.example`
- `AGENTS.md`, `CLAUDE.md`, `next.config.mjs`, `vercel.json`
- `src/lib/admin-db.ts`, `src/lib/ai-backend-client.ts`, `src/lib/outreach/db.ts`
- `src/lib/chief-of-staff/orchestrator.ts`
- `src/lib/company/orchestrator.ts`, `src/lib/company/autonomous-worker.ts`, `src/lib/company/db.ts`, `src/lib/company/schema.sql`, `src/lib/company/tools.ts`
- `src/app/api/cron/daily-news/route.ts`, `src/app/api/cron/chief-of-staff/route.ts`, `src/app/api/cron/lead-scout/route.ts`, `src/app/api/cron/company-workforce/route.ts`
- `src/app/api/admin/company/proposals/[id]/execute/route.ts`
- `heyprince-ai-backend/app/main.py`, `app/core/config.py`, `app/core/database.py`, `app/core/security.py`, `app/scheduler/jobs.py`, `app/api/v1/company.py`, `requirements.txt`
- Selected architecture, security, workflow and Python implementation-status documents under `docs/`

## 7. Final verdict

HeyPrince has a promising and ambitious architecture, but the source currently shows security and correctness gaps that should be resolved before relying on autonomous agents for production actions. The most urgent work is not adding more agents or features: it is making authentication, scheduling, execution idempotency and verification truthful and testable.

**This audit changed documentation only.** No application source, database schema, production data, secrets, deployment settings or external services were modified or accessed.
