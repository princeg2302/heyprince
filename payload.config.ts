import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';

import { Users, Media, Categories, Services, Posts, Leads } from './src/collections';

import fs from 'fs';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Auto-load .env.local in standalone script contexts
if (typeof process.loadEnvFile === 'function') {
  const envLocal = path.resolve(dirname, '.env.local');
  const envDefault = path.resolve(dirname, '.env');
  if (fs.existsSync(envLocal)) {
    process.loadEnvFile(envLocal);
  } else if (fs.existsSync(envDefault)) {
    process.loadEnvFile(envDefault);
  }
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Admin',
      icons: [{ url: '/favicon.svg' }],
    },
    components: {
      graphics: {
        Logo: './src/components/admin/Logo#Logo',
        Icon: './src/components/admin/Icon#Icon',
      },
      views: {
        dashboard: {
          Component: './src/components/admin/CustomDashboard#CustomDashboard',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Services, Posts, Leads],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'heyprince-payload-super-secret-key-2026-production',
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: (() => {
        let uri =
          process.env.DATABASE_URI ||
          process.env.POSTGRES_URL ||
          'postgresql://postgres:postgres@127.0.0.1:5432/heyprince';
        // Auto-switch Supabase pooler from session mode (5432) to transaction mode (6543)
        // to prevent EMAXCONNSESSION (15 max clients) on serverless deployments
        if (uri.includes('pooler.supabase.com:5432')) {
          uri = uri.replace(':5432', ':6543');
        }
        return uri;
      })(),
      ssl:
        process.env.DATABASE_URI &&
        !process.env.DATABASE_URI.includes('127.0.0.1') &&
        !process.env.DATABASE_URI.includes('localhost')
          ? { rejectUnauthorized: false }
          : false,
      max: 4,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    },
  }),
});

