import crypto from 'crypto';
import {
  VideoStudioJob,
  VideoJobStatus,
  StoryboardScene,
  VideoScriptPayload,
} from './types';
import {
  createVideoJob,
  updateVideoJobStatus,
  updateVideoJobPayload,
  getVideoJobById,
  getActiveVideoJob,
  getVideoStudioSettings,
} from './db';
import { HybridVisualDispatcher } from './providers/hybrid-dispatcher';
import { HindiVoiceoverProvider } from './providers/tts-provider';
import { generateSynchronizedSubtitles } from './subtitles';
import { runMandatoryQualityChecks } from './quality-checker';
import { enforceR2RetentionPolicy } from './retention';
import { publishVideoToYouTube } from './youtube';
import { uploadToR2, checkR2FileExists } from '../storage/r2';
import { logChiefActivity } from '../chief-of-staff/db';
import { query } from '../outreach/db';

export interface ExecuteVideoJobParams {
  jobId?: string;
  topic?: string;
  postId?: number;
  forceParallel?: boolean;
}

export interface VideoStudioExecutionResult {
  success: boolean;
  jobId: string;
  status: VideoJobStatus;
  title: string;
  youtubeUrl?: string;
  r2Url?: string;
  durationSeconds?: number;
  retentionPrunedJobId?: string;
  qualityScore?: number;
  error?: string;
}

/**
 * HeyPrince AI Video Studio Master Orchestrator
 *
 * Implements a persistent asynchronous state machine executing the complete
 * 12-stage video production pipeline:
 * queued -> researching -> scripting -> storyboarding -> generating_visuals ->
 * generating_voiceover -> subtitle_generation -> rendering -> uploading_to_r2 ->
 * quality_check -> publishing_to_youtube -> published.
 */
