# Backward Compatibility and Migration Plan

## Executive Commitment

The transformation of the HeyPrince workforce into a unified autonomous digital company is strictly additive, idempotent, and non-destructive. No working production route, published article, client discovery record, or existing database table will be deleted, broken, or overwritten.

---

## 1. Preserved Production Assets & Integrity Matrix

### A. Public Website Routes (Zero User-Facing Disruption)
* `/insights`: Public engineering blog and news feed. Retains full ISR and edge caching.
* `/insights/[slug]`: Canonical article deep-dives. Metadata, OpenGraph cards, JSON-LD schema, and reader experience remain 100% stable.
* `/services` & `/services/[slug]`: Public consulting service catalog.
* `/contact`: Inbound client lead submission portal. Submissions continue piping to `client_leads` and triggering Sophia Reynolds.

### B. Existing Admin Dashboard Routes
* `/admin/dashboard`: Overall portal metrics.
* `/admin/posts` & `/admin/posts/[id]`: Post listing and inspection views.
* `/admin/services`: Service catalog management.
* `/admin/chief-of-staff`: Executive agent supervision and 1-on-1 private desk management.
* `/admin/company`: Collaborative virtual office floor, task matrix, and CEO approval gate.
* `/admin/approvals`: Dedicated executive approval queue.
* `/admin/lead-intelligence`: Business discovery and outreach campaigns.

### C. Scheduled Crons in `vercel.json`
* `/api/cron/daily-news` (`30 3 * * *`): Preserved. Marcus Sterling executes the daily news research and drafting.
* `/api/cron/chief-of-staff` (`0 */6 * * *`): Preserved. Runs periodic health audits, SEO checks, and lead discovery.
* `/api/cron/company-workforce` (`*/15 * * * *`): Preserved. Runs autonomous 24/7 background task progression and multi-agent coordination.

---

## 2. Database Migration Standards & Safe Patterns

All database schema evolutions adhere strictly to idempotent PostgreSQL best practices:

1. **Table Creation**: Always uses `CREATE TABLE IF NOT EXISTS`.
2. **Column Additions**: Always uses `ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {type}`.
3. **Foreign Keys**: Always configured with `ON DELETE SET NULL` or `ON DELETE CASCADE` where appropriate, preventing orphaned records.
4. **Seed Records**: Always uses `INSERT ... ON CONFLICT ({primary_key}) DO UPDATE SET ...` to guarantee that existing data is refreshed without duplication.
5. **Realtime Replication**: Safe dynamic block that checks `pg_publication` before running `ALTER PUBLICATION supabase_realtime ADD TABLE ...` to avoid exceptions.

---

## 3. Legacy Agent to Humanoid Employee Synchronization

To ensure that existing code querying `chief_agents` continues to function seamlessly while the new unified system queries `company_employees`, bidirectional foreign key mappings are maintained:

```
[chief_agents]                             [company_employees]
  - id: 'content_researcher'  <--------->    - id: 'marcus_sterling'
                                             - legacy_agent_id: 'content_researcher'

  - id: 'seo_growth'          <--------->    - id: 'elena_rostova'
                                             - legacy_agent_id: 'seo_growth'

  - id: 'website_guardian'    <--------->    - id: 'david_chen'
                                             - legacy_agent_id: 'website_guardian'

  - id: 'lead_scout'          <--------->    - id: 'liam_thorne'
                                             - legacy_agent_id: 'lead_scout'

  - id: 'inbound_responder'   <--------->    - id: 'sophia_reynolds'
                                             - legacy_agent_id: 'inbound_responder'

  - id: 'alex_vance'          <--------->    - id: 'alex_vance'
                                             - legacy_agent_id: NULL
```

Whenever an employee updates their status or completes a task, the change propagates to both `company_employees` and `chief_agents` so that neither interface falls out of sync.

---

## 4. Verification and Automated Test Harness

Before any code deployment is marked complete, the entire test suite must pass cleanly:

1. **AI Company Suite**: `npm run test:company` (20/20 checks covering employee seeds, virtual rooms, memory partitioning, task transitions, and proposal lifecycle).
2. **Daily News Suite**: `npm run test:news` (Verifies RSS ingestion, deduplication hash computation, and content structure).
3. **Outreach Suite**: `npm run test:outreach` (Verifies OpenStreetMap discovery parser, lead qualification scoring, and proposal drafting).
4. **Full Production Next.js Build**: `npm run build` (Ensures zero TypeScript errors, zero lint warnings, and 100% clean compilation across all 91 routes).

---

## 5. Rollback and Disaster Recovery Strategy

1. **Git Version Control**: All atomic changes are committed with clear semantic messages. In the event of an unforeseen regression, a git revert restores the previous stable commit without touching external assets.
2. **Database Data Preservation**: No `DROP TABLE` or `TRUNCATE` operations are permitted under any circumstance.
3. **Graceful Fallbacks**: All network-dependent features (Gemini API, Replicate image generation, LinkedIn API) are wrapped in try-catch handlers with local heuristic fallbacks, ensuring the application remains resilient under all network conditions.
