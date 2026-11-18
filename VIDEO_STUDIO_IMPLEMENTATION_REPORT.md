# HeyPrince AI Video Studio: Implementation Report

## Executive Summary

The HeyPrince AI Video Studio is an enterprise-grade autonomous video generation system integrated directly into the HeyPrince platform. It automates end-to-end production of cinematic tech insight videos featuring natural spoken Hindi voiceover, synchronized English subtitles, multi-engine visual rendering (Google Veo, Remotion, and Canvas/SVG), a 10-point quality assurance gate, Cloudflare R2 storage management with strict retention limits (maximum 5 published videos), and automated YouTube publishing.

The studio extends the existing HeyPrince AI Company and Chief of Staff architecture. It leverages the Content & Research Agent for topic research and scripting, the SEO Agent for metadata optimization, and the Website Guardian for health monitoring without creating duplicate agents, workflows, or redundant coordinators.

---

## Architecture Overview

The system is built upon a 12-stage persistent asynchronous state machine backed by PostgreSQL:

```
[queued] -> [researching] -> [scripting] -> [storyboarding] ->
[generating_visuals] -> [generating_voiceover] -> [subtitle_generation] ->
[rendering] -> [quality_check] -> [uploading_to_r2] ->
[publishing_to_youtube] -> [published]
```

### Persistence and Concurrency

* **State Persistence**: Job state transitions, storyboard scenes, quality reports, and media asset keys are recorded in PostgreSQL at each stage.
* **Worker Resilience**: Long-running generation jobs continue in the background regardless of whether the admin browser is open or closed, and can resume or be retried across backend restarts.
* **Concurrency Locking**: Unless parallel generation is explicitly enabled in settings, the studio enforces a sequential lock: only one active video production job may run at a time to prevent CPU, memory, and API quota contention.

---

## Google Flow vs Google Veo Investigation

### Findings

1. **Google Flow**: Google Flow is an internal DeepMind experimental creative web interface for storyboard curation and human-in-the-loop creative direction. It does not provide an officially supported public REST or gRPC API. Using unofficial browser scraping or brittle automation against web interfaces is strictly prohibited as it violates production stability standards.
2. **Google Veo**: Google Veo 2.0 (`models/veo-2.0-generate-001`) is the official, programmatically supported generative video capability provided by Google Gen AI and Vertex AI developer platforms.

### Provider Adapter Pattern

The visual generation subsystem utilizes an extensible adapter pattern (`VisualSceneProvider`):

* **Google Veo Provider (`GoogleVeoProvider`)**: Connects to the official Google Gen AI platform for cinematic AI video clips. Implements exponential backoff retry.
* **Remotion Provider (`RemotionProvider`)**: Programmatic vector motion graphics engine. Generates animated tech architecture diagrams, glowing neural network meshes, and code walkthrough sequences with zero external network dependencies.
* **Canvas/SVG Provider (`CanvasSvgMotionProvider`)**: Pure code vector chart and technical topology generator. Renders benchmark bar charts, system topologies, and animated flow graphs.
* **Hybrid Visual Dispatcher (`HybridVisualDispatcher`)**: Intelligently routes each storyboard scene to the optimal engine based on content intent. If Google Veo is unavailable or quota is exceeded, the dispatcher gracefully falls back to Remotion and Canvas/SVG motion graphics with backoff. The pipeline never silently degrades a video into static slides.

---

## Hindi Voiceover and English Subtitle Pipeline

### 1. Spoken Hindi Script Generation

* Scripts are authored in natural, idiomatic spoken Hindi using Devanagari script, avoiding literal translations and unnatural phrasing.
* Scripts are split into scene-level segments with target durations between 4 and 8 seconds.

### 2. Multi-Provider Hindi Voiceover

* **Primary Engine**: Google Cloud Text-to-Speech using neural voices (such as `hi-IN-Neural2-A`, `hi-IN-Standard-D`).
* **Fallback Engines**: OpenAI TTS (`alloy`), ElevenLabs multilingual TTS, and an autonomous procedural audio synthesizer that generates valid RIFF WAVE audio streams.
* **Duration Measurement**: Exact millisecond audio durations are calculated for every scene segment to ensure millisecond-accurate subtitle alignment.

### 3. Synchronized English Subtitles

* Generates compliant SubRip (`.srt`) and WebVTT (`.vtt`) subtitle files.
* Every Hindi narration segment has an accurate, contextual English translation.
* Subtitle start and end timestamps match measured audio durations exactly, with an enforced maximum drift tolerance of 1000 milliseconds.

---

## Mandatory 10-Point Quality Assurance Gate

Before any video can be published to YouTube or accepted into the retention pool, it must pass a mandatory 10-point QA checklist (`runMandatoryQualityChecks`):

| # | Check Name | Critical | Description |
|---|------------|----------|-------------|
| 1 | Storyboard Scene Coverage | Yes | Every storyboard scene has a corresponding rendered video clip. |
| 2 | No Missing or Black Frames | Yes | Verifies non-zero frame counts and continuous motion frames. |
| 3 | No Missing Voice Segments | Yes | Every scene has an active voiceover track with non-empty text. |
| 4 | No Corrupted Media Assets | Yes | Verifies video buffer integrity and non-empty byte streams. |
| 5 | Subtitle Synchronization | Yes | Validates that subtitle timecodes align with audio duration within tolerance. |
| 6 | Audio-Video Duration Alignment | Yes | Verifies that total scene visual duration matches audio duration within 2.5s. |
| 7 | Resolution and Aspect Ratio | Yes | Validates 1920x1080 (16:9) landscape or 1080x1920 (9:16) vertical. |
| 8 | High-Resolution Thumbnail | No | Verifies presence of a dedicated custom thumbnail. |
| 9 | FFmpeg Container Decodability | Yes | Validates container headers (ftyp, moov) and H.264 stream structure. |
| 10 | R2 Upload & Retrieval | Yes | Verifies that the video object exists and can be retrieved from Cloudflare R2. |

