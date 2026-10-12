import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runOutreachMigration } from '../lib/outreach/db-migrate';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Auto-load .env.local if present
const envLocal = path.resolve(dirname, '../../.env.local');
const envDefault = path.resolve(dirname, '../../.env');

if (typeof process.loadEnvFile === 'function') {
  if (fs.existsSync(envLocal)) {
    process.loadEnvFile(envLocal);
  } else if (fs.existsSync(envDefault)) {
    process.loadEnvFile(envDefault);
  }
}

async function main() {
  console.log('🚀 Running HeyPrince Lead Intelligence database migration...');
  const result = await runOutreachMigration();
  if (result.success) {
    console.log(result.message);
    process.exit(0);
  } else {
    console.error('Migration failed:', result.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

