# Daily Content Workflow Integration Plan

## Objective and Core Principle

The existing Daily AI News pipeline (`src/app/api/cron/daily-news/route.ts` and `src/lib/daily-news/orchestrator.ts`) is a fully functional, production-proven engine that discovers tech news from RSS feeds, synthesizes deep engineering articles, generates cover images, and publishes to both HeyPrince.in and LinkedIn.

**Core Principle**: We do NOT replace, rewrite, or break this existing pipeline. Instead, we wrap and elevate it into a collaborative multi-agent workflow where Marcus Sterling, Elena Rostova, David Chen, and Alex Vance collaborate to produce higher-quality articles, culminating in an executive approval step by Prince (CEO).

---

## 1. Collaborative Multi-Agent Stage Progression

The daily publishing process transitions from a single automated script into a 7-stage collaborative production lifecycle:

```
[Stage 1: Marcus Sterling] --> [Stage 2: Elena Rostova] --> [Stage 3: Image Generation]
     Topic Discovery &              Keyword Intent &              Bespoke Cover &
     Engineering Draft              SEO Architecture              Section Visuals
            |                              |                             |
            +------------------------------+-----------------------------+
                                           |
                                           v
                                [Stage 4: David Chen]
                                  Technical Sanity &
                                  CWV Layout Audit
                                           |
                                           v
                                [Stage 5: Alex Vance]
                                  Executive Synthesis &
                                  Approval Packaging
                                           |
                                           v
                                [Stage 6: Prince (CEO)]
                                  CEO Approval Gate
                                (One-Click Sign-off)
                                           |
                                           v
                                [Stage 7: Publishing]
                                  Live Web & LinkedIn
```

---

## 2. Detailed Stage Specifications

### Stage 1: Topic Discovery and Research (Marcus Sterling)
* **Trigger**: Scheduled cron at 9:00 AM IST (`30 3 * * *` UTC) or manual invocation via the admin portal.
* **Actor**: Marcus Sterling (Principal Content Creator).
* **Underlying Logic**: Calls `collectDailyNews()` from `src/lib/daily-news/rss-collector.ts`.
* **Execution**:
  - Ingests top articles from Hacker News, ArXiv, TechCrunch, and Dev.to.
  - Passes candidates through `checkContentDuplicate()` (`deduplication.ts`) using SHA-256 content hashes to guarantee zero topic duplication.
  - Selects the most architecturally impactful topic for senior developers and enterprise clients.
  - Writes a comprehensive 1,500+ word draft structured with technical sections, architectural code snippets, key takeaways, and pro-tips.
  - Enforces the strict editorial rule: zero em-dashes across all generated text.

### Stage 2: Semantic SEO & Search Intent Audit (Elena Rostova)
* **Actor**: Elena Rostova (Head of Search & Semantic Intelligence).
* **Input**: Marcus Sterling's initial article draft.
* **Execution**:
  - Analyzes the article title, excerpt, and headings (`H2`, `H3`) for organic search intent.
  - Ensures the title length is optimized (target: 45 to 60 characters).
  - Validates meta description length (target: 120 to 155 characters).
  - Identifies 3 to 5 high-intent long-tail keywords to seamlessly integrate into section headings and introduction paragraphs.
  - Appends structured JSON-LD schema recommendations (TechArticle, Author, Publisher).
* **Output**: Enhanced SEO metadata and recommended keyword refinements returned to Marcus Sterling.

### Stage 3: Bespoke Visual Asset Generation
* **Actor**: Image Generation Pipeline (prompt authored by Marcus Sterling, validated by Elena).
* **Underlying Logic**: `generateDailyBlogImages()` in `src/lib/daily-news/image-generator.ts`.
* **Execution**:
  - Generates high-resolution editorial cover art utilizing Replicate Flux.1 Schnell, with automatic failover to Pollinations AI.
  - Enforces dark-mode palette alignment (deep obsidian `#0a0a0f`, neon cyan `#00f5a0`, royal purple `#8b5cf6`).
  - Generates responsive aspect ratios (16:9 for article header, 1.91:1 for OpenGraph and LinkedIn).
  - Uploads generated assets to Supabase Storage bucket with unique timestamped keys.

### Stage 4: Technical & Core Web Vitals Audit (David Chen)
* **Actor**: David Chen (Site Reliability Sentinel).
* **Input**: Draft content with embedded cover and section image URLs.
* **Execution**:
  - Verifies image dimensions and explicit aspect ratio attributes to prevent Cumulative Layout Shift (CLS).
  - Inspects code block syntax highlighting to ensure no malformed tags or render-blocking scripts.
  - Simulates mobile DOM rendering impact to ensure First Contentful Paint (FCP) remains under 800ms.
  - Flags any broken external reference links or missing alt tags.

### Stage 5: Executive Synthesis & Proposal Packaging (Alex Vance)
* **Actor**: Alex Vance (Chief of Staff).
* **Input**: Verified draft with SEO enhancements and infrastructure clearance.
* **Execution**:
  - Compiles the final article payload into `chief_content_drafts` and `company_proposals`.
  - Records a proposal in `company_proposals` with type `publish_content`.
  - Prepares an executive briefing for Prince:
    - Title and topic overview.
    - SEO search intent and expected traffic impact.
    - Performance audit pass status (100% CWV verified).
    - LinkedIn companion post preview.
  - Dispatches an administrative push notification (`sendPushToAllAdmins`) and in-app badge to alert Prince.

### Stage 6: Executive Approval Gate (Prince - CEO)
* **Actor**: Prince (CEO).
* **Interface**: `/admin/approvals` or AI Company CEO Approval Gate tab.
* **Action**:
  - Prince reviews the article preview, cover art, and LinkedIn snippet.
  - Prince clicks "Approve & Publish" or submits edit requests.
  - If rejected, Marcus Sterling receives Prince's feedback into his personal memory and revises the draft.

### Stage 7: Automated Dual-Channel Publishing
* **Trigger**: Immediate upon Prince's approval.
* **Underlying Logic**:
  - Creates the live database record in `posts` via `createPost()` (`src/lib/admin-db.ts`).
  - Calls `publishArticleToLinkedIn()` (`src/lib/linkedin/client.ts`) to post the companion summary and live link to Prince's LinkedIn profile.
  - Logs success into `daily_news_runs` and updates Marcus Sterling's performance metrics (`proposals_approved + 1`).

---

## 3. Preserved Infrastructure and Contracts

To ensure uninterrupted operation, the following existing files and contracts remain untouched:
1. `src/lib/daily-news/types.ts`: All data models (`DailyNewsRunRecord`, `OrchestrationResult`, `DailyNewsItem`) remain identical.
2. `src/lib/daily-news/db.ts`: Database queries (`createDailyRun`, `updateDailyRun`, `getDailyNewsSettings`) continue operating without schema modification.
3. `src/lib/linkedin/client.ts`: OAuth token refreshing, URN resolution, and LinkedIn REST API calls remain unchanged.
4. `src/app/api/cron/daily-news/route.ts`: Remains the designated endpoint triggered by Vercel Cron at 9:00 AM IST.

---

## 4. Fallback Safety Nets and Self-Healing

1. **AI Model Downtime Fallback**: If Gemini 2.5 Flash encounters rate limits or upstream timeouts, the system falls back to secondary keys or cached research outlines.
2. **Image Generation Fallback**: If Replicate API is unavailable, `generateDynamicEditorialImageFallback()` instantly synthesizes an SVG-based gradient editorial graphic to ensure publishing never stalls.
3. **Approval Expiration**: If Prince does not act on a proposal within 7 days, the proposal expires gracefully without impacting system health.
