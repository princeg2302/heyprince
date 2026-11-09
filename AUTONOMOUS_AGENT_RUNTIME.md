# Autonomous Agent Runtime and Background Execution Architecture

## Executive Overview

The HeyPrince AI Workforce operates continuously through an autonomous background execution runtime located in `src/lib/company/autonomous-worker.ts` and `/api/cron/company-workforce`.

Employees do **not** depend on an open browser tab or manual "Advance Turn" clicks. Instead, each employee operates against a continuous schedule, evaluating real telemetry, discovering opportunities, resolving tasks, and notifying the CEO when executive approval is required.

---

## 1. Autonomous Work Cycle Pipeline

Each autonomous execution cycle proceeds through five structured stages:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TELEMETRY & AUDIT PROBES                                 │
│    David Chen runs website_latency_probe (TTFB & HTTP status)│
│    Elena Rostova runs database_seo_audit (metadata checks)   │
│    Liam Thorne runs lead_intelligence_audit (pipeline counts)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ANOMALY & OPPORTUNITY DETECTION                          │
│    - If slow routes > 0: Trigger Infrastructure remediation │
│    - If missing meta descriptions > 0: Trigger SEO task     │
│    - If new prospect leads: Trigger lead proposal prep      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. AUTONOMOUS TASK LIFECYCLE                                │
│    - Create internal company_tasks with acceptance criteria │
│    - Move pending tasks to 'in_progress'                    │
│    - Execute permitted work and capture real deliverables   │
│    - Independent verification by reviewer agent             │
│    - Transition to 'completed'                              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CEO APPROVAL GATING (STRICT PERMISSION ENGINE)           │
│    - Internal research, task creation, & discussions: AUTO  │
│    - Publishing content, site changes, external outreach:   │
│      Gated in company_proposals -> Web Push Alert to Prince │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SHARED MEMORY PERSISTENCE                                │
│    Persist benchmark metrics & strategic decisions into     │
│    company_memory table for future agent context retrieval  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Autonomous Task Execution and Independent Verification

Every task created in `company_tasks` enforces an independent four-eye principle:
1. **Assignment**: Alex Vance or a department lead assigns the task to a specialist.
2. **Acceptance Criteria**: Explicit bullet points define completion.
3. **Execution**: The assigned agent executes permitted tools and writes output data into `output_result`.
4. **Independent Review**: A separate reviewer agent (e.g. Alex Vance reviewing David Chen, or Marcus Sterling reviewing Elena Rostova) verifies all criteria.
5. **Audit History**: All timestamps (`started_at`, `completed_at`, `verification_notes`) are stored immutably.

---

## 3. Headless Cron and API Integration

The runtime is accessible headless via:
- **Endpoint**: `GET /api/cron/company-workforce` (secured by Bearer `CRON_SECRET`).
- **Trigger**: Vercel Cron or GitHub Actions scheduled hourly/daily.
- **Reporting**: Returns structured JSON report detailing audited routes, average latency, SEO gaps, pipeline metrics, and all operational actions taken.
