# Complete API Inventory (82 Endpoints)

| Method | Endpoint | Source File | Auth Required | DB Dependencies | External Services |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/approvals` | `src/app/api/admin/approvals/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API, Email/SMTP/Resend |
| `POST` | `/api/admin/approvals/publish` | `src/app/api/admin/approvals/publish/route.ts` | Yes (Admin Cookie / HMAC) | chief_content_drafts | LinkedIn API, Email/SMTP/Resend |
| `POST` | `/api/admin/approvals/refine` | `src/app/api/admin/approvals/refine/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `GET, POST, DELETE` | `/api/admin/categories` | `src/app/api/admin/categories/route.ts` | Yes (Admin Cookie / HMAC) | categories | None |
| `PUT, DELETE` | `/api/admin/categories/[id]` | `src/app/api/admin/categories/[id]/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/admin/chief-of-staff/agent-toggle` | `src/app/api/admin/chief-of-staff/agent-toggle/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `POST, DELETE` | `/api/admin/chief-of-staff/approve-draft` | `src/app/api/admin/chief-of-staff/approve-draft/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API, Email/SMTP/Resend |
| `POST` | `/api/admin/chief-of-staff/refine-draft` | `src/app/api/admin/chief-of-staff/refine-draft/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `POST` | `/api/admin/chief-of-staff/resolve-seo` | `src/app/api/admin/chief-of-staff/resolve-seo/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `POST` | `/api/admin/chief-of-staff/run-task` | `src/app/api/admin/chief-of-staff/run-task/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `GET` | `/api/admin/chief-of-staff/status` | `src/app/api/admin/chief-of-staff/status/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET` | `/api/admin/email-status` | `src/app/api/admin/email-status/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `POST` | `/api/admin/jarvis` | `src/app/api/admin/jarvis/route.ts` | Yes (Admin Cookie / HMAC) | users, categories, media, posts | LinkedIn API, Email/SMTP/Resend |
| `GET, POST` | `/api/admin/jarvis/global-intelligence` | `src/app/api/admin/jarvis/global-intelligence/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST` | `/api/admin/jarvis/memory` | `src/app/api/admin/jarvis/memory/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, DELETE` | `/api/admin/leads` | `src/app/api/admin/leads/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `PATCH, DELETE` | `/api/admin/leads/[id]` | `src/app/api/admin/leads/[id]/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET` | `/api/admin/linkedin/connect` | `src/app/api/admin/linkedin/connect/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API, Email/SMTP/Resend |
| `POST` | `/api/admin/linkedin/disconnect` | `src/app/api/admin/linkedin/disconnect/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API |
| `POST` | `/api/admin/linkedin/publish` | `src/app/api/admin/linkedin/publish/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API |
| `GET` | `/api/admin/linkedin/status` | `src/app/api/admin/linkedin/status/route.ts` | Yes (Admin Cookie / HMAC) | posts | LinkedIn API |
| `POST` | `/api/admin/linkedin/update-urn` | `src/app/api/admin/linkedin/update-urn/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API |
| `POST` | `/api/admin/login` | `src/app/api/admin/login/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `POST` | `/api/admin/logout` | `src/app/api/admin/logout/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST, DELETE` | `/api/admin/media` | `src/app/api/admin/media/route.ts` | Yes (Admin Cookie / HMAC) | media | None |
| `DELETE` | `/api/admin/media/[id]` | `src/app/api/admin/media/[id]/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/admin/mfa/disable` | `src/app/api/admin/mfa/disable/route.ts` | Yes (Admin Cookie / HMAC) | users | None |
| `POST` | `/api/admin/mfa/send-email-otp` | `src/app/api/admin/mfa/send-email-otp/route.ts` | Public | None | Email/SMTP/Resend |
| `POST` | `/api/admin/mfa/setup` | `src/app/api/admin/mfa/setup/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `GET` | `/api/admin/mfa/status` | `src/app/api/admin/mfa/status/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/admin/mfa/verify-login` | `src/app/api/admin/mfa/verify-login/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `POST` | `/api/admin/mfa/verify-setup` | `src/app/api/admin/mfa/verify-setup/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/admin/news-automation/preview` | `src/app/api/admin/news-automation/preview/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/admin/news-automation/publish-draft` | `src/app/api/admin/news-automation/publish-draft/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/admin/news-automation/retry-linkedin` | `src/app/api/admin/news-automation/retry-linkedin/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API |
| `POST` | `/api/admin/news-automation/run` | `src/app/api/admin/news-automation/run/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `DELETE` | `/api/admin/news-automation/runs` | `src/app/api/admin/news-automation/runs/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST` | `/api/admin/news-automation/settings` | `src/app/api/admin/news-automation/settings/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST, PATCH, DELETE` | `/api/admin/news-automation/sources` | `src/app/api/admin/news-automation/sources/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET` | `/api/admin/news-automation/status` | `src/app/api/admin/news-automation/status/route.ts` | Yes (Admin Cookie / HMAC) | daily_news_runs | LinkedIn API |
| `POST` | `/api/admin/outreach/ai-analyze` | `src/app/api/admin/outreach/ai-analyze/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/admin/outreach/audit` | `src/app/api/admin/outreach/audit/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `GET, DELETE` | `/api/admin/outreach/businesses` | `src/app/api/admin/outreach/businesses/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST, PATCH` | `/api/admin/outreach/businesses/[id]` | `src/app/api/admin/outreach/businesses/[id]/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `GET` | `/api/admin/outreach/contacts` | `src/app/api/admin/outreach/contacts/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST` | `/api/admin/outreach/discovery` | `src/app/api/admin/outreach/discovery/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST` | `/api/admin/outreach/queue` | `src/app/api/admin/outreach/queue/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `GET, POST` | `/api/admin/outreach/scout` | `src/app/api/admin/outreach/scout/route.ts` | Yes (Admin Cookie / HMAC) | chief_content_drafts | None |
| `GET, PATCH` | `/api/admin/outreach/settings` | `src/app/api/admin/outreach/settings/route.ts` | Yes (Admin Cookie / HMAC) | None | Google Gemini, Email/SMTP/Resend |
| `GET, POST` | `/api/admin/outreach/suppressions` | `src/app/api/admin/outreach/suppressions/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `GET, POST, DELETE` | `/api/admin/posts` | `src/app/api/admin/posts/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, PUT, DELETE` | `/api/admin/posts/[id]` | `src/app/api/admin/posts/[id]/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/admin/push/subscribe` | `src/app/api/admin/push/subscribe/route.ts` | Yes (Admin Cookie / HMAC) | None | Email/SMTP/Resend |
| `POST` | `/api/admin/push/test` | `src/app/api/admin/push/test/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET` | `/api/admin/push/vapid-public-key` | `src/app/api/admin/push/vapid-public-key/route.ts` | Public | None | None |
| `GET, POST, DELETE` | `/api/admin/services` | `src/app/api/admin/services/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, PUT, DELETE` | `/api/admin/services/[id]` | `src/app/api/admin/services/[id]/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST` | `/api/admin/settings/social-links` | `src/app/api/admin/settings/social-links/route.ts` | Yes (Admin Cookie / HMAC) | media | None |
| `GET, POST` | `/api/admin/settings/visibility` | `src/app/api/admin/settings/visibility/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST, DELETE` | `/api/admin/users` | `src/app/api/admin/users/route.ts` | Yes (Admin Cookie / HMAC) | users | Email/SMTP/Resend |
| `GET, PUT, DELETE` | `/api/admin/users/[id]` | `src/app/api/admin/users/[id]/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET` | `/api/author` | `src/app/api/author/route.ts` | Yes (Admin Cookie / HMAC) | media, users | Email/SMTP/Resend |
| `GET, POST` | `/api/blog/comments` | `src/app/api/blog/comments/route.ts` | Yes (Admin Cookie / HMAC) | discussions | Email/SMTP/Resend |
| `POST` | `/api/blog/comments/like` | `src/app/api/blog/comments/like/route.ts` | Public | discussions | None |
| `GET, POST` | `/api/blog/likes` | `src/app/api/blog/likes/route.ts` | Public | discussions | None |
| `POST, OPTIONS` | `/api/captcha/challenge` | `src/app/api/captcha/challenge/route.ts` | Public | None | None |
| `POST, OPTIONS` | `/api/captcha/verify` | `src/app/api/captcha/verify/route.ts` | Public | None | None |
| `GET, POST` | `/api/cron/chief-of-staff` | `src/app/api/cron/chief-of-staff/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `GET, POST` | `/api/cron/daily-news` | `src/app/api/cron/daily-news/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API |
| `GET, POST` | `/api/cron/lead-scout` | `src/app/api/cron/lead-scout/route.ts` | Yes (Admin Cookie / HMAC) | None | None |
| `POST` | `/api/leads` | `src/app/api/leads/route.ts` | Public | None | None |
| `GET` | `/api/linkedin/callback` | `src/app/api/linkedin/callback/route.ts` | Yes (Admin Cookie / HMAC) | None | LinkedIn API |
| `GET, POST` | `/api/outreach/unsubscribe` | `src/app/api/outreach/unsubscribe/route.ts` | Public | media | Email/SMTP/Resend |
| `GET` | `/api/seasonal/current` | `src/app/api/seasonal/current/route.ts` | Public | None | None |
| `GET` | `/api/services` | `src/app/api/services/route.ts` | Public | categories | None |
| `GET` | `/api/site-settings/visibility` | `src/app/api/site-settings/visibility/route.ts` | Public | None | None |
| `GET` | `/api/social-links` | `src/app/api/social-links/route.ts` | Public | None | None |
| `POST` | `[Python] /api/v1/chief/run-agent` | `heyprince-ai-backend/app/api/v1/chief.py` | Yes (Admin Cookie / HMAC) | Supabase PostgreSQL Pool | Ollama PC, Gemini Cloud, Pollinations AI |
| `GET` | `[Python] /api/v1/health` | `heyprince-ai-backend/app/api/v1/health.py` | Public | Supabase PostgreSQL Pool | Ollama PC, Gemini Cloud, Pollinations AI |
| `POST` | `[Python] /api/v1/news/generate` | `heyprince-ai-backend/app/api/v1/news.py` | Yes (Admin Cookie / HMAC) | Supabase PostgreSQL Pool | Ollama PC, Gemini Cloud, Pollinations AI |
| `POST` | `[Python] /api/v1/news/preview` | `heyprince-ai-backend/app/api/v1/news.py` | Yes (Admin Cookie / HMAC) | Supabase PostgreSQL Pool | Ollama PC, Gemini Cloud, Pollinations AI |
| `POST` | `[Python] /api/v1/outreach/generate-proposal` | `heyprince-ai-backend/app/api/v1/outreach.py` | Yes (Admin Cookie / HMAC) | Supabase PostgreSQL Pool | Ollama PC, Gemini Cloud, Pollinations AI |
