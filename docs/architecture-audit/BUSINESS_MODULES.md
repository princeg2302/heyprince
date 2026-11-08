# Core Business Modules

## 1. Technical Insights & Content Publishing
* **User Experience**: High-readability technical blog with Table of Contents scroll-spy, reading progress indicator, dynamic social sharing, and related article links.
* **Admin Capabilities**: Full article CRUD, rich-text / markdown rendering, category tagging, cover image selector, and 1-click publishing to LinkedIn.
* **Tables**: `posts`, `categories`, `posts_sections`, `posts_tags`.

## 2. Live Discussions & Threaded Community
* **Features**: Google-crawlable SSR comments rendered directly into HTML on page load for maximal SEO indexing. Nested reply trees, live like counters, and honeypot spam protection.
* **Tables**: `blog_comments`, `blog_likes`, `comment_likes`, `discussion_rate_limits`.

## 3. Daily AI News & Thought Leadership Automation
* **Features**: Monitors curated technology RSS feeds (Ars Technica, Hacker News, MIT Tech Review), synthesizes 1,500+ word structured deep-dives with Pollinations AI illustrations, and places drafts in `/admin/approvals/`.
* **Tables**: `daily_news_settings`, `daily_news_sources`, `daily_news_items`, `daily_news_runs`.

## 4. AI Chief of Staff & Site Governance
* **Features**: Orchestrates autonomous background agents that audit site health, test route latencies, discover keyword opportunities, and prepare service offerings.
* **Tables**: `chief_agents`, `chief_content_drafts`, `chief_tasks`, `chief_activity_logs`.

## 5. Lead Intelligence & B2B Outreach
* **Features**: Scrapes business domains in target technology hubs using OpenStreetMap Overpass, validates DNS/HTTPS connectivity, and drafts tailored website audit pitches for cold outreach.
* **Tables**: `client_leads`, `campaigns`, `email_messages`, `outreach_settings`.

## 6. Custom HMAC Captcha Security Engine
* **Features**: Zero-third-party security service running on Next.js + Supabase. Generates mathematical cryptographic puzzles signed with HMAC-SHA256, eliminating third-party tracking scripts.
* **Tables**: `captcha_sites`, `captcha_challenges`, `captcha_proofs`, `captcha_rate_limits`.
