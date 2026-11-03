import { query } from '../outreach/db';
import { generateAvatarUrl } from './security';

export interface CommentNode {
  id: number;
  postSlug: string;
  parentId: number | null;
  authorName: string;
  authorAvatar: string;
  content: string;
  likesCount: number;
  hasLiked?: boolean;
  isAuthor: boolean;
  createdAt: string;
  replies?: CommentNode[];
}

export interface RawCommentRow {
  id: number;
  post_slug: string;
  parent_id: number | null;
  author_name: string;
  author_email: string;
  author_avatar: string | null;
  content: string;
  likes_count: number;
  status: string;
  is_author: boolean;
  ip_hash: string;
  user_agent: string | null;
  created_at: string;
  has_liked?: boolean;
}

// ============================================================================
// 1. Rate Limiting Operations (Anti-DDoS / Anti-Spam)
// ============================================================================

export async function checkRateLimit(
  ipHash: string,
  actionType: 'comment' | 'like',
  maxCount: number,
  windowSeconds: number
): Promise<boolean> {
  // Prune entries older than 2 hours occasionally
  if (Math.random() < 0.05) {
    await query(`DELETE FROM discussion_rate_limits WHERE created_at < NOW() - INTERVAL '2 hours';`).catch(() => {});
  }

  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count
     FROM discussion_rate_limits
     WHERE ip_hash = $1
       AND action_type = $2
       AND created_at > NOW() - ($3 || ' seconds')::INTERVAL;`,
    [ipHash, actionType, windowSeconds.toString()]
  );

  const count = parseInt(rows[0]?.count || '0', 10);
  return count < maxCount;
}

export async function recordRateLimitAction(ipHash: string, actionType: 'comment' | 'like'): Promise<void> {
  await query(
    `INSERT INTO discussion_rate_limits (ip_hash, action_type) VALUES ($1, $2);`,
    [ipHash, actionType]
  );
}

// ============================================================================
// 2. Blog Post Likes Operations
// ============================================================================

export async function getBlogLikes(slug: string, clientHash?: string): Promise<{ count: number; hasLiked: boolean }> {
  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM blog_likes WHERE post_slug = $1;`,
    [slug]
  );
  const count = parseInt(countRows[0]?.count || '0', 10);

  let hasLiked = false;
  if (clientHash) {
    const likeCheck = await query<{ id: number }>(
      `SELECT id FROM blog_likes WHERE post_slug = $1 AND client_hash = $2 LIMIT 1;`,
      [slug, clientHash]
    );
    hasLiked = likeCheck.length > 0;
  }

  return { count, hasLiked };
}

