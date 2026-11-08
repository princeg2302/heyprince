# HeyPrince AI Company: Infrastructure Architecture & Operating Cost Model

**Project:** Autonomous AI Workforce Platform  
**Document:** `INFRASTRUCTURE_AND_COST_ESTIMATE.md`  
**Date:** November 8, 2026  
**Status:** Architecture Blueprint (Phase 0 Audit)  

---

## 1. Multi-Tier Production Topology

```
[ Public Visitors & Clients ]              [ Prince (CEO) ]
             |                                     |
             v                                     v
+----------------------------------------------------------------------------------+
| VERCEL EDGE PLATFORM                                                             |
| - Next.js 16 App Router (SSR, Static Assets, SEO Routes)                         |
| - Executive Virtual Office & Admin Portals (/admin/*)                            |
| - Edge Cron Jobs (Daily Standup Trigger, Health Sweep Trigger)                   |
| - Cryptographic HMAC-SHA256 Client & Zero-Downtime Fallback Handlers              |
+----------------------------------------------------------------------------------+
             |                                       |
    (PostgreSQL & Realtime)                 (HMAC RPC over HTTPS)
             |                                       |
             v                                       v
+-------------------------------+       +------------------------------------------+
| SUPABASE CLOUD (AWS EU)       |       | SELF-MANAGED VPS (Ubuntu / Docker)       |
| - PostgreSQL Database         |       | - Python 3.11 / FastAPI Container        |
| - Supabase Realtime (CDC)     |       | - Asynchronous Multi-Agent Engine        |
| - Supabase Auth & Row Security|       | - Meeting Moderation & Debate Loop       |
| - Multi-Tier Corporate Memory |       | - Sandboxed Execution Workers            |
+-------------------------------+       +------------------------------------------+
                                                     |
                                       +-------------+-------------+
                                       |                           |
                                       v                           v
                        +----------------------------+   +-------------------+
                        | GOOGLE GEMINI 3.5 FLASH    |   | POLLINATIONS AI   |
                        | Primary High-Speed LLM     |   | Dynamic Cover Art |
                        | 1M Context, ~1.5s Response |   | Zero-Cost Visuals |
                        +----------------------------+   +-------------------+
```

---

## 2. Monthly Infrastructure Cost Breakdown

The platform is designed to deliver enterprise-grade autonomous operations while minimizing recurring operational expenses:

| Infrastructure Layer | Provider & Tier | Resource Allocation | Monthly Cost (USD) |
| :--- | :--- | :--- | :---: |
| **Frontend & Web Hosting** | Vercel (Hobby / Pro) | Serverless SSR, Global Edge CDN, Cron Schedulers | **$0.00 – $20.00** |
| **Database & Realtime CDC** | Supabase (Free / Pro) | PostgreSQL DB, Auth, WebSockets, pgvector | **$0.00 – $25.00** |
| **Autonomous AI Backend** | Self-Managed VPS (Hetzner / DigitalOcean) | 2 vCPU, 4 GB RAM, 40 GB NVMe, Docker | **$5.00 – $10.00** |
| **SSL, DNS & Edge Shield** | Cloudflare (Free Tier) | DNS management, DDoS protection, SSL termination | **$0.00** |
| **Image Generation** | Pollinations AI (Flux / SDXL) | Unlimited dynamic architectural visual synthesis | **$0.00** |
| **Total Base Infrastructure** | — | — | **$5.00 – $55.00 / mo** |

---

## 3. AI Model Token Consumption & Inference Cost Modeling

Based on the verified operational performance of **Google Gemini 3.5 Flash** (Input: $0.075 / 1M tokens; Output: $0.30 / 1M tokens):

### Monthly Autonomous Workload Model:
1. **Daily Standup Meetings (30 meetings/month):**
   - 6 employees participate in an 8-turn moderated discussion.
   - Total tokens per meeting: ~3,500 tokens.
   - Monthly volume: $30 \times 3,500 = 105,000\text{ tokens}$.
   - Cost: **~$0.03 / month**.
2. **Deep Architectural Content Generation (15 deep articles/month):**
   - Research synthesis + 1,600-word deep-dive article + LinkedIn post.
   - Total tokens per article: ~8,000 tokens.
   - Monthly volume: $15 \times 8,000 = 120,000\text{ tokens}$.
   - Cost: **~$0.04 / month**.
3. **Continuous Website Guardian Audits (120 sweeps/month):**
   - Synthetic latency diagnostics, CWV reporting, route status checks.
   - Handled primarily by native Python HTTP requests (0 LLM tokens).
   - Analysis summaries for anomalies: ~50,000 tokens/month.
   - Cost: **~$0.01 / month**.
4. **Lead Scout & Inbound Proposal Synthesis (40 proposals/month):**
   - Business technical audit + customized proposal scope generation.
   - Total tokens per proposal: ~4,000 tokens.
   - Monthly volume: $40 \times 4,000 = 160,000\text{ tokens}$.
   - Cost: **~$0.05 / month**.
5. **Ad-hoc Cross-Department Discussions (War Room & Innovation Lab):**
   - ~500,000 tokens/month reserved for spontaneous agent brainstorming.
   - Cost: **~$0.15 / month**.

### Total Monthly Model Inference Cost:
$$\text{Total AI Model Cost} \approx \mathbf{\$0.28\text{ to }\$1.50\text{ / month}}$$

Even with a 10x surge in business activity, total Gemini API expenditure remains **well under $5.00 per month**.

---

## 4. Hardware Sizing & Scalability Guardrails

### 1. VPS Sizing (For Dockerized Python AI Backend)
- **Minimum Viable Spec:** 1 vCPU, 2 GB RAM (e.g. Hetzner CX22 @ ~$4.50/mo).
- **Recommended Production Spec:** 2 vCPU, 4 GB RAM (e.g. Hetzner CX32 @ ~$8.00/mo).
- **RAM Footprint:**
  - FastAPI / Uvicorn master process: ~90 MB.
  - Asyncpg database connection pool (10 connections): ~45 MB.
  - Background task worker pool: ~120 MB.
  - **Total Memory Consumption:** `< 350 MB`, leaving over 3.5 GB of free headroom for memory caches and OS buffers.

### 2. High-Availability & Failure Modes
- **VPS Hard Crash / Reboot:**
  - Docker Compose automatically restarts the container (`restart: unless-stopped`).
  - Next.js detects the temporary outage via `isAiBackendEnabled()` timeout (3 seconds) and seamlessly handles critical client actions locally in TypeScript.
- **Supabase Network Disconnection:**
  - `DatabasePool` in `app/core/database.py` maintains automatic retry and reconnect logic.
- **Gemini Rate Limit (HTTP 429) / Outage:**
  - `gemini_client.py` candidate model ladder automatically falls back through `gemini-3.5-flash` -> `gemini-3.8-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest`.

---

## 5. Summary Economic Proposition

For an all-in operational expenditure of **less than $30 per month**, HeyPrince.in will operate a 24/7 autonomous corporate workforce of 6+ specialized humanoid AI employees continuously driving SEO growth, publishing world-class engineering guides, scouting enterprise business leads, and guarding site reliability under the sovereign direction of Prince (CEO).
