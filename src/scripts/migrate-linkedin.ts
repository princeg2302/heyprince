import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../lib/outreach/db';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const envLocal = path.resolve(dirname, '../../.env.local');
if (typeof (process as any).loadEnvFile === 'function' && fs.existsSync(envLocal)) {
  (process as any).loadEnvFile(envLocal);
}

async function migrate() {
  console.log('Running LinkedIn Supabase migrations...');
  await query(`
    CREATE TABLE IF NOT EXISTS linkedin_connections (
      id SERIAL PRIMARY KEY,
      admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      person_urn VARCHAR(255) NOT NULL,
      member_id VARCHAR(255),
      name VARCHAR(255),
      headline TEXT,
      avatar_url TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      refresh_expires_at TIMESTAMPTZ,
      scope VARCHAR(255) NOT NULL DEFAULT 'w_member_social',
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS linkedin_post_shares (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      linkedin_post_urn VARCHAR(255),
      author_urn VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'published',
      commentary TEXT,
      article_url TEXT NOT NULL,
      api_response JSONB,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_linkedin_connections_active ON linkedin_connections(is_active);
    CREATE INDEX IF NOT EXISTS idx_linkedin_post_shares_post_id ON linkedin_post_shares(post_id);
  `);
  console.log('LinkedIn tables created successfully.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
