# AI Company Current Architecture Audit
**HeyPrince Autonomous AI Workforce Platform**
*Audit Date: 2026-11-08 | Author: Antigravity Autonomous Architecture Engine*

---

## 1. Executive Summary & Verification

This document audits the current state of **HeyPrince.in** and establishes the technical baseline for transforming it into an autonomous AI company where the owner is CEO, Alex Vance is Chief of Staff, and humanoid AI specialists collaborate in virtual rooms, execute tasks, and seek CEO approval for critical actions.

### Verified Architecture Baseline
- **Frontend & App Engine:** Next.js 16 (App Router), React 19, TypeScript 6.0, Tailwind CSS / custom modern dark aesthetic.
- **Database & Identity:** Supabase PostgreSQL with pooled connection routing (Transaction port 6543 / Session port 5432).
- **Python AI Backend (`heyprince-ai-backend/`):** FastAPI service running on host/VPS with Ollama PC bridge (`llama3.3:70b`) and Gemini Cloud fallback (`gemini-3.5-flash`), APScheduler for background jobs, and asyncpg database connectivity.
- **Existing AI Agents:**
  1. `content_researcher` (Marcus Sterling, Editorial)
  2. `website_guardian` (David Chen, Site Reliability & Infrastructure)
  3. `seo_growth` (Elena Rostova, Growth & Search Intelligence)
  4. `lead_scout` (Liam Thorne, Lead Intelligence & Sales)
  5. `inbound_responder` (Sophia Reynolds, Client Solutions)
  6. `alex_vance` (Chief of Staff & Corporate Moderator)
- **Database State Verified:** Table `company_employees`, `company_rooms`, `company_discussions`, `company_messages`, `company_tasks`, `company_proposals`, and `company_memory` are migrated and verified in Supabase PostgreSQL (`src/lib/company/schema.sql`).

---

## 2. Component Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 HUMAN CEO (Prince)                                |
|          [Reviews Proposals] [Approves Sensitive Actions] [Sets Direction]        |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                           NEXT.JS 16 APP ROUTER LAYER                             |
|  - Admin Dashboard (/admin/company, /admin/chief-of-staff, /admin/approvals)      |
|  - Real-time Collaboration Engine (SSE / Supabase Realtime Channels)               |
|  - API Gateways (/api/admin/company/*, /api/cron/*, /api/leads/*)                 |
|  - In-process TypeScript Domain Services (db.ts, orchestrator.ts, memory.ts)      |
+-----------------------------------------------------------------------------------+
                               |                     ^
                  Secure Internal Token       JSON API Telemetry
                               v                     |
+-----------------------------------------------------------------------------------+
|                        FASTAPI PYTHON AI BACKEND                                  |
|  - Autonomous Meeting Moderator & Debate Loop (app/company/discussions.py)        |
|  - LLM Router: Ollama PC (Local 70B) -> Gemini 3.5 Flash (Cloud Fallback)         |
|  - Lead Scraper & Tailored Cold Pitch Synthesizer (app/pipeline/proposal_engine)  |
|  - Background Autonomous Cron Scheduler (APScheduler in app/scheduler/jobs.py)   |
|  - Strict Content Sanitizer (Zero Em-Dashes, High-Conviction Copy)                |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         SUPABASE POSTGRESQL STORE                                 |
|  - company_employees   : Humanoid identities, allowed tools, performance metrics  |
|  - company_rooms       : 5 Virtual office departments & collaboration rooms       |
|  - company_discussions : Meeting context, turn counters, token budgets            |
|  - company_messages    : Turn-by-turn argumentation, evidence, debate statements   |
|  - company_tasks       : Multi-agent assigned tasks, acceptance criteria, outputs |
|  - company_proposals   : CEO approval gate for external/financial/prod actions    |
|  - company_memory      : Tiered company brain (company, dept, employee, meeting)  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Communication Protocols

| Channel | Source | Destination | Protocol | Security Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js <-> FastAPI** | Next.js API | FastAPI Backend | HTTP POST / Bearer | `AI_SERVICE_SECRET` HMAC Header |
| **Realtime Live Room** | Next.js API | Admin Browser | Server-Sent Events (SSE) / Supabase Realtime | Payload JWT Session Cookie |
| **Database Access** | Next.js / Python | Supabase PostgreSQL | `pg` / `asyncpg` | SSL `require`, pooled transaction |
| **LLM Inference** | FastAPI | Local Ollama PC | HTTP JSON | Local network / Tailscale bridge |
| **LLM Cloud Fallback** | FastAPI / Next.js | Google Gemini | REST API (v1beta) | `GEMINI_API_KEY` |

---

## 4. Architectural Verification Matrix

| Area | Current Codebase Status | Missing Functionality | Mitigation / Action |
| :--- | :--- | :--- | :--- |
| **Employee Registry** | DB schema migrated, 6 employees seeded | Physical avatar image files missing at `/assets/avatars/` | Generated scalable SVG/WebP assets for all 6 avatars. |
| **Collaboration Rooms** | DB tables exist, Python discussion loop partially implemented | Next.js UI lacks Virtual Office & Live Meeting Room view; no streaming endpoint | Created `/admin/company` interface with real-time SSE stream. |
| **Task Execution** | `company_tasks` table created with 0 rows | No autonomous task dispatching or verification review engine | Implemented task queue runner with peer agent verification. |
| **CEO Approval Engine** | `company_proposals` table created with 0 rows | Linkage between approved proposals and physical tool execution | Built backend approval execution engine with safety checks. |
| **Workforce Builder** | Defined in specifications | Endpoint and UI for drafting, testing, and activating new agents | Added proposal generator and isolated testing suite for new agents. |
