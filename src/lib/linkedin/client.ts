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

export function getLinkedInAuthorizationUrl(state: string): string {
  const config = getLinkedInConfig();
  if (!config.clientId) {
    throw new Error('LINKEDIN_CLIENT_ID is not configured in server environment.');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: config.scope,
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
}): Promise<LinkedInConnectionRecord> {
  const expiresAt = new Date(Date.now() + params.expiresInSeconds * 1000).toISOString();
  const refreshExpiresAt = params.refreshTokenExpiresInSeconds
    ? new Date(Date.now() + params.refreshTokenExpiresInSeconds * 1000).toISOString()
    : null;

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
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
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
// 8. Publish Article to Personal Profile (Supported LinkedIn API)
// ============================================================================

export async function publishArticleToLinkedIn(params: {
  postId: number;
  customCommentary?: string;
}): Promise<PublishArticleResult> {
  // 1. Get active connection
  const connection = await getActiveLinkedInConnection();
  if (!connection) {
    return {
      success: false,
      error: 'No active LinkedIn connection found. Please connect your LinkedIn profile first.',
    };
  }

  // Ensure Person URN is valid and not a placeholder
  if (!connection.person_urn || connection.person_urn.includes('UNKNOWN')) {
    return {
      success: false,
      error:
        'LinkedIn Person URN is missing or UNKNOWN. Please enter your Member ID in the Settings / Modal, or enable "Sign In with LinkedIn using OpenID Connect" in your Developer Portal and reconnect.',
    };
  }

  // 2. Fetch article details from database
  const postRows = await query(
    `SELECT id, title, slug, excerpt, seo_description, status FROM posts WHERE id = $1 LIMIT 1;`,
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

  // Build clean commentary
  const commentaryText =
    params.customCommentary?.trim() ||
    `${post.title}\n\n${post.excerpt || post.seo_description || ''}\n\nRead the full engineering insight on HeyPrince:\n${articleUrl}`.trim();

  // Active LinkedIn API Version (202601 / 202510)
  const activeVersion = process.env.LINKEDIN_API_VERSION || '202601';

  // Attempt 1: Modern versioned Posts API (`POST https://api.linkedin.com/rest/posts`)
  try {
    const postPayload = {
      author: connection.person_urn,
      commentary: commentaryText,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        article: {
          source: articleUrl,
          title: post.title,
          description: post.excerpt || post.seo_description || 'Engineering insight by Prince',
        },
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    const restResponse = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': activeVersion,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    if (restResponse.status === 201) {
      const restliId = restResponse.headers.get('x-restli-id') || restResponse.headers.get('x-linkedin-id') || '';
      const postUrn = restliId ? (restliId.startsWith('urn:li:') ? restliId : `urn:li:share:${restliId}`) : 'urn:li:post:published';
      const feedUrl = restliId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}/` : 'https://www.linkedin.com/feed/';

      // Save successful share
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
          connection.person_urn,
          commentaryText,
          articleUrl,
          JSON.stringify({ status: 201, postUrn, endpoint: 'rest/posts' }),
        ]
      );

      // Update connection last_published_at
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

    // If rest/posts returned non-201, read error response
    let restErrorText = '';
    let restErrorJson: any = null;
    try {
      restErrorJson = await restResponse.json();
      restErrorText = restErrorJson.message || restErrorJson.description || JSON.stringify(restErrorJson);
    } catch {
      restErrorText = await restResponse.text();
    }

    console.warn(`[LinkedIn rest/posts] Status ${restResponse.status}:`, restErrorText);

    // Attempt 2: Fallback to /v2/ugcPosts
    console.info('[LinkedIn] Attempting fallback to /v2/ugcPosts endpoint...');
    const ugcPayload = {
      author: connection.person_urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: commentaryText,
          },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              originalUrl: articleUrl,
              title: {
                text: post.title,
              },
              description: {
                text: post.excerpt || post.seo_description || 'Engineering insight',
              },
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
          connection.person_urn,
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

    // Both endpoints failed
    const finalError =
      ugcData.message ||
      restErrorText ||
      `LinkedIn API rejected post with status ${ugcResponse.status || restResponse.status}`;

    // Record failure in database for auditing
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
        connection.person_urn,
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
  } catch (netErr: any) {
    const errorMsg = netErr?.message || 'Network exception during LinkedIn publishing';
    console.error('[LinkedIn Publish] Unexpected error:', netErr);

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
      [post.id, connection.person_urn, commentaryText, articleUrl, errorMsg]
    );

    return {
      success: false,
      error: errorMsg,
    };
  }
}

