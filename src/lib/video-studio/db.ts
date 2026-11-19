import { query } from '../outreach/db';
import {
  VideoStudioJob,
  VideoStudioSettings,
  VideoStudioRetentionLog,
  StorageDashboardSummary,
  VideoJobStatus,
} from './types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function getVideoStudioSettings(): Promise<VideoStudioSettings> {
  const rows = await query<any>(
    `SELECT * FROM video_studio_settings WHERE id = 'default' LIMIT 1;`
  );

  if (rows && rows.length > 0) {
    const r = rows[0];
    const envLimit = parseInt(process.env.R2_MAX_PUBLISHED_VIDEOS || '', 10);
    return {
      id: r.id,
      isEnabled: Boolean(r.is_enabled),
      maxPublishedVideos: !isNaN(envLimit) && envLimit > 0 ? envLimit : r.max_published_videos || 5,
      defaultNarrationLang: r.default_narration_lang || 'hi-IN',
      defaultSubtitleLang: r.default_subtitle_lang || 'en-US',
      voiceProvider: r.voice_provider || 'google_tts',
      voiceId: r.voice_id || 'hi-IN-Neural2-A',
      voiceSpeed: Number(r.voice_speed) || 1.0,
      videoProvider: r.video_provider || 'veo_flow_hybrid',
      burnSubtitles: Boolean(r.burn_subtitles),
      renderFps: r.render_fps || 30,
      aspectRatio: r.aspect_ratio || '16:9',
      dailyScheduleCron: r.daily_schedule_cron || '0 10 * * *',
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  // Fallback defaults
  const envLimit = parseInt(process.env.R2_MAX_PUBLISHED_VIDEOS || '5', 10);
  return {
    id: 'default',
    isEnabled: true,
    maxPublishedVideos: isNaN(envLimit) ? 5 : envLimit,
    defaultNarrationLang: 'hi-IN',
    defaultSubtitleLang: 'en-US',
    voiceProvider: 'google_tts',
    voiceId: 'hi-IN-Neural2-A',
    voiceSpeed: 1.0,
    videoProvider: 'veo_flow_hybrid',
    burnSubtitles: true,
    renderFps: 30,
    aspectRatio: '16:9',
    dailyScheduleCron: '0 10 * * *',
    updatedAt: new Date().toISOString(),
  };
}

export async function updateVideoStudioSettings(
  partial: Partial<VideoStudioSettings>
): Promise<VideoStudioSettings> {
  const current = await getVideoStudioSettings();
  const updated: VideoStudioSettings = { ...current, ...partial, updatedAt: new Date().toISOString() };

  await query(
    `INSERT INTO video_studio_settings (
      id, is_enabled, max_published_videos, default_narration_lang, default_subtitle_lang,
      voice_provider, voice_id, voice_speed, video_provider, burn_subtitles, render_fps,
      aspect_ratio, daily_schedule_cron, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    ON CONFLICT (id) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      max_published_videos = EXCLUDED.max_published_videos,
      default_narration_lang = EXCLUDED.default_narration_lang,
      default_subtitle_lang = EXCLUDED.default_subtitle_lang,
      voice_provider = EXCLUDED.voice_provider,
      voice_id = EXCLUDED.voice_id,
      voice_speed = EXCLUDED.voice_speed,
      video_provider = EXCLUDED.video_provider,
      burn_subtitles = EXCLUDED.burn_subtitles,
      render_fps = EXCLUDED.render_fps,
      aspect_ratio = EXCLUDED.aspect_ratio,
      daily_schedule_cron = EXCLUDED.daily_schedule_cron,
      updated_at = NOW();`,
    [
      updated.id,
      updated.isEnabled,
      updated.maxPublishedVideos,
      updated.defaultNarrationLang,
      updated.defaultSubtitleLang,
      updated.voiceProvider,
      updated.voiceId,
      updated.voiceSpeed,
      updated.videoProvider,
      updated.burnSubtitles,
      updated.renderFps,
      updated.aspectRatio,
      updated.dailyScheduleCron,
    ]
  );

  return updated;
}

export function mapJobRow(r: any): VideoStudioJob {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status as VideoJobStatus,
    currentStep: r.current_step,
    progressPercent: r.progress_percent,
    languageSettings: r.language_settings || { narration: 'hi-IN', subtitles: 'en-US', metadata: 'en-US' },
    scriptPayload: r.script_payload,
    storyboard: r.storyboard,
    voiceoverConfig: r.voiceover_config,
    voiceoverAssets: r.voiceover_assets,
    subtitleAssets: r.subtitle_assets,
    visualAssets: r.visual_assets,
    thumbnailUrl: r.thumbnail_url,
    renderedVideoUrl: r.rendered_video_url,
    r2VideoUrl: r.r2_video_url,
    r2VideoKey: r.r2_video_key,
    r2AssetKeys: Array.isArray(r.r2_asset_keys) ? r.r2_asset_keys : [],
    r2Retained: Boolean(r.r2_retained),
    r2DeletedAt: r.r2_deleted_at ? new Date(r.r2_deleted_at).toISOString() : null,
    r2TotalBytes: Number(r.r2_total_bytes) || 0,
    youtubeVideoId: r.youtube_video_id,
    youtubeVideoUrl: r.youtube_video_url,
    youtubePublishStatus: r.youtube_publish_status || 'pending',
    qualityReport: r.quality_report,
    qualityPassed: Boolean(r.quality_passed),
    failureReason: r.failure_reason,
    retryCount: r.retry_count || 0,
    maxRetries: r.max_retries || 3,
    postId: r.post_id,
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

export async function createVideoJob(params: {
  id: string;
  title: string;
  slug: string;
  languageSettings?: { narration: string; subtitles: string; metadata: string };
  postId?: number;
}): Promise<VideoStudioJob> {
  const lang = params.languageSettings || { narration: 'hi-IN', subtitles: 'en-US', metadata: 'en-US' };

  const rows = await query<any>(
    `INSERT INTO video_studio_jobs (
      id, title, slug, status, current_step, progress_percent,
      language_settings, post_id, created_at, updated_at
    ) VALUES ($1, $2, $3, 'queued', 'queued', 0, $4, $5, NOW(), NOW())
    RETURNING *;`,
    [params.id, params.title, params.slug, JSON.stringify(lang), params.postId || null]
  );

  return mapJobRow(rows[0]);
}

export async function updateVideoJobStatus(
  id: string,
  updates: {
    status?: VideoJobStatus;
    currentStep?: string;
    progressPercent?: number;
    failureReason?: string | null;
    retryCount?: number;
    qualityPassed?: boolean;
    qualityReport?: any;
    publishedAt?: string | null;
  }
): Promise<void> {
  const fields: string[] = ['updated_at = NOW()'];
  const values: any[] = [id];
  let idx = 2;

  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(updates.status);
  }
  if (updates.currentStep !== undefined) {
    fields.push(`current_step = $${idx++}`);
    values.push(updates.currentStep);
  }
  if (updates.progressPercent !== undefined) {
    fields.push(`progress_percent = $${idx++}`);
    values.push(updates.progressPercent);
  }
  if (updates.failureReason !== undefined) {
    fields.push(`failure_reason = $${idx++}`);
    values.push(updates.failureReason);
  }
  if (updates.retryCount !== undefined) {
    fields.push(`retry_count = $${idx++}`);
    values.push(updates.retryCount);
  }
  if (updates.qualityPassed !== undefined) {
    fields.push(`quality_passed = $${idx++}`);
    values.push(updates.qualityPassed);
  }
  if (updates.qualityReport !== undefined) {
    fields.push(`quality_report = $${idx++}`);
    values.push(JSON.stringify(updates.qualityReport));
  }
  if (updates.publishedAt !== undefined) {
    fields.push(`published_at = $${idx++}`);
    values.push(updates.publishedAt);
  }

  await query(
    `UPDATE video_studio_jobs SET ${fields.join(', ')} WHERE id = $1;`,
    values
  );
}

export async function updateVideoJobPayload(
  id: string,
  payload: Partial<VideoStudioJob>
): Promise<void> {
  const fields: string[] = ['updated_at = NOW()'];
  const values: any[] = [id];
  let idx = 2;

  if (payload.scriptPayload !== undefined) {
    fields.push(`script_payload = $${idx++}`);
    values.push(JSON.stringify(payload.scriptPayload));
  }
  if (payload.storyboard !== undefined) {
    fields.push(`storyboard = $${idx++}`);
    values.push(JSON.stringify(payload.storyboard));
  }
  if (payload.voiceoverConfig !== undefined) {
    fields.push(`voiceover_config = $${idx++}`);
    values.push(JSON.stringify(payload.voiceoverConfig));
  }
  if (payload.voiceoverAssets !== undefined) {
    fields.push(`voiceover_assets = $${idx++}`);
    values.push(JSON.stringify(payload.voiceoverAssets));
  }
  if (payload.subtitleAssets !== undefined) {
    fields.push(`subtitle_assets = $${idx++}`);
    values.push(JSON.stringify(payload.subtitleAssets));
  }
  if (payload.visualAssets !== undefined) {
    fields.push(`visual_assets = $${idx++}`);
    values.push(JSON.stringify(payload.visualAssets));
  }
  if (payload.thumbnailUrl !== undefined) {
    fields.push(`thumbnail_url = $${idx++}`);
    values.push(payload.thumbnailUrl);
  }
  if (payload.renderedVideoUrl !== undefined) {
    fields.push(`rendered_video_url = $${idx++}`);
    values.push(payload.renderedVideoUrl);
  }
  if (payload.r2VideoUrl !== undefined) {
    fields.push(`r2_video_url = $${idx++}`);
    values.push(payload.r2VideoUrl);
  }
  if (payload.r2VideoKey !== undefined) {
    fields.push(`r2_video_key = $${idx++}`);
    values.push(payload.r2VideoKey);
  }
  if (payload.r2AssetKeys !== undefined) {
    fields.push(`r2_asset_keys = $${idx++}`);
    values.push(JSON.stringify(payload.r2AssetKeys));
  }
  if (payload.r2TotalBytes !== undefined) {
    fields.push(`r2_total_bytes = $${idx++}`);
    values.push(payload.r2TotalBytes);
  }
  if (payload.r2Retained !== undefined) {
    fields.push(`r2_retained = $${idx++}`);
    values.push(payload.r2Retained);
  }
  if (payload.r2DeletedAt !== undefined) {
    fields.push(`r2_deleted_at = $${idx++}`);
    values.push(payload.r2DeletedAt);
  }
  if (payload.youtubeVideoId !== undefined) {
    fields.push(`youtube_video_id = $${idx++}`);
    values.push(payload.youtubeVideoId);
  }
  if (payload.youtubeVideoUrl !== undefined) {
    fields.push(`youtube_video_url = $${idx++}`);
    values.push(payload.youtubeVideoUrl);
  }
  if (payload.youtubePublishStatus !== undefined) {
    fields.push(`youtube_publish_status = $${idx++}`);
    values.push(payload.youtubePublishStatus);
  }

  await query(
    `UPDATE video_studio_jobs SET ${fields.join(', ')} WHERE id = $1;`,
    values
  );
}

export async function getVideoJobById(id: string): Promise<VideoStudioJob | null> {
  const rows = await query<any>(
    `SELECT * FROM video_studio_jobs WHERE id = $1 LIMIT 1;`,
    [id]
  );
  if (!rows || rows.length === 0) return null;
  return mapJobRow(rows[0]);
}

export async function getRecentVideoJobs(limit: number = 20): Promise<VideoStudioJob[]> {
  const rows = await query<any>(
    `SELECT * FROM video_studio_jobs ORDER BY created_at DESC LIMIT $1;`,
    [limit]
  );
  return (rows || []).map(mapJobRow);
}

/**
 * Returns any job that is currently executing (concurrency control).
 */
export async function getActiveVideoJob(): Promise<VideoStudioJob | null> {
  const activeStatuses: VideoJobStatus[] = [
    'researching',
    'scripting',
    'storyboarding',
    'generating_visuals',
    'generating_voiceover',
    'subtitle_generation',
    'rendering',
    'quality_check',
    'uploading_to_r2',
    'publishing_to_youtube',
  ];

  const rows = await query<any>(
    `SELECT * FROM video_studio_jobs 
     WHERE status = ANY($1::varchar[])
     ORDER BY updated_at DESC LIMIT 1;`,
    [activeStatuses]
  );

  if (!rows || rows.length === 0) return null;
  return mapJobRow(rows[0]);
}

/**
 * Returns all successfully published video jobs that currently have active R2 media assets retained.
 */
export async function getRetainedPublishedVideoJobs(): Promise<VideoStudioJob[]> {
  const rows = await query<any>(
    `SELECT * FROM video_studio_jobs
     WHERE status = 'published'
       AND youtube_publish_status = 'published'
       AND r2_retained = TRUE
     ORDER BY published_at ASC;`
  );
  return (rows || []).map(mapJobRow);
}

/**
 * Marks an old video job's R2 assets as pruned by retention policy while keeping database and YouTube records.
 */
export async function markJobR2Pruned(
  jobId: string,
  deletedKeys: string[],
  bytesFreed: number
): Promise<void> {
  await query(
    `UPDATE video_studio_jobs
     SET r2_retained = FALSE,
         r2_deleted_at = NOW(),
         r2_asset_keys = '[]'::jsonb,
         r2_total_bytes = 0,
         updated_at = NOW()
     WHERE id = $1;`,
    [jobId]
  );
}

export async function recordRetentionLog(params: {
  triggeringJobId: string;
  prunedJobId: string;
  prunedVideoTitle: string;
  objectsDeleted: string[];
  bytesFreed: number;
  status: 'success' | 'partial_failure' | 'failed';
  errorMessage?: string;
}): Promise<VideoStudioRetentionLog> {
  const rows = await query<any>(
    `INSERT INTO video_studio_retention_logs (
      triggering_job_id, pruned_job_id, pruned_video_title,
      objects_deleted, bytes_freed, status, error_message, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *;`,
    [
      params.triggeringJobId,
      params.prunedJobId,
      params.prunedVideoTitle,
      JSON.stringify(params.objectsDeleted),
      params.bytesFreed,
      params.status,
      params.errorMessage || null,
    ]
  );

  const r = rows[0];
  return {
    id: r.id,
    triggeringJobId: r.triggering_job_id,
    prunedJobId: r.pruned_job_id,
    prunedVideoTitle: r.pruned_video_title,
    objectsDeleted: Array.isArray(r.objects_deleted) ? r.objects_deleted : [],
    bytesFreed: Number(r.bytes_freed) || 0,
    status: r.status,
    errorMessage: r.error_message,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function getRecentRetentionLogs(limit: number = 10): Promise<VideoStudioRetentionLog[]> {
  const rows = await query<any>(
    `SELECT * FROM video_studio_retention_logs ORDER BY created_at DESC LIMIT $1;`,
    [limit]
  );

  return (rows || []).map((r) => ({
    id: r.id,
    triggeringJobId: r.triggering_job_id,
    prunedJobId: r.pruned_job_id,
    prunedVideoTitle: r.pruned_video_title,
    objectsDeleted: Array.isArray(r.objects_deleted) ? r.objects_deleted : [],
    bytesFreed: Number(r.bytes_freed) || 0,
    status: r.status,
    errorMessage: r.error_message,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function getStorageDashboardSummary(): Promise<StorageDashboardSummary> {
  const settings = await getVideoStudioSettings();
  const retainedJobs = await getRetainedPublishedVideoJobs();
  const recentLogs = await getRecentRetentionLogs(5);

  let totalBytes = 0;
  for (const job of retainedJobs) {
    totalBytes += job.r2TotalBytes || 0;
  }

  const retainedCount = retainedJobs.length;
  const avgBytes = retainedCount > 0 ? Math.round(totalBytes / retainedCount) : 0;

  let oldest: StorageDashboardSummary['oldestRetainedVideo'] = null;
  if (retainedJobs.length > 0) {
    const o = retainedJobs[0];
    oldest = {
      id: o.id,
      title: o.title,
      publishedAt: o.publishedAt || o.createdAt,
      totalBytes: o.r2TotalBytes,
      formattedSize: formatBytes(o.r2TotalBytes),
    };
  }

  const failedCleanupCount = recentLogs.filter((l) => l.status === 'failed' || l.status === 'partial_failure').length;
  const lastLog = recentLogs[0] || null;

  // Warning check: if retained count exceeds limit or storage exceeds 5 GB
  const hasWarning = retainedCount > settings.maxPublishedVideos || totalBytes > 5 * 1024 * 1024 * 1024;
  let warningMessage: string | undefined = undefined;
  if (retainedCount > settings.maxPublishedVideos) {
    warningMessage = `Retained video count (${retainedCount}) exceeds maximum retention limit of ${settings.maxPublishedVideos}. Immediate retention prune required.`;
  } else if (totalBytes > 5 * 1024 * 1024 * 1024) {
    warningMessage = `R2 storage usage (${formatBytes(totalBytes)}) is unusually high. Review retained media assets.`;
  }

  return {
    r2TotalBytes: totalBytes,
    r2TotalFormatted: formatBytes(totalBytes),
    retainedVideosCount: retainedCount,
    maxRetentionLimit: settings.maxPublishedVideos,
    oldestRetainedVideo: oldest,
    estimatedStoragePerVideoBytes: avgBytes,
    estimatedStoragePerVideoFormatted: formatBytes(avgBytes),
    lastCleanupExecution: lastLog
      ? {
          timestamp: lastLog.createdAt,
          status: lastLog.status,
          prunedTitle: lastLog.prunedVideoTitle,
          bytesFreedFormatted: formatBytes(lastLog.bytesFreed),
        }
      : null,
    failedCleanupTasksCount: failedCleanupCount,
    hasStorageWarning: hasWarning,
    storageWarningMessage: warningMessage,
    recentRetentionLogs: recentLogs,
  };
}

/**
 * Deletes an individual video job and cleans up its associated R2 media objects.
 */
export async function deleteVideoJob(jobId: string): Promise<{ success: boolean; deletedCount: number }> {
  try {
    const job = await getVideoJobById(jobId);
    if (job?.r2AssetKeys && Array.isArray(job.r2AssetKeys)) {
      const { deleteFromR2 } = await import('@/lib/storage/r2');
      for (const key of job.r2AssetKeys) {
        if (key) {
          await deleteFromR2(key).catch(() => {});
        }
      }
    }

    await query(`DELETE FROM video_studio_jobs WHERE id = $1;`, [jobId]);
    return { success: true, deletedCount: 1 };
  } catch (err) {
    console.error(`[VideoStudio DB] Failed to delete video job ${jobId}:`, err);
    throw err;
  }
}

/**
 * Bulk deletes multiple video jobs and cleans up their R2 media objects.
 */
export async function deleteVideoJobs(jobIds: string[]): Promise<{ success: boolean; deletedCount: number }> {
  if (!jobIds || jobIds.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  let deletedCount = 0;
  for (const id of jobIds) {
    try {
      await deleteVideoJob(id);
      deletedCount++;
    } catch (e) {
      console.warn(`[VideoStudio DB] Error deleting job ${id}:`, e);
    }
  }

  return { success: true, deletedCount };
}

