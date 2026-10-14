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

export async function runDailyNewsMigration() {
  console.log('Running Daily AI News Automation database migrations on Supabase PostgreSQL...');

  // 1. Settings Table
  await query(`
    CREATE TABLE IF NOT EXISTS daily_news_settings (
      id SERIAL PRIMARY KEY,
      is_enabled BOOLEAN NOT NULL DEFAULT true,
      auto_generate BOOLEAN NOT NULL DEFAULT true,
      auto_publish_website BOOLEAN NOT NULL DEFAULT false,
      auto_publish_linkedin BOOLEAN NOT NULL DEFAULT false,
      schedule_cron VARCHAR(100) NOT NULL DEFAULT '30 3 * * *',
      schedule_display VARCHAR(100) NOT NULL DEFAULT '9:00 AM IST',
      topics TEXT[] NOT NULL DEFAULT ARRAY[
        'Artificial Intelligence & Tools',
        'Web Development & JavaScript Frameworks',
        'Software Engineering & Developer Tools',
        'Cybersecurity & Technology Security',
        'Startups & IT Industry Developments'
      ],
      lookback_hours INT NOT NULL DEFAULT 24,
      ai_provider VARCHAR(50) NOT NULL DEFAULT 'gemini',
      ai_model VARCHAR(100) NOT NULL DEFAULT 'gemini-2.5-flash',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Ensure initial settings record exists
  const settingsRows = await query(`SELECT id FROM daily_news_settings LIMIT 1;`);
  if (!settingsRows || settingsRows.length === 0) {
    await query(`
      INSERT INTO daily_news_settings (
        is_enabled,
        auto_generate,
        auto_publish_website,
        auto_publish_linkedin,
        schedule_cron,
        schedule_display,
        lookback_hours,
        ai_provider,
        ai_model
      ) VALUES (
        true,
        true,
        false,
        false,
        '30 3 * * *',
        '9:00 AM IST',
        24,
        'gemini',
        'gemini-2.5-flash'
      );
    `);
    console.log('  Initial daily_news_settings row seeded.');
  }

  // 2. Sources Table
  await query(`
    CREATE TABLE IF NOT EXISTS daily_news_sources (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url TEXT NOT NULL UNIQUE,
      feed_type VARCHAR(50) NOT NULL DEFAULT 'rss',
      category VARCHAR(100) NOT NULL DEFAULT 'Tech & AI',
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_fetched_at TIMESTAMPTZ,
      last_status VARCHAR(50) DEFAULT 'ok',
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_daily_news_sources_active ON daily_news_sources(is_active);
  `);

  // Seed default trustworthy sources if empty
  const sourcesCount = await query(`SELECT COUNT(*) as count FROM daily_news_sources;`);
  if (parseInt(sourcesCount[0]?.count || '0', 10) === 0) {
    const defaultSources = [
      {
        name: 'TechCrunch (AI)',
        url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
        category: 'Artificial Intelligence',
      },
      {
        name: 'The Verge (Tech & AI)',
        url: 'https://www.theverge.com/rss/index.xml',
        category: 'Technology & AI',
      },
      {
        name: 'Ars Technica (IT & Security)',
        url: 'https://feeds.arstechnica.com/arstechnica/index',
        category: 'Software & Security',
      },
      {
        name: 'VentureBeat (AI & Machine Learning)',
        url: 'https://venturebeat.com/category/ai/feed/',
        category: 'Artificial Intelligence',
      },
      {
        name: 'Hacker News (Top Stories)',
        url: 'https://news.ycombinator.com/rss',
        category: 'Engineering & Startups',
      },
      {
        name: 'BleepingComputer (Cybersecurity)',
        url: 'https://www.bleepingcomputer.com/feed/',
        category: 'Cybersecurity',
      },
    ];

    for (const src of defaultSources) {
      await query(
        `INSERT INTO daily_news_sources (name, url, feed_type, category, is_active)
         VALUES ($1, $2, 'rss', $3, true)
         ON CONFLICT (url) DO NOTHING;`,
        [src.name, src.url, src.category]
      );
    }
    console.log('  Default trusted RSS sources seeded successfully.');
  }

  // 3. News Items Table (Deduplication & Storage)
  await query(`
    CREATE TABLE IF NOT EXISTS daily_news_items (
      id SERIAL PRIMARY KEY,
      source_id INTEGER REFERENCES daily_news_sources(id) ON DELETE SET NULL,
      source_name VARCHAR(255) NOT NULL,
      headline TEXT NOT NULL,
      url TEXT NOT NULL,
      url_hash VARCHAR(64) NOT NULL UNIQUE,
      summary TEXT,
      published_at TIMESTAMPTZ,
      discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_used BOOLEAN NOT NULL DEFAULT false,
      used_in_run_id INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_daily_news_items_hash ON daily_news_items(url_hash);
    CREATE INDEX IF NOT EXISTS idx_daily_news_items_published ON daily_news_items(published_at);
    CREATE INDEX IF NOT EXISTS idx_daily_news_items_used ON daily_news_items(is_used);
  `);

  // 4. Daily News Runs (Idempotent execution history)
  await query(`
    CREATE TABLE IF NOT EXISTS daily_news_runs (
      id SERIAL PRIMARY KEY,
      run_date VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      trigger_type VARCHAR(50) NOT NULL DEFAULT 'scheduled',
      sources_checked INT NOT NULL DEFAULT 0,
      items_discovered INT NOT NULL DEFAULT 0,
      duplicates_skipped INT NOT NULL DEFAULT 0,
      selected_items JSONB,
      article_title TEXT,
      article_slug TEXT,
      article_excerpt TEXT,
      article_content JSONB,
      linkedin_commentary TEXT,
      post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
      website_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      linkedin_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      linkedin_post_urn VARCHAR(255),
      linkedin_share_url TEXT,
      error_details JSONB,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_daily_news_runs_date ON daily_news_runs(run_date);
    CREATE INDEX IF NOT EXISTS idx_daily_news_runs_status ON daily_news_runs(status);
  `);

  console.log('✅ Daily AI News Automation database schema migrated successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('migrate-daily-news.ts')) {
  runDailyNewsMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