export async function toggleBlogLike(slug: string, clientHash: string): Promise<{ count: number; hasLiked: boolean }> {
  // Check if like exists
  const existing = await query<{ id: number }>(
    `SELECT id FROM blog_likes WHERE post_slug = $1 AND client_hash = $2 LIMIT 1;`,
    [slug, clientHash]
  );

  if (existing.length > 0) {
    // Remove like
    await query(
      `DELETE FROM blog_likes WHERE post_slug = $1 AND client_hash = $2;`,
      [slug, clientHash]
    );
  } else {
    // Add like
    await query(
      `INSERT INTO blog_likes (post_slug, client_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
      [slug, clientHash]
    );
  }

  return getBlogLikes(slug, clientHash);
}

// ============================================================================
// 3. Comments & Threaded Discussion Operations
// ============================================================================

export async function getCommentsTree(slug: string, clientHash?: string): Promise<{ count: number; comments: CommentNode[] }> {
  let rows: RawCommentRow[];

  if (clientHash) {
    rows = await query<RawCommentRow>(
      `SELECT 
         c.id, c.post_slug, c.parent_id, c.author_name, c.author_avatar,
         c.content, c.likes_count, c.is_author, c.created_at,
         CASE WHEN cl.id IS NOT NULL THEN true ELSE false END as has_liked
       FROM blog_comments c
       LEFT JOIN comment_likes cl ON cl.comment_id = c.id AND cl.client_hash = $2
       WHERE c.post_slug = $1 AND c.status = 'approved'
       ORDER BY c.created_at ASC;`,
      [slug, clientHash]
    );
  } else {
    rows = await query<RawCommentRow>(
      `SELECT 
         c.id, c.post_slug, c.parent_id, c.author_name, c.author_avatar,
         c.content, c.likes_count, c.is_author, c.created_at,
         false as has_liked
       FROM blog_comments c
       WHERE c.post_slug = $1 AND c.status = 'approved'
       ORDER BY c.created_at ASC;`,
      [slug]
    );
  }

  const totalCount = rows.length;

  // Build recursive thread tree
  const commentMap = new Map<number, CommentNode>();
  const rootComments: CommentNode[] = [];

  // Step 1: Map raw rows into clean client-safe nodes (never expose email or ip)
  for (const r of rows) {
    const node: CommentNode = {
      id: r.id,
      postSlug: r.post_slug,
      parentId: r.parent_id,
      authorName: r.author_name,
      authorAvatar: r.author_avatar || generateAvatarUrl('', r.author_name),
      content: r.content,
      likesCount: r.likes_count || 0,
      hasLiked: Boolean(r.has_liked),
      isAuthor: Boolean(r.is_author),
      createdAt: r.created_at,
      replies: [],
    };
    commentMap.set(r.id, node);
  }

  // Step 2: Assemble parent-child tree
  for (const r of rows) {
    const node = commentMap.get(r.id)!;
    if (r.parent_id && commentMap.has(r.parent_id)) {
      const parent = commentMap.get(r.parent_id)!;
      parent.replies = parent.replies || [];
      parent.replies.push(node);
    } else {
      rootComments.push(node);
    }
  }

  // Reverse root comments so newest threads appear at top (while nested replies remain chronological)
  rootComments.reverse();

  return {
    count: totalCount,
    comments: rootComments,
  };
}

export async function createComment(data: {
  postSlug: string;
  parentId?: number | null;
  authorName: string;
  authorEmail: string;
  content: string;
  ipHash: string;
  userAgent?: string;
  isAuthor?: boolean;
}): Promise<CommentNode> {
  const avatarUrl = generateAvatarUrl(data.authorEmail, data.authorName);

  const rows = await query<RawCommentRow>(
    `INSERT INTO blog_comments (
       post_slug, parent_id, author_name, author_email, author_avatar,
       content, is_author, ip_hash, user_agent, status
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved'
     ) RETURNING id, post_slug, parent_id, author_name, author_avatar, content, likes_count, is_author, created_at;`,
    [
      data.postSlug,
      data.parentId || null,
      data.authorName,
      data.authorEmail,
      avatarUrl,
      data.content,
      Boolean(data.isAuthor),
      data.ipHash,
      data.userAgent || null,
    ]
  );

  const r = rows[0];
  return {
    id: r.id,
    postSlug: r.post_slug,
    parentId: r.parent_id,
    authorName: r.author_name,
    authorAvatar: r.author_avatar || avatarUrl,
    content: r.content,
    likesCount: 0,
    hasLiked: false,
    isAuthor: Boolean(r.is_author),
    createdAt: r.created_at,
    replies: [],
  };
}

// ============================================================================
// 4. Individual Comment Likes
// ============================================================================

export async function toggleCommentLike(
  commentId: number,
  clientHash: string
): Promise<{ likesCount: number; hasLiked: boolean }> {
  const existing = await query<{ id: number }>(
    `SELECT id FROM comment_likes WHERE comment_id = $1 AND client_hash = $2 LIMIT 1;`,
    [commentId, clientHash]
  );

  let hasLiked = false;
  if (existing.length > 0) {
    await query(`DELETE FROM comment_likes WHERE comment_id = $1 AND client_hash = $2;`, [commentId, clientHash]);
    await query(`UPDATE blog_comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1;`, [commentId]);
    hasLiked = false;
  } else {
    await query(`INSERT INTO comment_likes (comment_id, client_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING;`, [commentId, clientHash]);
    await query(`UPDATE blog_comments SET likes_count = likes_count + 1 WHERE id = $1;`, [commentId]);
    hasLiked = true;
  }

  const updatedRows = await query<{ likes_count: number }>(
    `SELECT likes_count FROM blog_comments WHERE id = $1;`,
    [commentId]
  );
  const likesCount = updatedRows[0]?.likes_count || 0;

  return { likesCount, hasLiked };
}
