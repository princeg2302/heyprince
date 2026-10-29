import { sanitizeEmDashes } from '../ai-content-sanitizer';
import crypto from 'crypto';
import { query } from '../outreach/db';
import {
  LinkedInConfig,
  LinkedInTokenResponse,
  LinkedInConnectionRecord,
  LinkedInShareRecord,
  PublishArticleResult,
} from './types';

// ============================================================================
// 1. Configuration & Security Settings
// ============================================================================

export function getLinkedInConfig(): LinkedInConfig {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim() || '';
  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI?.trim() ||
    'https://heyprince.in/api/linkedin/callback';
  const scope =
    process.env.LINKEDIN_SCOPE?.trim() || 'openid profile email w_member_social';
  const personUrnOverride = process.env.LINKEDIN_PERSON_URN?.trim() || undefined;

  const isConfigured = Boolean(clientId && clientSecret && redirectUri);

  return {
    clientId,
    clientSecret,
    redirectUri,
    scope,
    personUrnOverride,
    isConfigured,
  };
}

// Secret used for HMAC state signing to prevent CSRF
function getSigningSecret(): string {
  return (
    process.env.LINKEDIN_CLIENT_SECRET ||
    process.env.PAYLOAD_SECRET ||
    'heyprince-linkedin-secret-fallback'
  );
}

// ============================================================================
// 2. OAuth 2.0 State Security (CSRF & Replay Protection)
// ============================================================================

export function generateOAuthState(adminUserId?: number): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();
  const userIdStr = adminUserId ? String(adminUserId) : 'admin';
  const rawData = `${nonce}:${timestamp}:${userIdStr}`;

  const hmac = crypto
    .createHmac('sha256', getSigningSecret())
    .update(rawData)
    .digest('hex');

  // Payload: nonce:timestamp:userId:signature
  return Buffer.from(`${rawData}:${hmac}`).toString('base64url');
}

export function verifyOAuthState(state: string): {
  valid: boolean;
  adminUserId?: number;
  error?: string;
} {
  try {
    if (!state || typeof state !== 'string') {
      return { valid: false, error: 'State parameter missing' };
    }

    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) {
      return { valid: false, error: 'Malformed state payload' };
    }

    const [nonce, timestampStr, userIdStr, signature] = parts;
    const rawData = `${nonce}:${timestampStr}:${userIdStr}`;

    const expectedHmac = crypto
      .createHmac('sha256', getSigningSecret())
      .update(rawData)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedHmac, 'hex');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { valid: false, error: 'State HMAC signature verification failed (tampered)' };
    }

    const timestamp = parseInt(timestampStr, 10);
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - timestamp > fifteenMinutes) {
      return { valid: false, error: 'OAuth state has expired (exceeded 15 minutes)' };
    }

    const adminUserId = userIdStr !== 'admin' ? parseInt(userIdStr, 10) : undefined;
    return { valid: true, adminUserId };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Invalid state' };
  }
}

// ============================================================================
// 3. OAuth 2.0 Authorization URL
// ============================================================================

export function getLinkedInAuthorizationUrl(state: string, customScope?: string): string {
  const config = getLinkedInConfig();
  if (!config.clientId) {
    throw new Error('LINKEDIN_CLIENT_ID is not configured in server environment.');
  }

  const effectiveScope = customScope?.trim() || config.scope;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: effectiveScope,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

// ============================================================================
// 4. Token Exchange (Authorization Code -> Access Token)
// ============================================================================

export async function exchangeCodeForTokens(
  code: string
): Promise<LinkedInTokenResponse> {
  const config = getLinkedInConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error('LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET is missing.');
  }

  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data.error_description ||
      data.error ||
      `Token exchange failed with status ${response.status}`;
    console.error('[LinkedIn OAuth] Token exchange error:', data);
    throw new Error(errorMsg);
  }

  return data as LinkedInTokenResponse;
}

// ============================================================================
// 5. Member Profile & Person URN Resolution
// ============================================================================

