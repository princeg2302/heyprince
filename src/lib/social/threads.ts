import { sanitizeEmDashes } from '../ai-content-sanitizer';
import { query } from '../outreach/db';
import { recordSocialShare } from './db';
import { PlatformConfigStatus, SocialPublishParams, SocialPublishResult } from './types';

export interface ThreadsConfig {
  accessToken: string;
  userId: string;
  appId?: string;
  appSecret?: string;
  username?: string;
  isConfigured: boolean;
}

export function getThreadsConfig(): ThreadsConfig {
  const accessToken = process.env.THREADS_ACCESS_TOKEN?.trim() || '';
  const userId = process.env.THREADS_USER_ID?.trim() || '';
  const appId = process.env.THREADS_APP_ID?.trim() || undefined;
  const appSecret = process.env.THREADS_APP_SECRET?.trim() || undefined;
  const username = process.env.THREADS_USERNAME?.trim() || 'heyprincein';

  const isConfigured = Boolean(accessToken && userId);

  return {
    accessToken,
    userId,
    appId,
    appSecret,
    username,
    isConfigured,
  };
}

export function isThreadsConfigured(): boolean {
  return getThreadsConfig().isConfigured;
}

export function getThreadsConnectionStatus(): PlatformConfigStatus {
  const config = getThreadsConfig();
  const missingKeys: string[] = [];

  if (!config.accessToken) missingKeys.push('THREADS_ACCESS_TOKEN');
  if (!config.userId) missingKeys.push('THREADS_USER_ID');

  return {
    platform: 'threads',
    name: 'Threads (Meta)',
    isConfigured: config.isConfigured,
    accountIdentifier: config.userId ? `@${config.username} (${config.userId})` : undefined,
    missingKeys,
  };
}

/**
 * Publishes an article summary and link to Threads.
 * Meta Threads API allows up to 500 characters per post.
 */
export async function publishToThreads(params: SocialPublishParams): Promise<SocialPublishResult> {
  const config = getThreadsConfig();

  if (!config.isConfigured) {
    const errorMsg = 'Threads is not configured. Missing THREADS_ACCESS_TOKEN or THREADS_USER_ID.';
    await recordSocialShare({
      postId: params.postId,
      platform: 'threads',
      status: 'skipped',
      errorMessage: errorMsg,
    });
    return {
      success: false,
      platform: 'threads',
      error: errorMsg,
    };
  }

  // 1. Fetch post details from database
  const postRows = await query(
    `SELECT id, title, slug, excerpt, seo_description, cover_image FROM posts WHERE id = $1 LIMIT 1;`,
    [params.postId]
  );

  if (!postRows || postRows.length === 0) {
    return {
      success: false,
      platform: 'threads',
      error: `Post #${params.postId} not found in database.`,
    };
  }

  const post = postRows[0];
  const articleUrl = params.articleUrl || `https://heyprince.in/insights/${post.slug}/`;
  let imageUrl = params.imageUrl || post.cover_image;

  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `https://heyprince.in${imageUrl}`;
  }

  // 2. Build Threads post text (500 chars limit)
  let postText = params.customText?.trim();
  if (!postText) {
    const title = post.title || 'Engineering Insight';
    const excerpt = post.excerpt || post.seo_description || '';
    const hashtags = '#Tech #Engineering #SoftwareEngineering #AI';
    const callToAction = `Read full article:\n${articleUrl}\n\n${hashtags}`;

    // Available budget for excerpt
    const maxExcerptLen = Math.max(0, 500 - title.length - callToAction.length - 10);
    const trimmedExcerpt = excerpt.length > maxExcerptLen
      ? `${excerpt.slice(0, Math.max(0, maxExcerptLen - 3))}...`
      : excerpt;

    postText = `${title}\n\n${trimmedExcerpt ? trimmedExcerpt + '\n\n' : ''}${callToAction}`.trim();
  }

  postText = sanitizeEmDashes(postText);
  if (postText.length > 500) {
    postText = `${postText.slice(0, 497)}...`;
  }

  try {
    // 3. Step 1: Create Media Container
    const containerParams = new URLSearchParams({
      access_token: config.accessToken,
      text: postText,
    });

    if (imageUrl && !imageUrl.endsWith('.svg')) {
      containerParams.append('media_type', 'IMAGE');
      containerParams.append('image_url', imageUrl);
    } else {
      containerParams.append('media_type', 'TEXT');
    }

    const containerUrl = `https://graph.threads.net/v1.0/${config.userId}/threads?${containerParams.toString()}`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const containerData = await containerRes.json();

    if (!containerRes.ok || !containerData.id) {
      const errorMsg = containerData.error?.message || `Threads container creation failed (HTTP ${containerRes.status})`;
      await recordSocialShare({
        postId: params.postId,
        platform: 'threads',
        status: 'failed',
        contentText: postText,
        articleUrl,
        imageUrl,
        apiResponse: containerData,
        errorMessage: errorMsg,
      });

      return {
        success: false,
        platform: 'threads',
        error: errorMsg,
        details: containerData,
      };
    }

    const creationId = containerData.id;

    // Small delay to ensure container processing on Meta servers
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 4. Step 2: Publish Container
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: config.accessToken,
    });

    const publishUrl = `https://graph.threads.net/v1.0/${config.userId}/threads_publish?${publishParams.toString()}`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      const errorMsg = publishData.error?.message || `Threads publish failed (HTTP ${publishRes.status})`;
      await recordSocialShare({
        postId: params.postId,
        platform: 'threads',
        status: 'failed',
        externalPostId: creationId,
        contentText: postText,
        articleUrl,
        imageUrl,
        apiResponse: publishData,
        errorMessage: errorMsg,
      });

      return {
        success: false,
        platform: 'threads',
        error: errorMsg,
        details: publishData,
      };
    }

    const threadPostId = publishData.id;
    const threadPostUrl = config.username
      ? `https://www.threads.net/@${config.username}/post/${threadPostId}`
      : `https://www.threads.net/t/${threadPostId}`;

    await recordSocialShare({
      postId: params.postId,
      platform: 'threads',
      status: 'published',
      externalPostId: threadPostId,
      externalPostUrl: threadPostUrl,
      contentText: postText,
      articleUrl,
      imageUrl,
      apiResponse: publishData,
    });

    return {
      success: true,
      platform: 'threads',
      externalPostId: threadPostId,
      externalPostUrl: threadPostUrl,
      details: publishData,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Unexpected exception publishing to Threads.';
    await recordSocialShare({
      postId: params.postId,
      platform: 'threads',
      status: 'failed',
      contentText: postText,
      articleUrl,
      imageUrl,
      errorMessage: errorMsg,
    });

    return {
      success: false,
      platform: 'threads',
      error: errorMsg,
    };
  }
}
