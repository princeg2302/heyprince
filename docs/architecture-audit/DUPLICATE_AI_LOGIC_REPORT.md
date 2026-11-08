# Duplicate AI Logic & Consolidation Report

**Audit Date:** November 8, 2026  
**Objective:** Identify every AI capability duplicated between TypeScript and Python, assess discrepancies, and define the authoritative path.

---

## 1. Inventory of Duplicate AI Logic

| Capability / Subsystem | TypeScript Implementation | Python Implementation | Differences & Analysis | Authoritative Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **LLM Inference Client** | `src/lib/daily-news/ai-provider.ts` | `heyprince-ai-backend/app/llm/router.py`, `gemini_client.py`, `ollama_client.py` | TS only supports Gemini/OpenAI cloud APIs over direct `fetch`. Python supports intelligent routing between local Ollama GPU and Cloud Gemini with automatic fallback and prompt sanitization. | **Python Authoritative** (Move all model dispatch to Python; TS keeps lightweight fallback). |
| **Article Synthesis Prompt & Logic** | `src/lib/daily-news/content-generator.ts` | `heyprince-ai-backend/app/pipeline/content_generator.py` | Both enforce 1,500+ words, JSON schema, and the no-em-dash rule. Python includes integrated token metrics and cleaner regex JSON extraction. | **Python Authoritative** |
| **Visual / Cover Image Generator** | `src/lib/daily-news/image-generator.ts` | `heyprince-ai-backend/app/pipeline/image_generator.py` | Both construct Pollinations AI prompts with glassmorphism styling. Python verifies image reachability via HTTP HEAD/GET before returning. | **Python Authoritative** |
| **Cold Outreach Proposal Engine** | `src/lib/outreach/proposal-generator.ts` | `heyprince-ai-backend/app/pipeline/proposal_engine.py` | Both synthesize email, WhatsApp, and audit pitches. Python version leverages central LLM router instead of direct Gemini calls. | **Python Authoritative** |
| **Website Guardian Agent** | `src/lib/chief-of-staff/agents/website-guardian.ts` | `heyprince-ai-backend/app/agents/website_guardian.py` | Both check production routes (`/`, `/insights`, `/contact`, `/services`) for latency and HTTP 200. Python runs asynchronously in Docker without Vercel serverless execution limits. | **Python Authoritative** |
| **SEO Growth Agent** | `src/lib/chief-of-staff/agents/seo-growth.ts` | `heyprince-ai-backend/app/agents/seo_growth.py` | Both query LLMs for keyword opportunities and internal linking strategies. Python routes through local/cloud router. | **Python Authoritative** |
| **Lead Scout Agent** | `src/lib/chief-of-staff/agents/lead-scout.ts` | `heyprince-ai-backend/app/agents/lead_scout.py` | TS contains Overpass API discovery logic; Python generates audit proposals. Both complement each other. | **Hybrid**: Next.js coordinates geographic OSM queries; Python synthesizes technical proposals. |
| **Content Researcher Agent** | `src/lib/chief-of-staff/agents/content-researcher.ts` | `heyprince-ai-backend/app/agents/content_researcher.py` | Both generate service page expansion blueprints and technical blog drafts for admin approval. | **Python Authoritative** |
| **Em-Dash Content Sanitizer** | `src/lib/ai-content-sanitizer.ts` | `heyprince-ai-backend/app/llm/sanitizer.py` | Exact port. Python implementation is identical to the verified TypeScript rules. | **Both Active** (Python sanitizes at source; TS verifies before database render). |
| **Background Cron Schedulers** | `vercel.json` (Crons for News, Chief, Scout) | `heyprince-ai-backend/app/scheduler/jobs.py` (APScheduler) | **Critical Conflict**: If both run independently, the site will generate duplicate articles and double audit logs. | **Next.js Master**: Vercel Cron triggers Next.js routes, which call Python backend via authenticated HMAC RPC. Disable standalone duplicate cron in APScheduler. |

---

## 2. In-Depth Discrepancy Analysis

### 1. Daily News Generation Pipeline
- **TypeScript:** `executeDailyNewsAutomation()` in `src/lib/daily-news/orchestrator.ts` runs the RSS collector, dedupes articles, and calls `generateDailyPost()` in TypeScript via direct fetch to Gemini.
- **Python:** `app/api/v1/news.py` accepts `{ title, category, source_url }` and runs `content_generator.py` and `image_generator.py`.
- **Duplicate Execution Risk:** Currently, Next.js does not call Python at all for Daily News; it runs 100% locally in TypeScript.
- **Remediation:** In `src/lib/daily-news/orchestrator.ts`, insert an `isAiBackendEnabled()` check:
  ```typescript
  if (isAiBackendEnabled()) {
    const pyRes = await callAiBackend('/api/v1/news/generate', {
      title: candidateTitle,
      category: candidateCategory,
      source_url: candidateSourceUrl,
      trigger_type: triggerType
    });
    if (pyRes.ok) {
      // Use Python generated article and cover image
    }
  }
  // Fall back to local TypeScript routines if Python is disabled or offline
  ```

### 2. Outreach Proposal Generation
- **TypeScript:** `src/app/api/admin/outreach/ai-analyze/route.ts` calls `generateOutreachProposal()` in `src/lib/outreach/proposal-generator.ts`.
- **Python:** `heyprince-ai-backend/app/api/v1/outreach.py` defines `/generate-proposal`.
- **Duplicate Execution Risk:** Next.js completely bypasses Python for lead proposals.
- **Remediation:** Hook `callAiBackend('/api/v1/outreach/generate-proposal')` into `src/app/api/admin/outreach/ai-analyze/route.ts`.

### 3. Schedulers & Background Jobs
- **The Duplicate Cron Danger:**
  - Vercel Cron triggers `/api/cron/chief-of-staff` once daily at 04:00 UTC.
  - Python APScheduler (`app/scheduler/jobs.py`) is configured to run `scheduled_guardian_sweep` every 6 hours and `scheduled_seo_analysis` every 24 hours.
  - If both run, Chief of Staff tasks will be recorded twice in `chief_activity_logs`.
- **Remediation:** Set `ENABLE_SCHEDULER=false` in Python when running in multi-tier mode where Vercel Edge Cron triggers the Next.js master controller.

---

## 3. Consolidation Policy

1. **Zero Deletion Until Verified:**  
   Do not delete the TypeScript AI code. Keep TypeScript functions as the **graceful local fallback** inside `try/catch` blocks. If the VPS container is restarting, updating, or temporarily down, Next.js will fall back to local routines with zero user-facing downtime.
2. **Single Entry Point for Frontend:**  
   The frontend UI (`/admin/*`) will NEVER communicate with Python directly. The browser always calls Next.js API routes (`/api/admin/*`), which sign the request using HMAC-SHA256 and dispatch it to Python on the VPS.
3. **Database Single-Writer Principle:**  
   Both Next.js and Python connect directly to Supabase PostgreSQL. Python creates records in `daily_news_runs`, `chief_content_drafts`, and `chief_activity_logs`. Next.js handles updates, publishing, and status transitions when Prince approves them.
