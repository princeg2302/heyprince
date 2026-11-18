import crypto from 'crypto';
import { sanitizeEmDashes } from '../ai-content-sanitizer';
import { query } from '../outreach/db';
import { recordSocialShare } from './db';
import { PlatformConfigStatus, SocialPublishParams, SocialPublishResult } from './types';

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  bearerToken?: string;
  isConfigured: boolean;
}

export function getTwitterConfig(): TwitterConfig {
  const apiKey = process.env.TWITTER_API_KEY?.trim() || '';
  const apiSecret = process.env.TWITTER_API_SECRET?.trim() || '';
  const accessToken = process.env.TWITTER_ACCESS_TOKEN?.trim() || '';
  const accessSecret = process.env.TWITTER_ACCESS_SECRET?.trim() || '';
  const bearerToken = process.env.TWITTER_BEARER_TOKEN?.trim() || undefined;

  const isConfigured = Boolean(apiKey && apiSecret && accessToken && accessSecret);

  return {
    apiKey,
    apiSecret,
    accessToken,
    accessSecret,
    bearerToken,
    isConfigured,
  };
}

export function isTwitterConfigured(): boolean {
  return getTwitterConfig().isConfigured;
}

export function getTwitterConnectionStatus(): PlatformConfigStatus {
  const config = getTwitterConfig();
  const missingKeys: string[] = [];

  if (!config.apiKey) missingKeys.push('TWITTER_API_KEY');
  if (!config.apiSecret) missingKeys.push('TWITTER_API_SECRET');
  if (!config.accessToken) missingKeys.push('TWITTER_ACCESS_TOKEN');
  if (!config.accessSecret) missingKeys.push('TWITTER_ACCESS_SECRET');

  return {
    platform: 'twitter',
    name: 'Twitter / X',
    isConfigured: config.isConfigured,
    accountIdentifier: config.isConfigured ? 'Connected via OAuth 1.0a' : undefined,
    missingKeys,
  };
}

/**
 * Strict RFC 3986 percent encoding for OAuth 1.0a.
 */
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Generates an RFC 5849 OAuth 1.0a Authorization header.
 */
function generateOAuth1Header(
  method: string,
  url: string,
  config: TwitterConfig
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: '1.0',
  };

  // Sort parameter keys alphabetically
  const sortedParamKeys = Object.keys(oauthParams).sort();
  const paramString = sortedParamKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(config.apiSecret)}&${percentEncode(config.accessSecret)}`;

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`);

  return `OAuth ${headerParts.join(', ')}`;
}

/**
 * Publishes a tweet to Twitter / X using the v2 endpoint with OAuth 1.0a User Context.
 * Maximum character limit: 280 characters.
 */
export async function publishToTwitter(params: SocialPublishParams): Promise<SocialPublishResult> {
  const config = getTwitterConfig();

  if (!config.isConfigured) {
    const errorMsg = 'Twitter/X is not configured. Missing API keys or access tokens.';
    await recordSocialShare({
      postId: params.postId,
      platform: 'twitter',
      status: 'skipped',
      errorMessage: errorMsg,
    });
    return {
      success: false,
      platform: 'twitter',
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
      platform: 'twitter',
      error: `Post #${params.postId} not found in database.`,
    };
  }

  const post = postRows[0];
  const articleUrl = params.articleUrl || `https://heyprince.in/insights/${post.slug}/`;
  const imageUrl = params.imageUrl || post.cover_image;

  // 2. Build Tweet text (280 characters limit)
  let tweetText = params.customText?.trim();
  if (!tweetText) {
    const title = post.title || 'Engineering Insight';
    const hashtags = '#Tech #Engineering #Software';
    const linkBudget = 25; // Twitter t.co wraps URLs to ~23 chars

    // Available character budget for title
    const maxTitleLen = Math.max(30, 280 - linkBudget - hashtags.length - 15);
    const cleanTitle = title.length > maxTitleLen ? `${title.slice(0, maxTitleLen - 3)}...` : title;

    tweetText = `${cleanTitle}\n\nRead more:\n${articleUrl}\n\n${hashtags}`;
  }

  tweetText = sanitizeEmDashes(tweetText);
  if (tweetText.length > 280) {
    tweetText = `${tweetText.slice(0, 277)}...`;
  }

  try {
    const tweetUrl = 'https://api.twitter.com/2/tweets';
    const authHeader = generateOAuth1Header('POST', tweetUrl, config);

    const res = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
    });

    const data = await res.json();

    if (!res.ok || !data.data?.id) {
      const errorMsg = data.errors?.[0]?.message || data.detail || `Twitter publish failed (HTTP ${res.status})`;
      await recordSocialShare({
        postId: params.postId,
        platform: 'twitter',
        status: 'failed',
        contentText: tweetText,
        articleUrl,
        imageUrl,
        apiResponse: data,
        errorMessage: errorMsg,
      });

      return {
        success: false,
        platform: 'twitter',
        error: errorMsg,
        details: data,
      };
    }

    const tweetId = data.data.id;
    const tweetPublicUrl = `https://x.com/i/status/${tweetId}`;

    await recordSocialShare({
      postId: params.postId,
      platform: 'twitter',
      status: 'published',
      externalPostId: tweetId,
      externalPostUrl: tweetPublicUrl,
      contentText: tweetText,
      articleUrl,
      imageUrl,
      apiResponse: data,
    });

    return {
      success: true,
      platform: 'twitter',
      externalPostId: tweetId,
      externalPostUrl: tweetPublicUrl,
      details: data,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Unexpected exception publishing to Twitter/X.';
    await recordSocialShare({
      postId: params.postId,
      platform: 'twitter',
      status: 'failed',
      contentText: tweetText,
      articleUrl,
      imageUrl,
      errorMessage: errorMsg,
    });

    return {
      success: false,
      platform: 'twitter',
      error: errorMsg,
    };
  }
}