export async function resolveMemberIdentity(
  accessToken: string,
  idToken?: string
): Promise<{
  personUrn: string;
  memberId?: string;
  name?: string;
  avatarUrl?: string;
}> {
  const config = getLinkedInConfig();

  // 1. If id_token (OIDC JWT) was returned, inspect claims
  if (idToken) {
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (payload.sub) {
          return {
            personUrn: `urn:li:person:${payload.sub}`,
            memberId: payload.sub,
            name: payload.name || payload.given_name || undefined,
            avatarUrl: payload.picture || undefined,
          };
        }
      }
    } catch (err) {
      console.warn('[LinkedIn] Could not decode id_token JWT:', err);
    }
  }

  // 2. Try OpenID Connect userinfo endpoint
  try {
    const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (userinfoRes.ok) {
      const uData = await userinfoRes.json();
      if (uData.sub) {
        return {
          personUrn: `urn:li:person:${uData.sub}`,
          memberId: uData.sub,
          name: uData.name || `${uData.given_name || ''} ${uData.family_name || ''}`.trim() || undefined,
          avatarUrl: uData.picture || undefined,
        };
      }
    }
  } catch (uErr) {
    console.warn('[LinkedIn] /v2/userinfo check error:', uErr);
  }

  // 3. Try legacy /v2/me endpoint
  try {
    const meRes = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData.id) {
        const fullName = `${meData.localizedFirstName || ''} ${meData.localizedLastName || ''}`.trim();
        return {
          personUrn: `urn:li:person:${meData.id}`,
          memberId: meData.id,
          name: fullName || undefined,
        };
      }
    }
  } catch (meErr) {
    console.warn('[LinkedIn] /v2/me check error:', meErr);
  }

  // 4. Check for environment override
  if (config.personUrnOverride) {
    const cleanUrn = config.personUrnOverride.startsWith('urn:li:person:')
      ? config.personUrnOverride
      : `urn:li:person:${config.personUrnOverride}`;
    return {
      personUrn: cleanUrn,
      memberId: cleanUrn.replace('urn:li:person:', ''),
      name: 'Authorized LinkedIn Profile',
    };
  }

  // 5. If only w_member_social is permitted without userinfo, construct placeholder or instruct
  throw new Error(
    'Unable to automatically detect LinkedIn Person URN. ' +
      'Please ensure "Sign In with LinkedIn using OpenID Connect" is added to your LinkedIn Developer Portal, ' +
      'or configure LINKEDIN_PERSON_URN in your server environment.'
  );
}

// ============================================================================
// 6. Supabase Connection Persistence
// ============================================================================

export async function saveLinkedInConnection(params: {
  adminUserId?: number | null;
  personUrn: string;
  memberId?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresInSeconds: number;
  refreshTokenExpiresInSeconds?: number | null;
  scope?: string;
  organizationUrn?: string | null;
  organizationName?: string | null;
  postTarget?: 'personal' | 'organization' | 'both';
}): Promise<LinkedInConnectionRecord> {
  const expiresAt = new Date(Date.now() + params.expiresInSeconds * 1000).toISOString();
  const refreshExpiresAt = params.refreshTokenExpiresInSeconds
    ? new Date(Date.now() + params.refreshTokenExpiresInSeconds * 1000).toISOString()
    : null;

  // Retrieve existing organization settings to persist across reconnections
  const prevRows = await query<LinkedInConnectionRecord>(
    `SELECT organization_urn, organization_name, post_target FROM linkedin_connections WHERE is_active = true ORDER BY id DESC LIMIT 1;`
  );
  const prev = prevRows && prevRows.length > 0 ? prevRows[0] : null;

  const targetOrgUrn = params.organizationUrn !== undefined ? params.organizationUrn : prev?.organization_urn || null;
  const targetOrgName = params.organizationName !== undefined ? params.organizationName : prev?.organization_name || null;
  const targetPostTarget = params.postTarget !== undefined ? params.postTarget : prev?.post_target || 'personal';

  // Deactivate any existing active connection for this user or overall
  await query(
    `UPDATE linkedin_connections SET is_active = false, updated_at = NOW() WHERE is_active = true`
  );

  const rows = await query<LinkedInConnectionRecord>(
    `
    INSERT INTO linkedin_connections (
      admin_user_id,
      person_urn,
      member_id,
      name,
      avatar_url,
      access_token,
      refresh_token,
      expires_at,
      refresh_expires_at,
      scope,
      is_active,
      organization_urn,
      organization_name,
      post_target,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, NOW(), NOW())
    RETURNING *;
    `,
    [
      params.adminUserId || null,
      params.personUrn,
      params.memberId || null,
      params.name || null,
      params.avatarUrl || null,
      params.accessToken,
      params.refreshToken || null,
      expiresAt,
      refreshExpiresAt,
      params.scope || 'w_member_social',
      targetOrgUrn,
      targetOrgName,
      targetPostTarget,
    ]
  );

  return rows[0];
}

