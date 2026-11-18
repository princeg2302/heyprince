import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URI ||
    'postgresql://postgres.muzbzrxwbanzsjvgtexp:HeyPrinceDB2026%21@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log('[Migration] Connecting to PostgreSQL database...');
  try {
    const schemaSqlPath = path.resolve(__dirname, '../lib/video-studio/schema.sql');
    const sql = fs.readFileSync(schemaSqlPath, 'utf8');

    console.log('[Migration] Applying Video Studio schema...');
    await pool.query(sql);

    console.log('[Migration] SUCCESS! Video Studio schema applied successfully.');
  } catch (err: any) {
    console.error('[Migration] Failed to apply schema:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
