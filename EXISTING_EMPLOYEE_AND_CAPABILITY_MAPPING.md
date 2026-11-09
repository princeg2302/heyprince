# Existing Employee and Capability Mapping

## Executive Summary

HeyPrince.in operates a sophisticated suite of AI capabilities, automation pipelines, and management dashboards. This document establishes an authoritative inventory of all existing agents, cron schedules, database tables, AI models, and UI views, mapping each legacy asset to its permanent owner in the unified AI workforce.

---

## 1. Inventory of Existing AI Systems & Capabilities

### A. Daily AI News & Automated Engineering Blog Pipeline
* **Primary Entrypoint**: `src/app/api/cron/daily-news/route.ts`
* **Core Engine**: `src/lib/daily-news/orchestrator.ts`
* **RSS Feeds & Ingestion**: `src/lib/daily-news/rss-collector.ts` (Hacker News, TechCrunch, ArXiv, Dev.to)
* **LLM Content Synthesis**: `src/lib/daily-news/content-generator.ts` (Authoritative technical analysis)
* **Image Generation**: `src/lib/daily-news/image-generator.ts` (Replicate Flux / Pollinations fallback)
* **Office Humour & Memes**: `src/lib/daily-news/meme-generator.ts`
* **Deduplication Engine**: `src/lib/daily-news/deduplication.ts` (SHA-256 content hashes, similarity threshold)
* **LinkedIn Integration**: `src/lib/linkedin/client.ts` (OAuth2 auto-publishing to executive profile)
* **Cron Schedule**: Daily at 9:00 AM IST (`30 3 * * *` UTC) via `vercel.json`
* **Status**: Fully active, production-grade, and generating live articles.

### B. AI Chief of Staff (Legacy Multi-Agent Console)
* **Primary Route**: `src/app/(payload)/admin/chief-of-staff/page.tsx`
* **Client Interface**: `src/app/(payload)/admin/chief-of-staff/ChiefOfStaffClient.tsx`
* **Database Schema**: `src/lib/chief-of-staff/schema.sql`
* **Database Operations**: `src/lib/chief-of-staff/db.ts`
* **Cron Route**: `src/app/api/cron/chief-of-staff/route.ts`
* **Active Agents**:
  1. `content_researcher`: Autonomous technical topic discovery and service blueprint drafting (`src/lib/chief-of-staff/agents/content-researcher.ts`)
  2. `seo_growth`: Post meta audits, keyword intent scoring, and SEO patch recommendations (`src/lib/chief-of-staff/agents/seo-growth.ts`)
  3. `website_guardian`: Core Web Vitals profiling, route uptime checks, and link health monitoring (`src/lib/chief-of-staff/agents/website-guardian.ts`)
  4. `lead_scout`: Local business discovery and technical opportunity identification (`src/lib/chief-of-staff/agents/lead-scout.ts`)
  5. `inbound_responder`: Client inquiry parsing, scope evaluation, and proposal generation (`src/lib/chief-of-staff/agents/inbound-responder.ts`)

### C. AI Lead Intelligence & Outreach System
* **Primary Route**: `src/app/(payload)/admin/lead-intelligence/`
* **Database Operations**: `src/lib/outreach/db.ts`
* **Discovery Service**: `src/lib/outreach/discovery/service.ts` (OpenStreetMap Overpass API, Google Places)
* **Qualification & Rotation**: `src/lib/outreach/qualification.ts` (`LEAD_SCOUT_TARGET_ROTATION`)
* **Proposal Drafter**: `src/lib/outreach/proposal-generator.ts`
* **Active Workflows**: Discovers real business websites lacking mobile responsiveness, fast TTFB, or modern ecommerce frontends.

### D. AI Company (Virtual Office & Multi-Agent Collaboration)
* **Primary Route**: `src/app/(payload)/admin/company/page.tsx`
* **Client Interface**: `src/app/(payload)/admin/company/CompanyOfficeClient.tsx`
* **Backend Orchestrator**: `src/lib/company/orchestrator.ts`
* **Database Schema**: `src/lib/company/schema.sql`
* **Database Operations**: `src/lib/company/db.ts`
* **Cron Route**: `src/app/api/cron/company-workforce/route.ts`
* **Virtual Rooms**: Company War Room, Daily 9:00 AM Standup, Innovation & R&D Lab, Growth & Revenue Room, Engineering & SRE Room.

