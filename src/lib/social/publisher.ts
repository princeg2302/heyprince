import {
  MultiPlatformPublishResult,
  PlatformConfigStatus,
  SocialPlatform,
  SocialPublishParams,
  SocialPublishResult,
} from './types';
import {
  publishToThreads,
  isThreadsConfigured,
  getThreadsConnectionStatus,
} from './threads';
import {
  publishToTwitter,
  isTwitterConfigured,
  getTwitterConnectionStatus,
} from './twitter';
import {
  publishToWhatsAppChannel,
  isWhatsAppConfigured,
  getWhatsAppChannelStatus,
} from './whatsapp';

/**
 * Returns configuration and connectivity status across all supported social platforms.
 */
export function getAllSocialPlatformStatuses(): PlatformConfigStatus[] {
  return [
    getThreadsConnectionStatus(),
    getTwitterConnectionStatus(),
    getWhatsAppChannelStatus(),
  ];
}

/**
 * Returns list of platforms that are actively configured with credentials.
 */
export function getConfiguredSocialPlatforms(): SocialPlatform[] {
  const platforms: SocialPlatform[] = [];
  if (isThreadsConfigured()) platforms.push('threads');
  if (isTwitterConfigured()) platforms.push('twitter');
  if (isWhatsAppConfigured()) platforms.push('whatsapp');
  return platforms;
}

/**
 * Publishes an article across all configured (or explicitly requested) social platforms.
 * Runs concurrently with complete fault isolation.
 */
export async function publishToAllSocialPlatforms(
  params: SocialPublishParams,
  targetPlatforms?: SocialPlatform[]
): Promise<MultiPlatformPublishResult> {
  const availablePlatforms: SocialPlatform[] = ['threads', 'twitter', 'whatsapp'];
  const requestedPlatforms = targetPlatforms && targetPlatforms.length > 0
    ? targetPlatforms.filter((p) => availablePlatforms.includes(p))
    : availablePlatforms;

  const dispatchTasks = requestedPlatforms.map(async (platform): Promise<SocialPublishResult> => {
    switch (platform) {
      case 'threads':
        return publishToThreads(params);
      case 'twitter':
        return publishToTwitter(params);
      case 'whatsapp':
        return publishToWhatsAppChannel(params);
      default:
        return {
          success: false,
          platform,
          error: `Unsupported platform: ${platform}`,
        };
    }
  });

  const settled = await Promise.allSettled(dispatchTasks);

  const results: SocialPublishResult[] = settled.map((item, idx) => {
    const platform = requestedPlatforms[idx];
    if (item.status === 'fulfilled') {
      return item.value;
    }
    return {
      success: false,
      platform,
      error: item.reason?.message || 'Platform task crashed unexpectedly.',
    };
  });

  const publishedCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success && !r.error?.includes('not configured')).length;
  const skippedCount = results.filter((r) => !r.success && r.error?.includes('not configured')).length;

  return {
    success: publishedCount > 0,
    postId: params.postId,
    results,
    publishedCount,
    failedCount,
    skippedCount,
  };
}
