# Third-Party Integrations Inventory

| Service Name | Purpose | Integration Location | Auth Method | Environment Variables | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Supabase** | Managed PostgreSQL & S3 Storage | `src/lib/admin-db.ts` | API Key & JWT | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | **Active** |
| **Google Gemini API** | Cloud LLM Inference & Reasoning | `heyprince-ai-backend/app/llm/gemini_client.py` | Bearer API Key | `GEMINI_API_KEY` | **Active** |
| **Local Ollama** | Local GPU Model Inference | `heyprince-ai-backend/app/llm/ollama_client.py` | HTTP / Tailscale | `OLLAMA_HOST`, `OLLAMA_MODEL` | **Active** |
| **LinkedIn REST API** | Automated Social Publishing | `src/lib/linkedin/client.ts` | OAuth 2.0 Bearer Token | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | **Active** |
| **Pollinations AI** | Dynamic 16:9 Illustration Synthesis | `app/pipeline/image_generator.py` | URL Seed Protocol | None (Zero-Cost Public API) | **Active** |
| **Resend / SMTP** | Transactional Client Inquiries | `src/app/api/contact/route.ts` | API Key / SMTP Auth | `RESEND_API_KEY`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | **Active** |
| **OpenStreetMap / Overpass**| B2B Lead Scout Geographic Query | `src/lib/outreach/scraper.ts` | Public REST API | None | **Active** |
| **Google Places API** | Commercial Prospect Fallback | `src/lib/outreach/scraper.ts` | API Key | `GOOGLE_PLACES_API_KEY` | Configurable |
| **Vercel Edge Cron** | Scheduled Trigger Orchestration | `vercel.json` | Bearer CRON_SECRET | `CRON_SECRET` | **Active** |
| **Web Push (VAPID)** | Browser Notifications | `src/app/api/notifications/route.ts`| VAPID Keypair | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Configured |
