# Technology Stack Architecture

## 1. Verified Core Technologies

| Category | Technology | Version | Location / Config | Rationale & Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js** (App Router) | `16.3.8` | `package.json` | React 19 Server Components, SSR, static generation, streaming HTML |
| **UI Library** | **React** | `19.3.0` | `package.json` | Concurrent rendering, Action hooks, transitions |
| **Language (Web)** | **TypeScript** | `^5.9.3` | `tsconfig.json` | Strict static typing across routes, models, and payloads |
| **Language (AI)** | **Python** | `3.11+ / 3.14` | `heyprince-ai-backend/` | Heavy asynchronous LLM pipelines, prompt synthesis, agent runtime |
| **AI Backend Framework**| **FastAPI** | `^0.115.0` | `requirements.txt` | Ultra-fast ASGI Python server with Pydantic validation |
| **ASGI Server** | **Uvicorn** | `^0.31.0` | `requirements.txt` | High-throughput asynchronous Python HTTP server |
| **Database** | **PostgreSQL (Supabase)**| `15+` | `src/lib/admin-db.ts` | Managed relational data, connection pooling, RLS, storage |
| **Database Clients** | `@supabase/supabase-js`, `pg`, `asyncpg` | `^2.117.2`, `^8.20.0` | `package.json`, `requirements.txt` | Direct pooled SQL queries + Supabase storage |
| **Icons & Visuals** | `lucide-react`, `react-icons` | `^1.49.0`, `^5.7.0` | `package.json` | FontAwesome 6, Feather/Lucide vector iconography |
| **Smooth Scrolling** | `lenis` | `^1.3.26` | `src/app/(frontend)/layout.tsx` | Smooth inertia kinetic scrolling across public pages |
| **Animations** | `gsap` | `^3.15.0` | `package.json` | Timeline-based interactive UI animations & cursor follower |
| **Email Relay** | `resend`, `nodemailer` | `^4.8.0`, `^10.0.16` | `package.json` | Dual email dispatch for inquiries and notifications |
| **Local LLM Engine** | **Ollama** | Native | Windows PC (RTX 4080) | Local GPU zero-cost inference (`qwen2.5:14b`, `llama3.1:8b`) |
| **Cloud LLM Engine** | **Google Gemini** | `google-genai 1.0+` | `heyprince-ai-backend` | Gemini 2.5 Flash / 1.5 Flash cloud backup |
| **Visual Generator** | **Pollinations AI** | Flux Model API | `image_generator.py` | Topic-seeded 16:9 dynamic illustration synthesis |
| **Web Push** | `web-push` | `^3.6.7` | `package.json` | VAPID browser push notifications |
| **Hosting & CDN** | **Vercel** | Edge Network | `vercel.json` | Global Anycast edge deployment and serverless cron triggers |
| **Containerization** | **Docker & Docker Compose**| `Compose v2` | `heyprince-ai-backend/` | Containerized VPS deployment for the Python service |