---

## 2. Definitive Employee Mapping Matrix

To eliminate all duplicate identities and disjointed systems, each legacy capability is assigned to a single canonical employee:

| Canonical Employee ID | Humanoid Name | Display Title & Department | Legacy Agent ID | Core Owned Capabilities | Primary File References |
|---|---|---|---|---|---|
| `prince_ceo` | Prince | Chief Executive Officer & Founder (Executive) | *None* | Final business strategy, task assignment, executive approvals, LinkedIn voice | `src/lib/admin-db.ts`, `posts` author |
| `alex_vance` | Alex Vance | Chief of Staff & Head of Operations (Executive) | *Coordinator* | Cross-agent moderation, meeting synthesis, task routing, approval queue packaging | `src/lib/company/orchestrator.ts`, `src/lib/chief-of-staff/db.ts` |
| `marcus_sterling` | Marcus Sterling | Principal Content Creator & Lead Writer (Editorial) | `content_researcher` | Daily AI News, engineering deep dives, service page copy, zero em-dash writing | `src/lib/daily-news/*`, `src/lib/chief-of-staff/agents/content-researcher.ts` |
| `elena_rostova` | Elena Rostova | Head of Search & Semantic Intelligence (Growth) | `seo_growth` | Organic keyword research, search intent analysis, title/meta audits, internal link graphs | `src/lib/chief-of-staff/agents/seo-growth.ts` |
| `david_chen` | David Chen | Site Reliability Sentinel & Performance Engineer (Infrastructure) | `website_guardian` | Core Web Vitals, sub-200ms TTFB monitoring, route uptime, production security | `src/lib/chief-of-staff/agents/website-guardian.ts` |
| `liam_thorne` | Liam Thorne | Lead Intelligence & Growth Scout (Sales) | `lead_scout` | Business discovery via OSM/Places, website tech audits, candidate lead qualification | `src/lib/chief-of-staff/agents/lead-scout.ts`, `src/lib/outreach/*` |
| `sophia_reynolds` | Sophia Reynolds | Client Solutions Partner (Client Solutions) | `inbound_responder` | Inbound contact inquiry parsing, commercial scoping, tailored technical proposal drafting | `src/lib/chief-of-staff/agents/inbound-responder.ts` |

---

## 3. Database Schema Ownership & Consolidation

The database operates on Supabase PostgreSQL. All tables are preserved without data loss:

### Shared Corporate Memory & Execution Substrate
1. `company_employees`: Authoritative employee profiles, bio, personality, status, metrics, and legacy agent foreign key.
2. `company_memory`: Central company brain partitioned by scope (company, department, employee, meeting).
3. `company_tasks`: Unified task matrix with dependencies, acceptance criteria, assignments, and verification notes.
4. `company_proposals`: Executive approval queue for high-impact actions (publishing, outreach, deployments).
5. `company_discussions` & `company_messages`: Collaboration rooms and turn-by-turn multi-agent debates.

### Preserved Legacy Subsystems (Fully Compatible)
1. `chief_agents`: Preserved for backward compatibility; synchronized with `company_employees`.
2. `chief_content_drafts`: Preserved for content drafts generated by Marcus Sterling and Sophia Reynolds.
3. `chief_health_audits`: Preserved for synthetic and real-user monitoring reports from David Chen.
4. `chief_seo_recommendations`: Preserved for page-level optimization suggestions from Elena Rostova.
5. `chief_tasks` & `chief_activity_logs`: Preserved for execution audit trails.
6. `daily_news_runs` & `daily_news_items`: Preserved for idempotent daily blog runs.
7. `businesses`, `discovery_jobs`, `contacts`: Preserved for Liam Thorne's outreach workflows.

---

## 4. Verification and Anti-Duplication Principles

1. **Zero Duplicate Bots**: No secondary content generator or duplicate lead scraper will be introduced. Marcus Sterling executes the existing `executeDailyNewsAutomation`, and Liam Thorne executes the existing `discoveryService`.
2. **Unified State Across Views**: When Marcus Sterling is researching an article, his status updates to `researching` in both AI Chief of Staff and AI Company.
3. **Canonical IDs Everywhere**: All backend tasks, memory entries, and discussions use the canonical employee ID (`marcus_sterling`, `elena_rostova`, etc.). Legacy queries map via `legacy_agent_id`.
