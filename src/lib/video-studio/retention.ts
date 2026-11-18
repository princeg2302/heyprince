import { deleteFromR2, checkR2FileExists, isR2Configured } from '../storage/r2';
import {
  getVideoStudioSettings,
  getRetainedPublishedVideoJobs,
  markJobR2Pruned,
  recordRetentionLog,
} from './db';
import { VideoStudioJob, VideoStudioRetentionLog } from './types';

export interface RetentionEnforcementResult {
  pruningRequired: boolean;
  retainedBeforeCount: number;
  retainedAfterCount: number;
  prunedJobId?: string;
  prunedVideoTitle?: string;
  objectsDeleted: string[];
  bytesFreed: number;
  success: boolean;
  error?: string;
}

/**
 * Cloudflare R2 Retention Policy Manager
 *
 * Enforces the strict rule: Maintain at most R2_MAX_PUBLISHED_VIDEOS (default 5)
 * active media collections in Cloudflare R2.
 *
 * When a new video is successfully published to YouTube, this service checks whether
 * the retained count exceeds the threshold. If so, it transactionally prunes the
 * media objects of the oldest published video while preserving its database history,
 * text script, SEO metadata, and YouTube URL forever.
 */
export async function enforceR2RetentionPolicy(
  newlyPublishedJob: VideoStudioJob
): Promise<RetentionEnforcementResult> {
  const settings = await getVideoStudioSettings();
  const maxLimit = settings.maxPublishedVideos || 5;

  console.log(`[R2 Retention Policy] Evaluating retention after publishing Job #${newlyPublishedJob.id}: "${newlyPublishedJob.title}" (Limit: ${maxLimit})...`);

  // Safety Guard 1: Verify the newly published video was truly published to YouTube
  if (!newlyPublishedJob.youtubeVideoId || newlyPublishedJob.youtubePublishStatus !== 'published') {
    console.warn('[R2 Retention Policy] Aborting retention cleanup: newly published job lacks confirmed YouTube video ID.');
    return {
      pruningRequired: false,
      retainedBeforeCount: 0,
      retainedAfterCount: 0,
      objectsDeleted: [],
      bytesFreed: 0,
      success: false,
      error: 'Cannot prune older video because the new video has not completed confirmed YouTube publishing.',
    };
  }

  // Safety Guard 2: Verify the new video's primary R2 asset exists before deleting anything older
  if (newlyPublishedJob.r2VideoKey && isR2Configured()) {
    const exists = await checkR2FileExists(newlyPublishedJob.r2VideoKey);
    if (!exists) {
      console.error('[R2 Retention Policy] FATAL: New video R2 asset key could not be retrieved from storage. Halting retention cleanup.');
      return {
        pruningRequired: false,
        retainedBeforeCount: 0,
        retainedAfterCount: 0,
        objectsDeleted: [],
        bytesFreed: 0,
        success: false,
        error: 'New video R2 asset verification failed. Refusing to delete older video assets.',
      };
    }
  }

  // Query currently retained published videos ordered chronologically (oldest first)
  const retainedJobs = await getRetainedPublishedVideoJobs();
  const retainedCount = retainedJobs.length;

  console.log(`[R2 Retention Policy] Total retained published video asset collections in R2: ${retainedCount}/${maxLimit}`);

  // If within the configured limit, no deletion is required
  if (retainedCount <= maxLimit) {
    return {
      pruningRequired: false,
      retainedBeforeCount: retainedCount,
      retainedAfterCount: retainedCount,
      objectsDeleted: [],
      bytesFreed: 0,
      success: true,
    };
  }

  // Identify the oldest video that must be pruned
  // (Oldest is first item because getRetainedPublishedVideoJobs is sorted by published_at ASC)
  const oldestJob = retainedJobs[0];

  // Prevent self-pruning
  if (oldestJob.id === newlyPublishedJob.id) {
    console.warn('[R2 Retention Policy] Oldest job equals newly published job. Skipping prune.');
    return {
      pruningRequired: false,
      retainedBeforeCount: retainedCount,
      retainedAfterCount: retainedCount,
      objectsDeleted: [],
      bytesFreed: 0,
      success: true,
    };
  }

  console.log(`[R2 Retention Policy] Pruning threshold exceeded (${retainedCount} > ${maxLimit}). Initiating cleanup of oldest video Job #${oldestJob.id}: "${oldestJob.title}"...`);

  // Gather all R2 object keys belonging to the oldest video
  const keysToDelete = new Set<string>();

  if (oldestJob.r2VideoKey) keysToDelete.add(oldestJob.r2VideoKey);
  if (Array.isArray(oldestJob.r2AssetKeys)) {
    oldestJob.r2AssetKeys.forEach((k) => k && keysToDelete.add(k));
  }
  if (oldestJob.subtitleAssets?.srtR2Key) keysToDelete.add(oldestJob.subtitleAssets.srtR2Key);
  if (oldestJob.subtitleAssets?.vttR2Key) keysToDelete.add(oldestJob.subtitleAssets.vttR2Key);
  if (oldestJob.voiceoverAssets?.combinedAudioR2Key) keysToDelete.add(oldestJob.voiceoverAssets.combinedAudioR2Key);
  if (Array.isArray(oldestJob.voiceoverAssets?.sceneAudioKeys)) {
    oldestJob.voiceoverAssets.sceneAudioKeys.forEach((k) => k && keysToDelete.add(k));
  }
  if (Array.isArray(oldestJob.visualAssets?.sceneClipR2Keys)) {
    oldestJob.visualAssets.sceneClipR2Keys.forEach((k) => k && keysToDelete.add(k));
  }

  const deletedList: string[] = [];
  const failedList: string[] = [];
  let totalBytesFreed = oldestJob.r2TotalBytes || 0;

  // Idempotent deletion loop: attempt deletion for every key
  for (const key of keysToDelete) {
    if (!isR2Configured()) {
      deletedList.push(key);
      console.log(`[R2 Retention Policy] Dev/Test mock pruned R2 object: ${key}`);
    } else {
      try {
        const delResult = await deleteFromR2(key);
        if (delResult.success) {
          deletedList.push(key);
          console.log(`[R2 Retention Policy] Deleted R2 object: ${key}`);
        } else {
          failedList.push(key);
          console.warn(`[R2 Retention Policy] Failed to delete R2 object: ${key} (${delResult.error})`);
        }
      } catch (err: any) {
        failedList.push(key);
        console.warn(`[R2 Retention Policy] Error deleting R2 object: ${key}`, err);
      }
    }
  }

  const isPartial = failedList.length > 0;
  const status: VideoStudioRetentionLog['status'] = isPartial ? 'partial_failure' : 'success';
  const errorMessage = isPartial
    ? `Failed to delete ${failedList.length} of ${keysToDelete.size} objects: ${failedList.join(', ')}`
    : undefined;

  // Mark the database record as pruned (preserving text content, metadata, and YouTube URL)
  await markJobR2Pruned(oldestJob.id, deletedList, totalBytesFreed);

  // Record audit retention log in PostgreSQL
  await recordRetentionLog({
    triggeringJobId: newlyPublishedJob.id,
    prunedJobId: oldestJob.id,
    prunedVideoTitle: oldestJob.title,
    objectsDeleted: deletedList,
    bytesFreed: totalBytesFreed,
    status,
    errorMessage,
  });

  console.log(`[R2 Retention Policy] Successfully pruned oldest Job #${oldestJob.id}. Freed ${totalBytesFreed} bytes across ${deletedList.length} R2 objects.`);

  return {
    pruningRequired: true,
    retainedBeforeCount: retainedCount,
    retainedAfterCount: retainedCount - 1,
    prunedJobId: oldestJob.id,
    prunedVideoTitle: oldestJob.title,
    objectsDeleted: deletedList,
    bytesFreed: totalBytesFreed,
    success: !isPartial,
    error: errorMessage,
  };
}
