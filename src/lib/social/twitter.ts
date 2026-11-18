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

function cleanEnv(val?: string): string {
  if (!val) return '';
  let str = val.trim();
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }
  return str;
}

export function getTwitterConfig(): TwitterConfig {
  const apiKey = cleanEnv(process.env.TWITTER_API_KEY || process.env.TWITTER_CONSUMER_KEY);
  const apiSecret = cleanEnv(process.env.TWITTER_API_SECRET || process.env.TWITTER_CONSUMER_SECRET);
  const accessToken = cleanEnv(process.env.TWITTER_ACCESS_TOKEN || process.env.TWITTER_OAUTH_TOKEN);
  const accessSecret = cleanEnv(
    process.env.TWITTER_ACCESS_SECRET ||
      process.env.TWITTER_TOKEN_SECRET ||
      process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
  const bearerToken = cleanEnv(process.env.TWITTER_BEARER_TOKEN);

  const isConfigured = Boolean(
    (apiKey && apiSecret && accessToken && accessSecret) || bearerToken || accessToken
  );

  return {
    apiKey,
    apiSecret,
    accessToken,
    accessSecret,
    bearerToken: bearerToken || undefined,
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

  // If text is over 280 characters, intelligently trim while keeping the link
  if (tweetText.length > 280) {
    if (articleUrl && tweetText.includes(articleUrl)) {
      const parts = tweetText.split(articleUrl);
      const beforeLink = parts[0];
      const afterLink = parts.slice(1).join(articleUrl);
      const availableBefore = 280 - articleUrl.length - afterLink.length - 5;
      if (availableBefore > 20) {
        tweetText = `${beforeLink.slice(0, availableBefore).trim()}...\n\n${articleUrl}${afterLink}`;
      } else {
        tweetText = `${tweetText.slice(0, 277)}...`;
      }
    } else {
      tweetText = `${tweetText.slice(0, 277)}...`;
    }
  }

  try {
    const tweetUrl = 'https://api.x.com/2/tweets';
    let authHeader = '';

    if (config.apiKey && config.apiSecret && config.accessToken && config.accessSecret) {
      authHeader = generateOAuth1Header('POST', tweetUrl, config);
    } else if (config.bearerToken || config.accessToken) {
      authHeader = `Bearer ${config.bearerToken || config.accessToken}`;
    }

    console.log('[Twitter Publisher] Dispatching tweet to api.x.com/2/tweets...');
    let res = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
    });

    let data = await res.json().catch(() => ({}));
    let wwwAuth = res.headers.get('www-authenticate') || '';
    console.log('[Twitter Publisher] Attempt 1 status:', res.status, 'auth:', wwwAuth, JSON.stringify(data));

    // If OAuth 1.0 returned 401 Unauthorized, attempt fallback with Bearer token
    if (res.status === 401 && (config.bearerToken || config.accessToken)) {
      const fallbackToken = config.bearerToken || config.accessToken;
      console.log('[Twitter Publisher] Retrying with Bearer token...');
      const retryRes = await fetch(tweetUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${fallbackToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweetText }),
      });

      const retryData = await retryRes.json().catch(() => ({}));
      if (retryRes.ok && retryData.data?.id) {
        res = retryRes;
        data = retryData;
        console.log('[Twitter Publisher] Bearer token retry succeeded!');
      } else {
        wwwAuth = retryRes.headers.get('www-authenticate') || wwwAuth;
        console.log('[Twitter Publisher] Bearer token retry status:', retryRes.status, JSON.stringify(retryData));
      }
    }

    if (!res.ok || !data.data?.id) {
      const errorMsg =
        data.errors?.[0]?.message ||
        (wwwAuth ? `Twitter auth error: ${wwwAuth}` : '') ||
        data.detail ||
        data.title ||
        `Twitter publish failed (HTTP ${res.status})`;
      await recordSocialShare({
        postId: params.postId,
        platform: 'twitter',
        status: 'failed',
        contentText: tweetText,
        articleUrl,
        imageUrl,
        apiResponse: { ...data, wwwAuthenticate: wwwAuth, httpStatus: res.status },
        errorMessage: errorMsg,
      });

      return {
        success: false,
        platform: 'twitter',
        error: errorMsg,
        details: { ...data, wwwAuthenticate: wwwAuth, httpStatus: res.status },
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