export async function getActiveLinkedInConnection(): Promise<LinkedInConnectionRecord | null> {
  const rows = await query<LinkedInConnectionRecord>(
    `
    SELECT * FROM linkedin_connections 
    WHERE is_active = true 
    ORDER BY id DESC 
    LIMIT 1;
    `
  );

  if (!rows || rows.length === 0) return null;
  const conn = rows[0];

  // Check token expiration
  const isExpired = new Date(conn.expires_at).getTime() < Date.now();

  if (isExpired) {
    // If refresh token exists, attempt refresh
    if (conn.refresh_token) {
      try {
        const refreshed = await refreshAccessToken(conn.refresh_token);
        const updated = await saveLinkedInConnection({
          adminUserId: conn.admin_user_id,
          personUrn: conn.person_urn,
          memberId: conn.member_id,
          name: conn.name,
          avatarUrl: conn.avatar_url,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || conn.refresh_token,
          expiresInSeconds: refreshed.expires_in,
          refreshTokenExpiresInSeconds: refreshed.refresh_token_expires_in,
          scope: refreshed.scope || conn.scope,
        });
        return updated;
      } catch (refErr) {
        console.error('[LinkedIn] Failed to refresh expired token:', refErr);
        return null;
      }
    }
    return null;
  }

  return conn;
}

export async function disconnectLinkedInConnection(): Promise<boolean> {
  await query(
    `UPDATE linkedin_connections SET is_active = false, updated_at = NOW() WHERE is_active = true;`
  );
  return true;
}

// ============================================================================
// 7. Token Refresh Flow
// ============================================================================

export async function refreshAccessToken(refreshToken: string): Promise<LinkedInTokenResponse> {
  const config = getLinkedInConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error('LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET is missing.');
  }

  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Refresh token failed');
  }

  return data as LinkedInTokenResponse;
}

// ============================================================================
// 8. Upload Image to LinkedIn (REST Images API)
// ============================================================================

