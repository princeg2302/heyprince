import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Auto-load .env.local if present
const envLocal = path.resolve(dirname, '../../.env.local');
const envDefault = path.resolve(dirname, '../../.env');

if (typeof (process as any).loadEnvFile === 'function') {
  if (fs.existsSync(envLocal)) {
    (process as any).loadEnvFile(envLocal);
  } else if (fs.existsSync(envDefault)) {
    (process as any).loadEnvFile(envDefault);
  }
}

export async function runDiscussionsMigration(): Promise<{ success: boolean; message: string }> {
  let uri = process.env.DATABASE_URI || process.env.POSTGRES_URL;
  if (!uri) {
    return {
      success: false,
      message: 'DATABASE_URI environment variable is missing.',
    };
  }

  // Auto-route Supabase pooler from session mode (5432) to transaction mode (6543)
  if (uri.includes('pooler.supabase.com:5432')) {
    uri = uri.replace(':5432', ':6543');
  }

  const sqlPath = path.resolve(dirname, '../lib/discussions/schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new pg.Client({
    connectionString: uri,
    ssl:
      uri && !uri.includes('127.0.0.1') && !uri.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.info('Connected to Supabase PostgreSQL. Applying Discussions DDL...');
    await client.query(sql);
    console.info('✅ Blog Discussions, Threaded Comments & Dynamic Likes tables & indexes verified!');
    return {
      success: true,
      message: 'Blog discussions schema migration executed successfully.',
    };
  } catch (err: any) {
    console.error('❌ Discussions migration failed:', err);
    return {
      success: false,
      message: err?.message || 'Database migration exception',
    };
  } finally {
    await client.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate-discussions.ts')) {
  runDiscussionsMigration()
    .then((res) => {
      console.log(res.message);
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}

