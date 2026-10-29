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
  console.log('Running MFA and Social Links database migrations...');
  
  await query(`
    -- 1. Table for Admin Multi-Factor Authentication
    CREATE TABLE IF NOT EXISTS admin_mfa (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mfa_enabled BOOLEAN NOT NULL DEFAULT false,
      totp_secret TEXT,
      recovery_codes JSONB DEFAULT '[]'::jsonb,
      email_otp_code TEXT,
      email_otp_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_admin_mfa_user_id ON admin_mfa(user_id);

    -- 2. Table for Site Social Media Links
    CREATE TABLE IF NOT EXISTS site_social_links (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(50) NOT NULL UNIQUE,
      url TEXT NOT NULL,
      label VARCHAR(100),
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Seed default social media links if not present
    INSERT INTO site_social_links (platform, url, label, is_active)
    VALUES 
      ('linkedin', 'https://www.linkedin.com/in/mr-goyal/', 'LinkedIn', true),
      ('instagram', 'https://www.instagram.com/heyprince.in/', 'Instagram', true),
      ('whatsapp', 'https://wa.me/919120900010', 'WhatsApp', true),
      ('github', 'https://github.com/princeg2302', 'GitHub', true),
      ('twitter', '', 'Twitter / X', false),
      ('youtube', '', 'YouTube', false)
    ON CONFLICT (platform) DO NOTHING;
  `);

  console.log('MFA and Social Links tables created and seeded successfully.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