export async function uploadImageToLinkedIn(params: {
  accessToken: string;
  ownerUrn?: string;
  personUrn?: string;
  imageUrl: string;
  apiVersion?: string;
}): Promise<string | null> {
  try {
    const { accessToken, imageUrl } = params;
    const ownerUrn = params.ownerUrn || params.personUrn;
    if (!ownerUrn) {
      console.warn('[LinkedIn Image Upload] Missing ownerUrn or personUrn');
      return null;
    }
    const apiVersion = params.apiVersion || process.env.LINKEDIN_API_VERSION || '202601';

    if (!imageUrl || !imageUrl.trim()) {
      return null;
    }

    const fullUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `https://heyprince.in${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

    const imgFetch = await fetch(fullUrl, { signal: AbortSignal.timeout(15000) });
    if (!imgFetch.ok) {
      console.warn('[LinkedIn Image Upload] Could not fetch image from URL:', fullUrl, imgFetch.status);
      return null;
    }

    const rawBuffer = Buffer.from(await imgFetch.arrayBuffer());
    if (rawBuffer.length === 0) return null;

    let uploadBuffer = rawBuffer;
    let contentType = 'image/png';

    // Convert SVG or WebP to high-resolution PNG for LinkedIn API compatibility
    const isSvg = imageUrl.toLowerCase().includes('.svg') || rawBuffer.slice(0, 100).toString().includes('<svg');
    const isWebp = imageUrl.toLowerCase().includes('.webp');

    if (isSvg || isWebp) {
      try {
        const sharpModule = await import('sharp');
        const sharp = sharpModule.default || sharpModule;
        uploadBuffer = await sharp(rawBuffer).png({ quality: 95 }).toBuffer();
        contentType = 'image/png';
      } catch (sharpErr) {
        console.warn('[LinkedIn Image Upload] Sharp conversion notice:', sharpErr);
      }
    } else if (imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg')) {
      contentType = 'image/jpeg';
    }

    // Step 1: Initialize image upload
    const initResponse = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': apiVersion,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: ownerUrn,
        },
      }),
    });

    if (!initResponse.ok) {
      const errText = await initResponse.text();
      console.warn('[LinkedIn Image Upload] initializeUpload rejected:', initResponse.status, errText);
      return null;
    }

    const initData = await initResponse.json();
    const uploadUrl = initData?.value?.uploadUrl;
    const imageUrn = initData?.value?.image;

    if (!uploadUrl || !imageUrn) {
      console.warn('[LinkedIn Image Upload] Malformed initializeUpload response:', initData);
      return null;
    }

    // Step 2: Upload binary buffer to uploadUrl
    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
      body: uploadBuffer,
    });

    if (!putResponse.ok) {
      const putErrText = await putResponse.text();
      console.warn('[LinkedIn Image Upload] Binary upload failed:', putResponse.status, putErrText);
      return null;
    }

    console.info(`[LinkedIn Image Upload] Image successfully registered with LinkedIn: ${imageUrn}`);
    return imageUrn;
  } catch (err) {
    console.warn('[LinkedIn Image Upload] Exception during image upload to LinkedIn:', err);
    return null;
  }
}

// ============================================================================
// 9. Single Author Post Dispatcher (Supports Person & Organization URNs)
// ============================================================================

async function publishSinglePost(params: {
  connection: LinkedInConnectionRecord;
  authorUrn: string;
  target: 'personal' | 'organization';
  post: { id: number; title: string; slug: string; excerpt?: string; seo_description?: string };
  commentaryText: string;
  articleUrl: string;
  postImageUrl?: string | null;
  activeVersion: string;
}): Promise<{
  success: boolean;
  postUrn?: string;
  postUrl?: string;
  endpointUsed?: 'rest/posts' | 'v2/ugcPosts';
  error?: string;
  details?: any;
}> {
  const { connection, authorUrn, target, post, commentaryText, articleUrl, postImageUrl, activeVersion } = params;

  // 1. Proactively upload image to LinkedIn with this specific authorUrn as the owner
  let imageUrn: string | null = null;
  if (postImageUrl) {
    try {
      imageUrn = await uploadImageToLinkedIn({
        accessToken: connection.access_token,
        ownerUrn: authorUrn,
        imageUrl: postImageUrl,
        apiVersion: activeVersion,
      });
    } catch (imgErr) {
      console.warn(`[LinkedIn ${target}] Image upload exception:`, imgErr);
    }
  }

  // 2. Attempt rest/posts with authorUrn
  try {
    const postPayload: any = {
      author: authorUrn,
      commentary: commentaryText,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    if (imageUrn) {
      postPayload.content = {
        media: {
          title: post.title,
          id: imageUrn,
        },
      };
    } else {
      postPayload.content = {
        article: {
          source: articleUrl,
          title: post.title,
          description: post.excerpt || post.seo_description || 'Engineering insight by Prince',
        },
      };
    }

    let restResponse = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': activeVersion,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    if (!restResponse.ok && imageUrn) {
      console.warn(`[LinkedIn rest/posts ${target}] Media payload returned status ${restResponse.status}, trying article thumbnail payload...`);
      const articleThumbnailPayload = {
        ...postPayload,
        content: {
          article: {
            source: articleUrl,
            thumbnail: imageUrn,
            title: post.title,
            description: post.excerpt || post.seo_description || 'Engineering insight by Prince',
          },
        },
      };

      const retryRes = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': activeVersion,
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(articleThumbnailPayload),
      });

      if (retryRes.status === 201) {
        restResponse = retryRes;
      }
    }

    if (restResponse.status === 201) {
      const restliId = restResponse.headers.get('x-restli-id') || restResponse.headers.get('x-linkedin-id') || '';
      const postUrn = restliId ? (restliId.startsWith('urn:li:') ? restliId : `urn:li:share:${restliId}`) : 'urn:li:post:published';
      const feedUrl = restliId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}/` : 'https://www.linkedin.com/feed/';

      await query(
        `
        INSERT INTO linkedin_post_shares (
          post_id,
          linkedin_post_urn,
          author_urn,
          status,
          commentary,
          article_url,
          api_response,
          created_at
        ) VALUES ($1, $2, $3, 'published', $4, $5, $6, NOW());
        `,
        [
          post.id,
          postUrn,
          authorUrn,
          commentaryText,
          articleUrl,
          JSON.stringify({ status: 201, postUrn, target, endpoint: 'rest/posts', hasImage: Boolean(imageUrn) }),
        ]
      );

      await query(
        `UPDATE linkedin_connections SET last_published_at = NOW(), updated_at = NOW() WHERE id = $1;`,
        [connection.id]
      );

      return {
        success: true,
        postUrn,
        postUrl: feedUrl,
        endpointUsed: 'rest/posts',
      };
    }

    let restErrorText = '';
    let restErrorJson: any = null;
    try {
      restErrorJson = await restResponse.json();
      restErrorText = restErrorJson.message || restErrorJson.description || JSON.stringify(restErrorJson);
    } catch {
      restErrorText = await restResponse.text();
    }

    console.warn(`[LinkedIn rest/posts ${target}] Status ${restResponse.status}:`, restErrorText);

    if (target === 'organization' && restResponse.status === 403) {
      restErrorText = `${restErrorText} (Check that your LinkedIn Developer App has 'w_organization_social' permission and your profile is an admin of the page)`;
    }

    // 3. Fallback to /v2/ugcPosts
    const ugcPayload: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: commentaryText,
          },
          shareMediaCategory: imageUrn ? 'IMAGE' : 'ARTICLE',
          media: imageUrn
            ? [
                {
                  status: 'READY',
                  media: imageUrn,
                  title: { text: post.title },
                  description: { text: post.excerpt || post.seo_description || 'Engineering insight' },
                },
              ]
            : [
                {
                  status: 'READY',
                  originalUrl: articleUrl,
                  thumbnails: postImageUrl ? [{ url: postImageUrl }] : undefined,
                  title: { text: post.title },
                  description: { text: post.excerpt || post.seo_description || 'Engineering insight' },
                },
              ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const ugcResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(ugcPayload),
    });

    const ugcData = await ugcResponse.json();

    if (ugcResponse.ok && (ugcData.id || ugcResponse.status === 201)) {
      const ugcPostUrn = ugcData.id || 'urn:li:ugcPost:published';
      const feedUrl = `https://www.linkedin.com/feed/update/${encodeURIComponent(ugcPostUrn)}/`;

      await query(
        `
        INSERT INTO linkedin_post_shares (
          post_id,
          linkedin_post_urn,
          author_urn,
          status,
          commentary,
          article_url,
          api_response,
          created_at
        ) VALUES ($1, $2, $3, 'published', $4, $5, $6, NOW());
        `,
        [
          post.id,
          ugcPostUrn,
          authorUrn,
          commentaryText,
          articleUrl,
          JSON.stringify(ugcData),
        ]
      );

      await query(
        `UPDATE linkedin_connections SET last_published_at = NOW(), updated_at = NOW() WHERE id = $1;`,
        [connection.id]
      );

      return {
        success: true,
        postUrn: ugcPostUrn,
        postUrl: feedUrl,
        endpointUsed: 'v2/ugcPosts',
      };
    }

    const finalError =
      ugcData.message ||
      restErrorText ||
      `LinkedIn API rejected post for ${target} with status ${ugcResponse.status || restResponse.status}`;

    await query(
      `
      INSERT INTO linkedin_post_shares (
        post_id,
        author_urn,
        status,
        commentary,
        article_url,
        api_response,
        error_message,
        created_at
      ) VALUES ($1, $2, 'failed', $3, $4, $5, $6, NOW());
      `,
      [
        post.id,
        authorUrn,
        commentaryText,
        articleUrl,
        JSON.stringify({ restError: restErrorJson, ugcError: ugcData }),
        finalError,
      ]
    );

    return {
      success: false,
      error: finalError,
      details: { restError: restErrorJson, ugcError: ugcData },
    };
  } catch (err: any) {
    const errorMsg = err?.message || `Network error during LinkedIn ${target} publishing`;
    await query(
      `
      INSERT INTO linkedin_post_shares (
        post_id,
        author_urn,
        status,
        commentary,
        article_url,
        error_message,
        created_at
      ) VALUES ($1, $2, 'failed', $3, $4, $5, NOW());
      `,
      [post.id, authorUrn, commentaryText, articleUrl, errorMsg]
    );

    return {
      success: false,
      error: errorMsg,
    };
  }
}

