# Complete Folder and File Structure

## 1. Directory Tree Overview

```
c:\Users\Prince\OneDrive\Desktop\heyprince\react-website
├── .env.example                       # Canonical template for all environment variables
├── .env.local                         # Active local credentials and API keys
├── .gitignore                         # Git exclusion rules
├── AGENTS.md                          # Next.js 16 breaking change rules & agent instructions
├── CLAUDE.md                          # Coding assistant instructions
├── next.config.mjs                    # Next.js configuration (ESM, domains, headers)
├── package.json                       # Next.js dependencies and run scripts
├── tsconfig.json                      # TypeScript compiler configuration
├── vercel.json                        # Vercel deployment and cron job configurations
│
├── assets/                            # Static SVG assets, branding logos, icons (54 files)
├── audio/                             # Ambient audio files (ambient.mp3)
├── fonts/                             # Self-hosted typography (Arboria, Futuru, Anton)
├── public/                            # Static public web assets (images, manifest, robots.txt, sitemap.xml)
│
├── heyprince-ai-backend/              # Dedicated Python FastAPI AI Service
│   ├── Dockerfile                     # Production container build definition
│   ├── docker-compose.yml             # VPS deployment orchestrator
│   ├── requirements.txt               # Python package dependencies
│   ├── .env.example                   # Python environment variable template
│   └── app/
│       ├── main.py                    # FastAPI entrypoint, CORS, lifespan, routes
│       ├── core/                      # Configuration, asyncpg pool, HMAC security
│       ├── llm/                       # Ollama client, Gemini client, LLM router, memory
│       ├── pipeline/                  # 1,500w content generator, Pollinations visual generator, proposal engine
│       ├── agents/                    # Content Researcher, Guardian, SEO Growth, Lead Scout
│       ├── api/v1/                    # Health, News, Chief, Outreach endpoints
│       └── scheduler/                 # APScheduler background automation jobs
│
├── supabase/                          # Supabase Database Migrations
│   ├── migrations/                    # SQL migration scripts (MFA, social, captcha, schema)
│   └── config.toml                    # Local Supabase CLI configuration
│
├── src/                               # Application Source Root (324 files)
│   ├── app/                           # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── (frontend)/                # Public route group (Home, Insights, Services, Contact, etc.)
│   │   ├── (payload)/admin/           # Protected admin route group (Dashboard, Posts, Approvals, etc.)
│   │   └── api/                       # Backend API route handlers (77 endpoints)
│   │       ├── admin/                 # Admin CRUD & orchestration endpoints
│   │       ├── blog/                  # Public likes, discussions endpoints
│   │       ├── captcha/               # Cryptographic challenge & verification endpoints
│   │       ├── cron/                  # Scheduled serverless triggers
│   │       └── site-settings/         # Feature flags and social link endpoints
│   │
│   ├── components/                    # Reusable React UI Components
│   │   ├── admin/                     # Admin layout, sidebar, Jarvis assistant, modals
│   │   ├── captcha/                   # Custom sliding/puzzle captcha components
│   │   ├── discussions/               # Threaded comment tree & like buttons
│   │   ├── SingleBlogPage.tsx         # 3-column responsive single blog page
│   │   ├── Header.tsx                 # Sticky navigation header & audio player
│   │   └── Footer.tsx                 # Global footer & newsletter capture
│   │
│   ├── lib/                           # Core Business Logic & Backend Services
│   │   ├── admin-db.ts                # PostgreSQL connection pool & admin auth
│   │   ├── ai-backend-client.ts       # Next.js -> Python FastAPI HMAC client
│   │   ├── cms.ts                     # Content aggregation & slug lookups
│   │   ├── chief-of-staff/            # Autonomous agent orchestrator & DB handlers
│   │   ├── daily-news/                # News aggregator, generator, and image pipeline
│   │   ├── outreach/                  # Lead scraper, verifier, proposal builder
│   │   ├── captcha/                   # Server-side HMAC token issuer and verifier
│   │   ├── discussions/               # Tree-building comments and likes DB handlers
│   │   ├── linkedin/                  # OAuth 2.0 client & article publisher
│   │   └── deduplication.ts           # Distributed locks & image hash guards
│   │
│   ├── styles/                        # CSS Style Architecture
│   │   ├── admin-custom.css           # Ultra-premium dark obsidian admin design system
│   │   ├── wp-style.css               # Public website styling, 3-column blog layout
│   │   ├── main.css                   # Bootstrap 5 layout resets
│   │   └── fonts.css                  # Font-face declarations
│   │
│   ├── types/                         # TypeScript Type Definitions
│   │   └── index.ts                   # Article, Service, Lead, and Agent interfaces
│   │
│   └── scripts/                       # Database Migration & Testing CLI Utilities
│       ├── seed.ts                    # Initial seed for posts and admin users
│       ├── migrate-captcha.ts         # Captcha schema migrator
│       └── test-*-suite.ts            # Integration test suites for outreach, news, etc.
```

---

## 2. Directory Purpose and Classification

| Directory | Classification | Purpose | Primary Consumers |
| :--- | :--- | :--- | :--- |
| `src/app/(frontend)` | **Frontend** | Public-facing pages (Home, About, Contact, Services, Blog) | Web visitors, search crawlers |
| `src/app/(payload)/admin` | **Frontend / Admin** | Protected admin dashboard pages, tables, and inspection views | Authenticated admins |
| `src/app/api` | **Backend** | 77 serverless API routes handling CRUD, auth, webhooks, crons | Frontend components, Vercel cron |
| `src/components` | **Frontend** | Modular UI components, dialogs, forms, interactive widgets | App router pages |
| `src/lib` | **Backend / Shared** | Database clients, crypto helpers, business logic, orchestrators | API routes, server components |
| `src/styles` | **Frontend** | Global typography, layout rules, animations, theme variables | All pages and components |
| `heyprince-ai-backend` | **Dedicated AI Backend** | Python FastAPI container running local GPU inference, agents, jobs | Next.js API (`ai-backend-client.ts`) |
| `supabase/migrations` | **Database / Infra** | PostgreSQL DDL definitions, RLS policies, tables | Supabase instance |