A failure on any critical check immediately halts the pipeline, marks the job as `failed`, records the exact reason in the database, and prevents YouTube publication.

---

## Cloudflare R2 Retention: Maximum 5 Published Videos

### Retention Specification (`R2_MAX_PUBLISHED_VIDEOS = 5`)

To optimize cloud storage costs while preserving recent high-quality video assets, the studio enforces a strict retention policy:

1. **Active Pool**: Cloudflare R2 maintains media asset collections for at most the 5 most recently successfully published videos.
2. **Trigger Condition**: When a 6th video is successfully published to YouTube, the retention engine executes transactionally:
   * **Safety Guard 1**: Verifies confirmed YouTube upload and public watch URL.
   * **Safety Guard 2**: Verifies the new video R2 asset collection is intact.
   * **Oldest Selection**: Identifies the oldest published video with `r2_retained = true`.
   * **Media Pruning**: Deletes associated media objects from Cloudflare R2 (MP4 video, audio tracks, subtitle files, thumbnails, scene clips).
   * **Database Preservation**: Marks the pruned record as `r2_retained = false` and `r2_deleted_at = NOW()`.
   * **Permanent History**: Retains the database record, Hindi script, English translation, SEO metadata, YouTube video ID, watch URL, analytics, and audit log forever.
   * **Audit Logging**: Logs the cleanup action in `video_studio_retention_logs`.
3. **Failure Isolation**: If YouTube publishing or R2 verification fails, retention cleanup is never executed, ensuring zero premature asset deletion.

---

## Storage Dashboard Panel

Located in the Admin UI at `/admin/video-studio/`, the Storage Dashboard displays:

* **R2 Storage Used**: Total bytes consumed by retained Video Studio assets.
* **Retained Collections**: Current count versus maximum limit (e.g. 5 / 5).
* **Estimated Storage Per Video**: Average byte size across video, audio, and subtitle files.
* **Oldest Retained Video**: Title, publication date, and byte size of the oldest active video.
* **Last Cleanup Execution**: Timestamp, pruned video title, and bytes reclaimed.
* **Failed Cleanup Tasks**: Count of any incomplete pruning operations requiring retry.
* **Storage Warning Banner**: Dynamically alerts administrators when storage growth exceeds thresholds.
* **Manual Enforcement**: Button to trigger on-demand retention policy evaluation.

---

## Database Schema

Three dedicated PostgreSQL tables support the Video Studio:

1. `video_studio_settings`: Global configuration (retention limit, default voice, provider, aspect ratio, parallel job policy).
2. `video_studio_jobs`: Full job lifecycle records (state, script payload, storyboard scenes, quality report, R2 asset keys, YouTube publication details).
3. `video_studio_retention_logs`: Transactional audit history of every media pruning event.

---

## Component Inventory

* `src/lib/video-studio/schema.sql`: PostgreSQL database schema with indexes.
* `src/scripts/migrate-video-studio.ts`: Database migration script.
* `src/lib/video-studio/types.ts`: TypeScript interfaces for jobs, scenes, QA, and retention.
* `src/lib/video-studio/db.ts`: Data access layer for jobs, settings, and metrics.
* `src/lib/video-studio/providers/adapter.ts`: Provider contract interfaces.
* `src/lib/video-studio/providers/veo-provider.ts`: Google Veo 2.0 integration adapter.
* `src/lib/video-studio/providers/remotion-provider.ts`: Remotion programmatic vector graphics engine.
* `src/lib/video-studio/providers/canvas-svg-provider.ts`: SVG/Canvas diagram animator.
* `src/lib/video-studio/providers/hybrid-dispatcher.ts`: Dynamic multi-engine scene router.
* `src/lib/video-studio/providers/tts-provider.ts`: Hindi voiceover synthesizer.
* `src/lib/video-studio/subtitles.ts`: Synchronized English SRT and WebVTT generator.
* `src/lib/video-studio/quality-checker.ts`: 10-point mandatory QA validator.
* `src/lib/video-studio/retention.ts`: Cloudflare R2 retention engine.
* `src/lib/video-studio/youtube.ts`: YouTube Data API v3 publisher.
* `src/lib/video-studio/orchestrator.ts`: 12-stage state machine orchestrator.
* `src/app/api/admin/video-studio/jobs/route.ts`: List and create video jobs.
* `src/app/api/admin/video-studio/jobs/[id]/route.ts`: Job inspection and retry.
* `src/app/api/admin/video-studio/storage/route.ts`: Storage metrics and manual retention trigger.
* `src/app/api/admin/video-studio/settings/route.ts`: Studio configuration management.
* `src/app/(payload)/admin/video-studio/page.tsx`: Admin page server component.
* `src/app/(payload)/admin/video-studio/VideoStudioClient.tsx`: Admin dashboard UI.
* `src/scripts/test-video-studio-suite.ts`: Comprehensive 43-test end-to-end verification suite.
