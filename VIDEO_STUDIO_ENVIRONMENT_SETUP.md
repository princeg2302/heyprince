# HeyPrince AI Video Studio: Environment Setup Guide

This guide documents the configuration, environment variables, credentials, and deployment steps required to operate the HeyPrince AI Video Studio.

---

## Environment Variables Reference

Add these keys to your `.env.local` file for local development and to your Vercel Project Settings for production deployment.

### 1. Database Configuration (PostgreSQL / Supabase / Neon)

```env
# PostgreSQL connection string with SSL enabled
POSTGRES_URL=postgresql://user:password@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require
DATABASE_URL=postgresql://user:password@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require
```

### 2. Cloudflare R2 Object Storage

Cloudflare R2 provides S3-compatible persistent storage for video files, scene clips, voiceover tracks, subtitles, and thumbnails.

```env
# Cloudflare R2 credentials
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=heyprince-media-vault
R2_PUBLIC_BASE_URL=https://cdn.heyprince.in
R2_S3_ENDPOINT=https://<your_account_id>.r2.cloudflarestorage.com

# Video Studio Retention Policy (maximum retained published videos in R2)
R2_MAX_PUBLISHED_VIDEOS=5
```

### 3. Google Veo & Generative AI

Official Google Gen AI platform credentials for Google Veo 2.0 (`veo-2.0-generate-001`).

```env
# Google Gen AI / Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Dedicated Google Veo configuration (optional, falls back to GEMINI_API_KEY)
GOOGLE_VEO_API_KEY=your_google_veo_api_key
GOOGLE_VEO_MODEL=veo-2.0-generate-001

# Enable/disable Google Veo provider (default: true)
ENABLE_GOOGLE_VEO=true
```

> **Note on Google Flow**: Google Flow is an experimental creative web application prototype by DeepMind without a public REST or gRPC API. The studio integrates with Google Veo 2.0 through Google's official developer API. If Veo is unavailable on your key tier, the studio gracefully routes to Remotion and Canvas/SVG motion graphics with exponential backoff.

### 4. Hindi Voiceover Text-to-Speech (TTS)

```env
# Google Cloud Text-to-Speech (Primary engine for Hindi neural voices)
GOOGLE_TTS_API_KEY=your_google_tts_api_key

# Default Hindi Voice Configuration
VIDEO_STUDIO_DEFAULT_VOICE_ID=hi-IN-Neural2-A
VIDEO_STUDIO_DEFAULT_VOICE_LANG=hi-IN

# Alternative TTS Providers (Optional fallbacks)
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 5. YouTube Data API v3 (Automated Publishing)

```env
# YouTube OAuth credentials for automated upload
YOUTUBE_CLIENT_ID=your_youtube_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token
YOUTUBE_CHANNEL_ID=your_youtube_channel_id
```

### 6. WhatsApp Channel Publishing (Whapi Gateway)

```env
# Automated WhatsApp Channel broadcasting via Whapi
WHATSAPP_ACCESS_TOKEN=jvlMpm1lNDqlFElt0DZGkyVyqFt6qsa4
WHATSAPP_CHANNEL_ID=120363432552165518@newsletter
WHATSAPP_API_PROVIDER=whapi
WHATSAPP_GATEWAY_URL=https://gate.whapi.cloud
```

---

## Database Migration

Run the migration script to provision the Video Studio tables:

```bash
npm run migrate:video
```

This creates the following tables:
* `video_studio_settings`: Global studio settings.
* `video_studio_jobs`: Full job lifecycle and state machine records.
* `video_studio_retention_logs`: Transactional R2 media pruning audit log.

---

## Running the Verification Test Suite

Execute the comprehensive 43-point test suite:

```bash
npm run test:video
```

The test suite validates:
1. Google Veo adapter, Remotion motion graphics engine, and Canvas/SVG diagram animator.
2. Hindi neural voiceover synthesis and exact millisecond duration measurement.
3. Synchronized English SRT and WebVTT subtitle formatting.
4. 10-point mandatory QA checklist (verifying passing payloads and deliberate failure blocks).
5. End-to-end sample video generation with PostgreSQL state persistence.
6. Cloudflare R2 retention policy with 6 sequential published videos (confirming exactly 5 collections remain in R2, Video #1 is pruned on the 6th publish, and YouTube URLs remain untouched).
7. Safety guards ensuring failed YouTube uploads never trigger media deletion.
8. Storage Dashboard capacity metrics and warning alerts.

---

## Admin Panel Access

Open your browser and navigate to:
```
https://heyprince.in/admin/video-studio/
```

### Available Features in the Dashboard:

* **Cloudflare R2 Retention & Storage Panel**: Real-time view of R2 bytes used, retained collections count, oldest video, estimated size per video, and manual retention enforcement trigger.
* **Active Pipeline Stepper**: Live 12-stage visual progress tracker for jobs currently in production.
* **Storyboard Scene Viewer**: Scene-by-scene preview of visual provider, Hindi narration, English subtitle, and clip render status.
* **Quality Assurance Report Card**: Detailed view of the 10-point checklist score and check breakdown.
* **Production History**: Filterable history of all past video generation jobs, YouTube watch links, and R2 retention states.
* **New Production Job**: Modal to trigger ad-hoc video jobs by topic or linked blog post ID.
* **Studio Settings**: Modal to adjust retention limits, voice IDs, and parallel execution policies.
