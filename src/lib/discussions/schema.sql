-- ============================================================================
-- Blog Discussions, Threaded Comments & Dynamic Likes Schema
-- Protected with Cyber-Defense Constraints, Parameterized Queries & Anti-Spam
-- ============================================================================

-- 1. Blog Post Likes Table
CREATE TABLE IF NOT EXISTS blog_likes (
  id SERIAL PRIMARY KEY,
  post_slug VARCHAR(255) NOT NULL,
  client_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_blog_post_like UNIQUE (post_slug, client_hash)
);

CREATE INDEX IF NOT EXISTS idx_blog_likes_slug ON blog_likes(post_slug);

-- 2. Blog Comments Table (Supports Nested Threading via parent_id)
CREATE TABLE IF NOT EXISTS blog_comments (
  id SERIAL PRIMARY KEY,
  post_slug VARCHAR(255) NOT NULL,
  parent_id INT REFERENCES blog_comments(id) ON DELETE CASCADE DEFAULT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_avatar VARCHAR(500) DEFAULT NULL,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'approved', -- 'approved', 'flagged', 'hidden'
  is_author BOOLEAN DEFAULT FALSE,
  ip_hash VARCHAR(64) NOT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_slug ON blog_comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created ON blog_comments(created_at DESC);

-- 3. Individual Comment Likes Table
CREATE TABLE IF NOT EXISTS comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INT REFERENCES blog_comments(id) ON DELETE CASCADE NOT NULL,
  client_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_comment_like UNIQUE (comment_id, client_hash)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

-- 4. Discussion Rate Limiting Table (Anti-DDoS / Anti-Flood Protection)
CREATE TABLE IF NOT EXISTS discussion_rate_limits (
  id SERIAL PRIMARY KEY,
  ip_hash VARCHAR(64) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'comment' or 'like'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussion_rate_limits ON discussion_rate_limits(ip_hash, action_type, created_at DESC);