// ============================================================================
// 10. Publish Article to LinkedIn (Personal Profile and/or Organization Page)
// ============================================================================

export async function publishArticleToLinkedIn(params: {
  postId: number;
  customCommentary?: string;
  imageUrl?: string;
  target?: 'personal' | 'organization' | 'both';
}): Promise<PublishArticleResult> {
  // 1. Get active connection
  const connection = await getActiveLinkedInConnection();
  if (!connection) {
    return {
      success: false,
      error: 'No active LinkedIn connection found. Please connect your LinkedIn profile first.',
    };
  }

  // 2. Fetch article details from database (including cover_image)
  const postRows = await query(
    `SELECT id, title, slug, excerpt, seo_description, status, cover_image FROM posts WHERE id = $1 LIMIT 1;`,
    [params.postId]
  );

  if (!postRows || postRows.length === 0) {
    return {
      success: false,
      error: `Article #${params.postId} not found in database.`,
    };
  }

  const post = postRows[0];
  const articleUrl = `https://heyprince.in/insights/${post.slug}/`;
  let postImageUrl = params.imageUrl || post.cover_image;

  // Zero-Duplicate Image Guarantee: If cover image is missing or a static placeholder,
  // generate a unique dynamic visual for this article and update database before dispatching
  if (!postImageUrl || postImageUrl === '/assets/blog/photo1.webp') {
    try {
      const { generateDynamicEditorialImageFallback } = await import('../daily-news/image-generator');
      const fallback = await generateDynamicEditorialImageFallback(post.title, 'Technology', 'cover');
      postImageUrl = fallback.url;
      await query(`UPDATE posts SET cover_image = $1 WHERE id = $2;`, [postImageUrl, post.id]);
    } catch (fallbackErr) {
      console.warn('[publishArticleToLinkedIn] Fallback cover image generation notice:', fallbackErr);
    }
  }

  // Build clean commentary
  const commentaryText = sanitizeEmDashes(
    params.customCommentary?.trim() ||
    `${post.title}\n\n${post.excerpt || post.seo_description || ''}\n\nRead the full engineering insight on HeyPrince:\n${articleUrl}`.trim()
  );

  // Active LinkedIn API Version
  const activeVersion = process.env.LINKEDIN_API_VERSION || '202601';

  // Effective Target
  const effectiveTarget = params.target || connection.post_target || 'personal';

  const results: {
    target: 'personal' | 'organization';
    authorUrn: string;
    postUrn?: string;
    postUrl?: string;
    success: boolean;
    error?: string;
  }[] = [];

  const shouldPostPersonal = effectiveTarget === 'personal' || effectiveTarget === 'both';
  const shouldPostOrg = effectiveTarget === 'organization' || effectiveTarget === 'both';

  // Step A: Publish to Personal Profile
  if (shouldPostPersonal) {
    if (connection.person_urn && !connection.person_urn.includes('UNKNOWN')) {
      const pRes = await publishSinglePost({
        connection,
        authorUrn: connection.person_urn,
        target: 'personal',
        post,
        commentaryText,
        articleUrl,
        postImageUrl,
        activeVersion,
      });
      results.push({
        target: 'personal',
        authorUrn: connection.person_urn,
        postUrn: pRes.postUrn,
        postUrl: pRes.postUrl,
        success: pRes.success,
        error: pRes.error,
      });
    } else {
      results.push({
        target: 'personal',
        authorUrn: connection.person_urn || 'urn:li:person:UNKNOWN',
        success: false,
        error: 'Personal Person URN is missing or unknown. Please reconnect or enter URN.',
      });
    }
  }

  // Step B: Publish to Organization Page
  if (shouldPostOrg) {
    if (connection.organization_urn && connection.organization_urn.trim()) {
      const oRes = await publishSinglePost({
        connection,
        authorUrn: connection.organization_urn,
        target: 'organization',
        post,
        commentaryText,
        articleUrl,
        postImageUrl,
        activeVersion,
      });
      results.push({
        target: 'organization',
        authorUrn: connection.organization_urn,
        postUrn: oRes.postUrn,
        postUrl: oRes.postUrl,
        success: oRes.success,
        error: oRes.error,
      });
    } else {
      results.push({
        target: 'organization',
        authorUrn: 'urn:li:organization:NOT_CONFIGURED',
        success: false,
        error: 'LinkedIn Organization Page is not configured. Please add your Company Page ID in Settings.',
      });
    }
  }

  const successfulShares = results.filter((r) => r.success);
  const primaryShare = successfulShares[0];

  if (successfulShares.length > 0) {
    return {
      success: true,
      postUrn: primaryShare.postUrn,
      postUrl: primaryShare.postUrl,
      endpointUsed: 'rest/posts',
      shares: results,
    };
  } else {
    const errorMsgs = results.map((r) => `[${r.target}]: ${r.error}`).join(' | ');
    return {
      success: false,
      error: errorMsgs || 'Failed to publish to any LinkedIn destination.',
      shares: results,
    };
  }
}

