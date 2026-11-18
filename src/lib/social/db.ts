import { query } from '../outreach/db';
import { SocialPlatform, SocialShareRecord } from './types';

let tablesEnsured = false;

/**
 * Ensures the social_post_shares table exists in PostgreSQL.
 * Safe and idempotent.
 */
export async function ensureSocialTables(): Promise<void> {
  if (tablesEnsured) return;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS social_post_shares (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        platform VARCHAR(32) NOT NULL,
        external_post_id TEXT,
        external_post_url TEXT,
        status VARCHAR(32) NOT NULL,
        content_text TEXT,
        article_url TEXT,
        image_url TEXT,
        api_response JSONB,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_shares_post_platform 
      ON social_post_shares(post_id, platform);

      CREATE INDEX IF NOT EXISTS idx_social_shares_created_at 
      ON social_post_shares(created_at DESC);
    `);
    tablesEnsured = true;
  } catch (err: any) {
    console.warn('[SocialDB] Table initialization notice:', err?.message || err);
  }
}

/**
 * Inserts a record of a social publish attempt into the database.
 */
export async function recordSocialShare(params: {
  postId: number;
  platform: SocialPlatform;
  status: 'published' | 'failed' | 'skipped';
  externalPostId?: string | null;
  externalPostUrl?: string | null;
  contentText?: string | null;
  articleUrl?: string | null;
  imageUrl?: string | null;
  apiResponse?: any;
  errorMessage?: string | null;
}): Promise<SocialShareRecord | null> {
  await ensureSocialTables();

  try {
    const rows = await query<SocialShareRecord>(
      `
      INSERT INTO social_post_shares (
        post_id,
        platform,
        status,
        external_post_id,
        external_post_url,
        content_text,
        article_url,
        image_url,
        api_response,
        error_message,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *;
      `,
      [
        params.postId,
        params.platform,
        params.status,
        params.externalPostId || null,
        params.externalPostUrl || null,
        params.contentText || null,
        params.articleUrl || null,
        params.imageUrl || null,
        params.apiResponse ? JSON.stringify(params.apiResponse) : null,
        params.errorMessage || null,
      ]
    );

    return rows[0] || null;
  } catch (err: any) {
    console.error(`[SocialDB] Failed to record ${params.platform} share:`, err?.message || err);
    return null;
  }
}

/**
 * Returns all social shares associated with a specific blog post.
 */
export async function getSocialSharesForPost(postId: number): Promise<SocialShareRecord[]> {
  await ensureSocialTables();

  try {
    return await query<SocialShareRecord>(
      `SELECT * FROM social_post_shares WHERE post_id = $1 ORDER BY created_at DESC;`,
      [postId]
    );
  } catch (err: any) {
    console.warn('[SocialDB] Error fetching shares for post:', err?.message || err);
    return [];
  }
}

/**
 * Returns recent social shares across all platforms.
 */
export async function getRecentSocialShares(limit: number = 20): Promise<SocialShareRecord[]> {
  await ensureSocialTables();

  try {
    return await query<SocialShareRecord>(
      `SELECT * FROM social_post_shares ORDER BY created_at DESC LIMIT $1;`,
      [limit]
    );
  } catch (err: any) {
    console.warn('[SocialDB] Error fetching recent social shares:', err?.message || err);
    return [];
  }
}
