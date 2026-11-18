import { sanitizeEmDashes } from '../ai-content-sanitizer';
import { query } from '../outreach/db';
import { recordSocialShare } from './db';
import { PlatformConfigStatus, SocialPublishParams, SocialPublishResult } from './types';

export interface WhatsAppConfig {
  accessToken: string;
  channelId?: string;
  phoneId?: string;
  apiVersion: string;
  isConfigured: boolean;
}

export function getWhatsAppConfig(): WhatsAppConfig {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || '';
  const channelId = process.env.WHATSAPP_CHANNEL_ID?.trim() || undefined;
  const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID?.trim() || undefined;
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';

  const isConfigured = Boolean(accessToken && (channelId || phoneId));

  return {
    accessToken,
    channelId,
    phoneId,
    apiVersion,
    isConfigured,
  };
}

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppConfig().isConfigured;
}

export function getWhatsAppChannelStatus(): PlatformConfigStatus {
  const config = getWhatsAppConfig();
  const missingKeys: string[] = [];

  if (!config.accessToken) missingKeys.push('WHATSAPP_ACCESS_TOKEN');
  if (!config.channelId && !config.phoneId) missingKeys.push('WHATSAPP_CHANNEL_ID (or WHATSAPP_BUSINESS_PHONE_ID)');

  return {
    platform: 'whatsapp',
    name: 'WhatsApp Channel',
    isConfigured: config.isConfigured,
    accountIdentifier: config.channelId
      ? `Channel: ${config.channelId}`
      : config.phoneId
      ? `Phone ID: ${config.phoneId}`
      : undefined,
    missingKeys,
  };
}

/**
 * Publishes an article broadcast to a WhatsApp Channel (Newsletter)
 * using the official Meta Cloud API.
 */
export async function publishToWhatsAppChannel(
  params: SocialPublishParams
): Promise<SocialPublishResult> {
  const config = getWhatsAppConfig();

  if (!config.isConfigured) {
    const errorMsg = 'WhatsApp Channel is not configured. Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_CHANNEL_ID.';
    await recordSocialShare({
      postId: params.postId,
      platform: 'whatsapp',
      status: 'skipped',
      errorMessage: errorMsg,
    });
    return {
      success: false,
      platform: 'whatsapp',
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
      platform: 'whatsapp',
      error: `Post #${params.postId} not found in database.`,
    };
  }

  const post = postRows[0];
  const articleUrl = params.articleUrl || `https://heyprince.in/insights/${post.slug}/`;
  let imageUrl = params.imageUrl || post.cover_image;

  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `https://heyprince.in${imageUrl}`;
  }

  // 2. Format WhatsApp broadcast message with markdown
  let broadcastText = params.customText?.trim();
  if (!broadcastText) {
    const title = post.title || 'Engineering Insight';
    const excerpt = post.excerpt || post.seo_description || '';

    broadcastText = [
      `*${title}*`,
      '',
      excerpt ? `${excerpt}\n` : '',
      `Read full insight on HeyPrince:`,
      `${articleUrl}`,
      '',
      `#Tech #Engineering #HeyPrince`,
    ]
      .join('\n')
      .trim();
  }

  broadcastText = sanitizeEmDashes(broadcastText);

  try {
    // 3. Dispatch to Meta Graph API
    // Use Channel ID (newsletter endpoint) or Phone ID (messages endpoint)
    const targetEndpointId = config.channelId || config.phoneId;
    const url = `https://graph.facebook.com/${config.apiVersion}/${targetEndpointId}/messages`;

    let payload: Record<string, any>;

    // If an image is available (and not SVG), send as image message with caption
    if (imageUrl && !imageUrl.endsWith('.svg')) {
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        type: 'image',
        image: {
          link: imageUrl,
          caption: broadcastText,
        },
      };
    } else {
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        type: 'text',
        text: {
          preview_url: true,
          body: broadcastText,
        },
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errorMsg = data.error?.message || `WhatsApp API error (HTTP ${res.status})`;
      await recordSocialShare({
        postId: params.postId,
        platform: 'whatsapp',
        status: 'failed',
        contentText: broadcastText,
        articleUrl,
        imageUrl,
        apiResponse: data,
        errorMessage: errorMsg,
      });

      return {
        success: false,
        platform: 'whatsapp',
        error: errorMsg,
        details: data,
      };
    }

    const messageId = data.messages?.[0]?.id || `wamid-${Date.now()}`;
    const channelPostUrl = config.channelId
      ? `https://whatsapp.com/channel/${config.channelId}`
      : undefined;

    await recordSocialShare({
      postId: params.postId,
      platform: 'whatsapp',
      status: 'published',
      externalPostId: messageId,
      externalPostUrl: channelPostUrl,
      contentText: broadcastText,
      articleUrl,
      imageUrl,
      apiResponse: data,
    });

    return {
      success: true,
      platform: 'whatsapp',
      externalPostId: messageId,
      externalPostUrl: channelPostUrl,
      details: data,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Unexpected exception publishing to WhatsApp Channel.';
    await recordSocialShare({
      postId: params.postId,
      platform: 'whatsapp',
      status: 'failed',
      contentText: broadcastText,
      articleUrl,
      imageUrl,
      errorMessage: errorMsg,
    });

    return {
      success: false,
      platform: 'whatsapp',
      error: errorMsg,
    };
  }
}
