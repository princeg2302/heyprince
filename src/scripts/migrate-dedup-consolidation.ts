import { query } from '../lib/outreach/db';

export async function runDedupConsolidationMigration() {
  console.log('[Migration] Starting JARVIS Consolidation & Deduplication Migration...');

  // 1. Alter chief_content_drafts to support expanded draft types and deduplication
  try {
    console.log('[Migration] Updating chief_content_drafts schema...');
    
    // Add columns if not existing
    await query(`
      ALTER TABLE chief_content_drafts 
      ADD COLUMN IF NOT EXISTS content_hash TEXT,
      ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
      ADD COLUMN IF NOT EXISTS target_url TEXT;
    `);

    // Safely update or drop restrictive draft_type check constraint if present
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'chief_content_drafts_draft_type_check'
        ) THEN
          ALTER TABLE chief_content_drafts DROP CONSTRAINT chief_content_drafts_draft_type_check;
        END IF;
      END $$;
    `);

    // Create helpful deduplication indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_chief_drafts_idempotency 
      ON chief_content_drafts(idempotency_key) 
      WHERE idempotency_key IS NOT NULL;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_chief_drafts_hash 
      ON chief_content_drafts(content_hash);
    `);

    console.log('[Migration] chief_content_drafts updated successfully.');
  } catch (err: any) {
    console.warn('[Migration] Note on chief_content_drafts update:', err?.message);
  }

  // 2. Ensure businesses table has normalized_domain column and index
  try {
    console.log('[Migration] Updating businesses table for canonical domain normalization...');
    await query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS normalized_domain TEXT;
    `);

    // Backfill normalized_domain for existing rows
    await query(`
      UPDATE businesses 
      SET normalized_domain = LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(COALESCE(domain, website_url, ''), '^https?://', '', 'i'),
            '^www\\.', '', 'i'
          ),
          '/.*$', ''
        )
      )
      WHERE normalized_domain IS NULL AND (domain IS NOT NULL OR website_url IS NOT NULL);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_normalized_domain 
      ON businesses(normalized_domain);
    `);

    console.log('[Migration] businesses table normalized_domain ready.');
  } catch (err: any) {
    console.warn('[Migration] Note on businesses table update:', err?.message);
  }

  // 3. Ensure media table has prompt_hash column for image deduplication
  try {
    console.log('[Migration] Updating media table for prompt_hash deduplication...');
    await query(`
      ALTER TABLE media 
      ADD COLUMN IF NOT EXISTS prompt_hash TEXT;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_media_prompt_hash 
      ON media(prompt_hash);
    `);

    console.log('[Migration] media table prompt_hash ready.');
  } catch (err: any) {
    console.warn('[Migration] Note on media table update:', err?.message);
  }

  // 4. Update chief_agents to deactivate redundant inbound_responder
  try {
    console.log('[Migration] Deactivating redundant inbound_responder agent...');
    await query(`
      UPDATE chief_agents 
      SET status = 'paused', 
          description = 'DEPRECATED: Inbound inquiries are now processed automatically via the unified Lead Intelligence pipeline.'
      WHERE id = 'inbound_responder';
    `);
    console.log('[Migration] inbound_responder deactivated in database.');
  } catch (err: any) {
    console.warn('[Migration] Note on chief_agents update:', err?.message);
  }

  console.log('[Migration] Migration completed successfully!');
}

runDedupConsolidationMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Migration] Failed:', err);
    process.exit(1);
  });
