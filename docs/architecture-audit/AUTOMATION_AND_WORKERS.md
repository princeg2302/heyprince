# Automations & Background Workers

## 1. Vercel Serverless Cron Jobs (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-news",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/chief-of-staff",
      "schedule": "0 8 * * *"
    }
  ]
}
```

1. **Daily AI News Ingestion (`/api/cron/daily-news`)**:
   * **Schedule**: Daily at 06:00 UTC.
   * **Execution**: Fetches RSS feeds, checks `isImageContentDuplicate`, runs 1,500w content generation, and stores the draft in `daily_news_runs`.
   * **Security**: Enforces `Authorization: Bearer CRON_SECRET`.

2. **Chief of Staff Autonomous Sweep (`/api/cron/chief-of-staff`)**:
   * **Schedule**: Daily at 08:00 UTC.
   * **Execution**: Triggers `content_researcher` for service page blueprints, records activity in `chief_activity_logs`.
   * **Security**: Enforces `Authorization: Bearer CRON_SECRET`.

---

## 2. Python APScheduler In-Process Background Workers
Located in `heyprince-ai-backend/app/scheduler/jobs.py`:
* **Website Guardian Sweep**: Runs every 6 hours (`interval: hours=6`). Pings critical endpoints, measures HTTP latency, and detects broken routes.
* **SEO Analysis Sweep**: Runs every 24 hours (`interval: hours=24`). Identifies keyword opportunities and semantic internal linking gaps.
