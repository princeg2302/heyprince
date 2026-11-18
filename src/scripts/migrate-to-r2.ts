import { runStorageMigration, getStorageMigrationStatus } from '../lib/storage/migrate';
import { isR2Configured } from '../lib/storage/r2';

async function main() {
  console.log('================================================================');
  console.log('HEYPRINCE.IN: SUPABASE TO CLOUDFLARE R2 ASSET MIGRATION');
  console.log('================================================================\n');

  console.log('1. Checking Cloudflare R2 Credentials & Environment...');
  const configured = isR2Configured();
  console.log(`Cloudflare R2 Configured: ${configured ? 'YES' : 'NO'}`);

  const status = await getStorageMigrationStatus();
  console.log(`- Supabase Media Storage Files: ${status.supabaseFileCount}`);
  console.log(`- Blog Posts Referencing Supabase: ${status.postsUsingSupabase}`);
  console.log(`- Media Records Referencing Supabase: ${status.mediaUsingSupabase}\n`);

  const isDryRun = process.argv.includes('--dry-run') || !configured;
  if (!configured) {
    console.warn('NOTICE: R2 credentials missing in local environment. Running in DRY-RUN mode to simulate migration plan.\n');
  } else if (isDryRun) {
    console.log('NOTICE: --dry-run flag supplied. Simulating migration without modifying storage or database.\n');
  } else {
    console.log('STARTING LIVE MIGRATION: Assets will be copied to Cloudflare R2 and database records will be updated.\n');
  }

  const result = await runStorageMigration({ dryRun: isDryRun });

  console.log('----------------------------------------------------------------');
  console.log('MIGRATION REPORT SUMMARY:');
  console.log('----------------------------------------------------------------');
  console.log(`- Success: ${result.success}`);
  console.log(`- Mode: ${result.dryRun ? 'DRY-RUN (Simulated)' : 'LIVE EXECUTION'}`);
  console.log(`- Total Source Files Found: ${result.totalSourceFiles}`);
  console.log(`- Newly Migrated: ${result.migratedCount}`);
  console.log(`- Already Present in R2: ${result.alreadyInR2Count}`);
  console.log(`- Failed: ${result.failedCount}`);
  console.log(`- Posts Updated in DB: ${result.postsUpdatedTotal}`);
  console.log(`- Media Records Updated in DB: ${result.mediaUpdatedTotal}`);
  console.log(`- Total Duration: ${(result.durationMs / 1000).toFixed(2)}s\n`);

  if (result.details.length > 0) {
    console.log('First 10 Asset Details:');
    result.details.slice(0, 10).forEach((d) => {
      console.log(`  [${d.status.toUpperCase()}] ${d.filename} -> ${d.r2Key}`);
    });
  }

  console.log('\n================================================================');
  console.log('MIGRATION TOOL COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
