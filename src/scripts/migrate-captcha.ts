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

export async function runCaptchaMigration(): Promise<{ success: boolean; message: string }> {
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

  const sqlPath = path.resolve(dirname, '../lib/captcha/schema.sql');
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
    console.info('Connected to Supabase PostgreSQL. Applying CAPTCHA DDL...');
    await client.query(sql);
    console.info('✅ Custom CAPTCHA tables, indexes, RPC functions & RLS policies verified!');
    return {
      success: true,
      message: 'Custom CAPTCHA schema migration executed successfully.',
    };
  } catch (err: any) {
    console.error('❌ Migration failed:', err);
    return {
      success: false,
      message: err?.message || 'Database migration exception',
    };
  } finally {
    await client.end().catch(() => {});
  }
}

// Direct execution
if (process.argv[1] && process.argv[1].includes('migrate-captcha')) {
  runCaptchaMigration().then((res) => {
    if (!res.success) {
      console.error(res.message);
      process.exit(1);
    } else {
      console.log(res.message);
      process.exit(0);
    }
  });
}