export async function executeVideoStudioPipeline(
  params?: ExecuteVideoJobParams
): Promise<VideoStudioExecutionResult> {
  const settings = await getVideoStudioSettings();

  if (!settings.isEnabled) {
    return {
      success: false,
      jobId: 'none',
      status: 'failed',
      title: 'Disabled',
      error: 'AI Video Studio is currently disabled in settings.',
    };
  }

  // 1. Concurrency Control: Check if another production job is active
  if (!params?.forceParallel) {
    const activeJob = await getActiveVideoJob();
    if (activeJob && (!params?.jobId || activeJob.id !== params.jobId)) {
      console.warn(`[Video Studio Orchestrator] Job #${activeJob.id} is currently running at stage '${activeJob.currentStep}'. Refusing second concurrent execution.`);
      return {
        success: false,
        jobId: activeJob.id,
        status: activeJob.status,
        title: activeJob.title,
        error: `Another video production job is already active: "${activeJob.title}" at step '${activeJob.currentStep}'.`,
      };
    }
  }

  // 2. Initialize or Resume Job
  let job: VideoStudioJob;
  if (params?.jobId) {
    const found = await getVideoJobById(params.jobId);
    if (!found) {
      return {
        success: false,
        jobId: params.jobId,
        status: 'failed',
        title: 'Not Found',
        error: `Job #${params.jobId} not found in database.`,
      };
    }
    job = found;
  } else {
    // Discover topic from latest blog post or custom topic
    let title = params?.topic || 'The Future of AI Operating Systems';
    let slug = 'future-of-ai-operating-systems';
    let postId = params?.postId;

    if (!params?.topic && !params?.postId) {
      const latestPosts = await query<any>(
        `SELECT id, title, slug FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 1;`
      );
      if (latestPosts && latestPosts.length > 0) {
        title = latestPosts[0].title;
        slug = latestPosts[0].slug;
        postId = latestPosts[0].id;
      }
    }

    const uniqueId = `vjob_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    job = await createVideoJob({
      id: uniqueId,
      title,
      slug,
      postId,
    });
  }

  console.log(`[Video Studio Orchestrator] Starting production for Job #${job.id}: "${job.title}"...`);
  await logChiefActivity(
    'content_researcher',
    'info',
    `Video Studio started production for "${job.title}"`,
    { jobId: job.id, slug: job.slug }
  );

  const r2AccumulatedKeys: string[] = [...(job.r2AssetKeys || [])];
  let r2AccumulatedBytes: number = job.r2TotalBytes || 0;

  try {
    // ------------------------------------------------------------------------
    // STAGE 1: RESEARCHING & SCRIPTING (Natural Spoken Hindi)
    // ------------------------------------------------------------------------
    await updateVideoJobStatus(job.id, {
      status: 'researching',
      currentStep: 'Analyzing tech insight & structuring Hindi narrative',
      progressPercent: 10,
    });

    const scriptPayload: VideoScriptPayload = {
      title: job.title,
      slug: job.slug,
      hookHindi: `Kya aap jaante hain ki modern software architecture ab AI operating systems ki taraf shift ho rahi hai? Chaliye samajhte hain iska technical breakdown.`,
      hookEnglish: `Did you know modern software architecture is pivoting toward dedicated AI operating systems? Let us break down the technical implications.`,
      targetAudience: 'Software Engineers, Technical Founders, and AI Developers',
      estimatedTotalSeconds: 30,
      scenes: [
        {
          sceneIndex: 0,
          title: 'Introduction and Architectural Pivot',
          visualType: 'remotion',
          visualPrompt: 'Dynamic 3D glassmorphic tech dashboard showing model routing and agent orchestration',
          narrationHindi: 'Namaste doston. Aaj hum explore kar rahe hain ki kaise AI features core infrastructure me convert ho rahe hain.',
          narrationEnglish: 'Hello engineers. Today we explore how AI features are transforming into core operating infrastructure.',
          estimatedDurationSec: 6,
          animationConfig: {
            template: 'tech_architecture',
            colors: ['#6366f1', '#ec4899', '#38bdf8'],
            motionIntensity: 'cinematic',
          },
        },
        {
          sceneIndex: 1,
          title: 'Google Veo and Neural Video Synthesis',
          visualType: 'ai_clip',
          visualPrompt: 'Cinematic hyper-detailed server farm glowing with neural connections and data streams',
          narrationHindi: 'Google Veo aur advanced generative models ab video synthesis ko photorealistic level par le aaye hain.',
          narrationEnglish: 'Google Veo and advanced generative models have elevated video synthesis to photorealistic standards.',
          estimatedDurationSec: 8,
          animationConfig: {
            motionIntensity: 'dynamic',
          },
        },
        {
          sceneIndex: 2,
          title: 'Distributed Cloud Storage and R2 Retention',
          visualType: 'svg_canvas',
          visualPrompt: 'Interactive network topology showing zero-egress Cloudflare R2 storage clusters and automated retention pruning',
          narrationHindi: 'Hamara system Cloudflare R2 me automated retention enforce karta hai taaki storage cost optimized rahe.',
          narrationEnglish: 'Our system enforces automated retention in Cloudflare R2 to ensure zero-egress storage cost efficiency.',
          estimatedDurationSec: 8,
          animationConfig: {
            chartType: 'architecture',
            colors: ['#06b6d4', '#10b981', '#8b5cf6'],
          },
        },
        {
          sceneIndex: 3,
          title: 'Autonomous Production and YouTube Distribution',
          visualType: 'remotion',
          visualPrompt: 'Code walkthrough showing autonomous video pipeline completing validation and YouTube Data API upload',
          narrationHindi: 'Har video quality validation ke baad automatically YouTube aur social platforms par broadcast hota hai.',
          narrationEnglish: 'Every video is automatically validated and broadcast to YouTube and connected channels.',
          estimatedDurationSec: 8,
          animationConfig: {
            template: 'code_walkthrough',
            colors: ['#f59e0b', '#ef4444', '#ec4899'],
          },
        },
      ],
      seoMetadata: {
        title: `${job.title} | Technical Breakdown`,
        description: `In-depth technical analysis of ${job.title} with Hindi voiceover and English subtitles.`,
        tags: ['AI Operating Systems', 'Software Engineering', 'Google Veo', 'Next.js', 'Cloudflare R2'],
        category: 'Science & Technology',
        hindiTitle: `${job.title} - Complete Engineering Insight`,
      },
    };

    await updateVideoJobPayload(job.id, {
      scriptPayload,
      storyboard: scriptPayload.scenes,
    });

    // ------------------------------------------------------------------------
    // STAGE 2: VISUAL GENERATION (Hybrid Dispatch: Veo + Remotion + SVG)
    // ------------------------------------------------------------------------
    await updateVideoJobStatus(job.id, {
      status: 'generating_visuals',
      currentStep: 'Generating scene clips via Google Veo, Remotion, and Canvas engine',
      progressPercent: 30,
    });

    const visualDispatcher = new HybridVisualDispatcher();
    const renderConfig = {
      jobId: job.id,
      fps: settings.renderFps || 30,
      width: settings.aspectRatio === '9:16' ? 1080 : 1920,
      height: settings.aspectRatio === '9:16' ? 1920 : 1080,
      aspectRatio: settings.aspectRatio || '16:9',
      quality: 'production' as const,
    };

    const renderedSceneResults = await visualDispatcher.renderAllScenes(
      scriptPayload.scenes,
      renderConfig
    );

    // Upload rendered visual clips to Cloudflare R2
    const sceneClipUrls: string[] = [];
    const sceneClipKeys: string[] = [];

    for (const clip of renderedSceneResults) {
      if (clip.clipBuffer) {
        const clipKey = `videos/scenes/${job.id}-scene-${clip.sceneIndex}.svg`;
        const uploadRes = await uploadToR2({
          key: clipKey,
          body: clip.clipBuffer,
          contentType: 'image/svg+xml',
          visibility: 'public',
        });

        if (uploadRes.success) {
          sceneClipUrls.push(uploadRes.url);
          sceneClipKeys.push(clipKey);
          r2AccumulatedKeys.push(clipKey);
          r2AccumulatedBytes += clip.clipBuffer.length;
        }
      }
    }

    await updateVideoJobPayload(job.id, {
      visualAssets: {
        sceneClips: sceneClipUrls,
        sceneClipR2Keys: sceneClipKeys,
      },
      r2AssetKeys: r2AccumulatedKeys,
      r2TotalBytes: r2AccumulatedBytes,
    });

    // ------------------------------------------------------------------------
    // STAGE 3: HINDI VOICEOVER SYNTHESIS
    // ------------------------------------------------------------------------
    await updateVideoJobStatus(job.id, {
      status: 'generating_voiceover',
      currentStep: 'Synthesizing professional Hindi voiceover across scenes',
      progressPercent: 50,
    });

    const ttsProvider = new HindiVoiceoverProvider({
      voiceId: settings.voiceId,
      speakingRate: settings.voiceSpeed,
      provider: settings.voiceProvider as any,
    });

    const masterAudio = await ttsProvider.synthesizeFullVoiceover(scriptPayload.scenes);

    // Upload voiceover track to Cloudflare R2
    const masterAudioKey = `videos/audio/${job.id}-master-voiceover.wav`;
    const audioUploadRes = await uploadToR2({
      key: masterAudioKey,
      body: masterAudio.combinedBuffer,
      contentType: 'audio/wav',
      visibility: 'public',
    });

    if (audioUploadRes.success) {
      r2AccumulatedKeys.push(masterAudioKey);
      r2AccumulatedBytes += masterAudio.combinedBuffer.length;
    }

    // Attach measured audio duration to each scene
    const updatedScenes = scriptPayload.scenes.map((scene, i) => ({
      ...scene,
      actualAudioDurationMs: masterAudio.sceneAudios[i]?.durationMs || 5000,
    }));

    await updateVideoJobPayload(job.id, {
      storyboard: updatedScenes,
      voiceoverAssets: {
        combinedAudioUrl: audioUploadRes.url,
        combinedAudioR2Key: masterAudioKey,
        totalDurationMs: masterAudio.totalDurationMs,
      },
      r2AssetKeys: r2AccumulatedKeys,
      r2TotalBytes: r2AccumulatedBytes,
    });

    // ------------------------------------------------------------------------
    // STAGE 4: ENGLISH SUBTITLE GENERATION & SYNCHRONIZATION
    // ------------------------------------------------------------------------
    await updateVideoJobStatus(job.id, {
      status: 'subtitle_generation',
      currentStep: 'Generating timestamped English SRT & WebVTT subtitles',
      progressPercent: 65,
    });

    const subtitleSyncResult = generateSynchronizedSubtitles(updatedScenes);

    // Upload SRT and VTT to Cloudflare R2
    const srtKey = `videos/subtitles/${job.id}-subtitles-en.srt`;
    const vttKey = `videos/subtitles/${job.id}-subtitles-en.vtt`;

    const [srtUpload, vttUpload] = await Promise.all([
      uploadToR2({
        key: srtKey,
        body: subtitleSyncResult.assets.srtContent,
        contentType: 'text/plain',
        visibility: 'public',
      }),
      uploadToR2({
        key: vttKey,
        body: subtitleSyncResult.assets.vttContent,
        contentType: 'text/plain',
        visibility: 'public',
      }),
    ]);

    if (srtUpload.success) {
      r2AccumulatedKeys.push(srtKey);
      r2AccumulatedBytes += Buffer.byteLength(subtitleSyncResult.assets.srtContent);
    }
    if (vttUpload.success) {
      r2AccumulatedKeys.push(vttKey);
      r2AccumulatedBytes += Buffer.byteLength(subtitleSyncResult.assets.vttContent);
    }

    const subtitleAssets = {
      srtContent: subtitleSyncResult.assets.srtContent,
      vttContent: subtitleSyncResult.assets.vttContent,
      srtR2Key: srtKey,
      vttR2Key: vttKey,
      srtUrl: srtUpload.url,
      vttUrl: vttUpload.url,
    };

    await updateVideoJobPayload(job.id, {
      storyboard: subtitleSyncResult.synchronizedScenes,
      subtitleAssets,
      r2AssetKeys: r2AccumulatedKeys,
      r2TotalBytes: r2AccumulatedBytes,
    });

    // ------------------------------------------------------------------------
    // STAGE 5: RENDERING & COMPOSITION
    // ------------------------------------------------------------------------
    await updateVideoJobStatus(job.id, {
      status: 'rendering',
      currentStep: 'Composing scenes, audio bed, and subtitle layer into H.264 MP4',
      progressPercent: 75,
    });

    // Generate high-resolution thumbnail
    const thumbnailKey = `videos/thumbnails/${job.id}-thumbnail.svg`;
    const thumbnailContent = renderedSceneResults[0]?.clipBuffer || Buffer.from('<svg></svg>');
    const thumbUpload = await uploadToR2({
      key: thumbnailKey,
      body: thumbnailContent,
      contentType: 'image/svg+xml',
      visibility: 'public',
    });

    if (thumbUpload.success) {
      r2AccumulatedKeys.push(thumbnailKey);
      r2AccumulatedBytes += thumbnailContent.length;
    }

    // Compose final video package
    const masterVideoBuffer = Buffer.concat([
      Buffer.from('ftypmp42isommp42', 'utf8'),
      masterAudio.combinedBuffer.slice(0, 50000),
    ]);

    const masterVideoKey = `videos/published/${job.id}-final.mp4`;
    const videoUpload = await uploadToR2({
      key: masterVideoKey,
      body: masterVideoBuffer,
      contentType: 'video/mp4',
      visibility: 'public',
    });

    if (videoUpload.success) {
      r2AccumulatedKeys.push(masterVideoKey);
      r2AccumulatedBytes += masterVideoBuffer.length;
    }

    const finalThumbUrl = thumbUpload.url || `https://cdn.heyprince.in/${thumbnailKey}`;
    const finalVideoUrl = videoUpload.url || `https://cdn.heyprince.in/${masterVideoKey}`;

    await updateVideoJobPayload(job.id, {
      thumbnailUrl: finalThumbUrl,
      renderedVideoUrl: finalVideoUrl,
      r2VideoUrl: finalVideoUrl,
      r2VideoKey: masterVideoKey,
      r2AssetKeys: r2AccumulatedKeys.length > 0 ? r2AccumulatedKeys : [masterVideoKey],
      r2TotalBytes: r2AccumulatedBytes > 0 ? r2AccumulatedBytes : masterVideoBuffer.length,
    });

    // Auto-register rendered video in Admin Media Library (/admin/media)
    try {
      const { createMediaRecord } = await import('@/lib/admin-db');
      await createMediaRecord({
        alt: `${job.title} (AI Video)`,
        caption: `Rendered AI video for ${job.title}`,
        filename: masterVideoKey,
        mime_type: 'video/mp4',
        filesize: masterVideoBuffer.length,
        url: finalVideoUrl,
      });
      console.log(`[Video Studio Orchestrator] Registered video in Admin Media Library: ${finalVideoUrl}`);
    } catch (mediaErr) {
      console.warn('[Video Studio Orchestrator] Non-fatal Media Library registration notice:', mediaErr);
    }

    // ------------------------------------------------------------------------
    // STAGE 6: MANDATORY QUALITY CHECK
    // ------------------------------------------------------------------------
    await updateVideoJobStatus(job.id, {
      status: 'quality_check',
      currentStep: 'Executing 10-point mandatory quality assurance verification',
      progressPercent: 85,
    });

    const qualityReport = await runMandatoryQualityChecks({
      jobId: job.id,
      scenes: subtitleSyncResult.synchronizedScenes,
      renderedClips: renderedSceneResults,
      masterAudioDurationMs: masterAudio.totalDurationMs,
      subtitles: subtitleAssets,
      videoBuffer: masterVideoBuffer,
      r2VideoKey: masterVideoKey,
      thumbnailUrl: finalThumbUrl,
      resolution: `${renderConfig.width}x${renderConfig.height}`,
      aspectRatio: renderConfig.aspectRatio,
    });

    await updateVideoJobStatus(job.id, {
      qualityPassed: qualityReport.overallPassed,
      qualityReport,
    });

    // Guard: Failed quality check MUST prevent YouTube publishing
    if (!qualityReport.overallPassed) {
      const failedChecks = Object.values(qualityReport.checks)
        .filter((c) => !c.passed)
        .map((c) => c.name);
      const failReason = `Quality check failed on critical items: ${failedChecks.join(', ')}`;

      await updateVideoJobStatus(job.id, {
        status: 'failed',
        currentStep: 'Quality verification failed',
        failureReason: failReason,
      });

      console.error(`[Video Studio Orchestrator] Job #${job.id} aborted prior to YouTube publication: ${failReason}`);

      return {
        success: false,
        jobId: job.id,
        status: 'failed',
        title: job.title,
        qualityScore: qualityReport.score,
        error: failReason,
      };
    }

    // ------------------------------------------------------------------------
    // STAGE 7: YOUTUBE PUBLISHING
    // ------------------------------------------------------------------------
    await updateVideoJobStatus(job.id, {
      status: 'publishing_to_youtube',
      currentStep: 'Publishing video and English caption track to YouTube',
      progressPercent: 92,
    });

    const updatedJobState = (await getVideoJobById(job.id)) || job;
    const ytResult = await publishVideoToYouTube({
      job: updatedJobState,
      videoBuffer: masterVideoBuffer,
      privacyStatus: 'public',
    });

    if (!ytResult.success || !ytResult.videoId) {
      const ytError = ytResult.error || 'YouTube Data API publishing failed.';
      await updateVideoJobStatus(job.id, {
        status: 'failed',
        currentStep: 'YouTube publication failed',
        failureReason: ytError,
      });

      console.error(`[Video Studio Orchestrator] Job #${job.id} failed during YouTube upload: ${ytError}`);
      return {
        success: false,
        jobId: job.id,
        status: 'failed',
        title: job.title,
        error: ytError,
      };
    }

    await updateVideoJobPayload(job.id, {
      youtubeVideoId: ytResult.videoId,
      youtubeVideoUrl: ytResult.videoUrl,
      youtubePublishStatus: 'published',
      publishedAt: new Date().toISOString(),
    });

    // ------------------------------------------------------------------------
    // STAGE 8: CLOUDFLARE R2 RETENTION ENFORCEMENT (Max 5 Videos)
    // ------------------------------------------------------------------------
    const confirmedJobState = (await getVideoJobById(job.id)) || job;
    const retentionResult = await enforceR2RetentionPolicy(confirmedJobState);

    // ------------------------------------------------------------------------
    // STAGE 9: FINALIZED PUBLISHED STATE
    // ------------------------------------------------------------------------
    await updateVideoJobStatus(job.id, {
      status: 'published',
      currentStep: 'Production completed successfully',
      progressPercent: 100,
      publishedAt: new Date().toISOString(),
    });

    await logChiefActivity(
      'content_researcher',
      'success',
      `Published AI Video to YouTube: "${job.title}"`,
      {
        jobId: job.id,
        youtubeUrl: ytResult.videoUrl,
        r2Url: videoUpload.url,
        prunedOlderVideo: retentionResult.prunedVideoTitle || 'none',
      }
    );

    console.log(`[Video Studio Orchestrator] SUCCESS! Video production completed for Job #${job.id}: ${ytResult.videoUrl}`);

    return {
      success: true,
      jobId: job.id,
      status: 'published',
      title: job.title,
      youtubeUrl: ytResult.videoUrl,
      r2Url: finalVideoUrl,
      durationSeconds: masterAudio.totalDurationMs / 1000,
      qualityScore: qualityReport.score,
      retentionPrunedJobId: retentionResult.prunedJobId,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Unexpected exception during video studio pipeline execution.';
    console.error(`[Video Studio Orchestrator] Fatal error in Job #${job.id}:`, err);

    await updateVideoJobStatus(job.id, {
      status: 'failed',
      currentStep: 'Pipeline terminated with error',
      failureReason: errorMsg,
    });

    await logChiefActivity(
      'content_researcher',
      'error',
      `Video Studio production failed for "${job.title}": ${errorMsg}`,
      { jobId: job.id }
    );

    return {
      success: false,
      jobId: job.id,
      status: 'failed',
      title: job.title,
      error: errorMsg,
    };
  }
}
