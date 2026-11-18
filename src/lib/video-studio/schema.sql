-- ============================================================================
-- HeyPrince AI Video Studio Database Schema
-- Advanced Video Generation, Hindi Voiceover, English Subtitles & R2 Retention
-- ============================================================================

-- 1. Video Studio Settings Table
CREATE TABLE IF NOT EXISTS video_studio_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_published_videos INTEGER NOT NULL DEFAULT 5,
  default_narration_lang VARCHAR(20) NOT NULL DEFAULT 'hi-IN',
  default_subtitle_lang VARCHAR(20) NOT NULL DEFAULT 'en-US',
  voice_provider VARCHAR(50) NOT NULL DEFAULT 'google_tts',
  voice_id VARCHAR(100) NOT NULL DEFAULT 'hi-IN-Neural2-A',
  voice_speed NUMERIC NOT NULL DEFAULT 1.0,
  video_provider VARCHAR(50) NOT NULL DEFAULT 'veo_flow_hybrid',
  burn_subtitles BOOLEAN NOT NULL DEFAULT TRUE,
  render_fps INTEGER NOT NULL DEFAULT 30,
  aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9',
  daily_schedule_cron VARCHAR(50) NOT NULL DEFAULT '0 10 * * *',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed default settings row if not present
INSERT INTO video_studio_settings (id, max_published_videos)
VALUES ('default', 5)
ON CONFLICT (id) DO NOTHING;

-- 2. Video Studio Jobs Table
CREATE TABLE IF NOT EXISTS video_studio_jobs (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  current_step VARCHAR(100) NOT NULL DEFAULT 'queued',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  
  -- Language and voiceover configurations
  language_settings JSONB NOT NULL DEFAULT '{"narration": "hi-IN", "subtitles": "en-US", "metadata": "en-US"}'::jsonb,
  script_payload JSONB DEFAULT NULL,
  storyboard JSONB DEFAULT NULL,
  voiceover_config JSONB DEFAULT NULL,
  
  -- Assets and generated artifacts
  voiceover_assets JSONB DEFAULT NULL,
  subtitle_assets JSONB DEFAULT NULL,
  visual_assets JSONB DEFAULT NULL,
  thumbnail_url VARCHAR(1000) DEFAULT NULL,
  rendered_video_url VARCHAR(1000) DEFAULT NULL,
  
  -- Cloudflare R2 storage footprint & retention tracking
  r2_video_url VARCHAR(1000) DEFAULT NULL,
  r2_video_key VARCHAR(500) DEFAULT NULL,
  r2_asset_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  r2_retained BOOLEAN NOT NULL DEFAULT TRUE,
  r2_deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  r2_total_bytes BIGINT NOT NULL DEFAULT 0,
  
  -- YouTube publication state
  youtube_video_id VARCHAR(100) DEFAULT NULL,
  youtube_video_url VARCHAR(500) DEFAULT NULL,
  youtube_publish_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Quality checks and resilience
  quality_report JSONB DEFAULT NULL,
  quality_passed BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT DEFAULT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  
  -- Associations and timestamps
  post_id INTEGER DEFAULT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance and retention querying
CREATE INDEX IF NOT EXISTS idx_video_studio_jobs_status ON video_studio_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_studio_jobs_published_at ON video_studio_jobs(published_at);
CREATE INDEX IF NOT EXISTS idx_video_studio_jobs_r2_retained ON video_studio_jobs(r2_retained, youtube_publish_status);
CREATE INDEX IF NOT EXISTS idx_video_studio_jobs_created_at ON video_studio_jobs(created_at DESC);

-- 3. Video Studio Retention Logs Table
CREATE TABLE IF NOT EXISTS video_studio_retention_logs (
  id SERIAL PRIMARY KEY,
  triggering_job_id VARCHAR(100) NOT NULL,
  pruned_job_id VARCHAR(100) NOT NULL,
  pruned_video_title VARCHAR(500) NOT NULL,
  objects_deleted JSONB NOT NULL DEFAULT '[]'::jsonb,
  bytes_freed BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_studio_retention_created ON video_studio_retention_logs(created_at DESC);
