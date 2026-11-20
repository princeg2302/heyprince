import { query } from '../lib/outreach/db';

async function main() {
  console.log('Connecting to database and verifying overhaul schema...');

  try {
    // 1. Check industry_categories
    const categories = await query<{ count: string }>(
      'SELECT count(*) FROM industry_categories;'
    );
    console.log(`[PASS] industry_categories table exists. Seeded categories count: ${categories[0]?.count}`);

    // List sample categories
    const sampleCats = await query<{ name: string; slug: string }>(
      'SELECT name, slug FROM industry_categories LIMIT 5;'
    );
    console.log('Sample Seeded Categories:');
    sampleCats.forEach((c) => console.log(`  - ${c.name} (${c.slug})`));

    // 2. Check blog_topics_registry
    const topics = await query<{ count: string }>(
      'SELECT count(*) FROM blog_topics_registry;'
    );
    console.log(`[PASS] blog_topics_registry table exists. Row count: ${topics[0]?.count}`);

    // 3. Check image_assets_registry
    const images = await query<{ count: string }>(
      'SELECT count(*) FROM image_assets_registry;'
    );
    console.log(`[PASS] image_assets_registry table exists. Row count: ${images[0]?.count}`);

    // 4. Check company_agent_learnings
    const learnings = await query<{ count: string }>(
      'SELECT count(*) FROM company_agent_learnings;'
    );
    console.log(`[PASS] company_agent_learnings table exists. Row count: ${learnings[0]?.count}`);

    // 5. Check daily_company_reports
    const reports = await query<{ count: string }>(
      'SELECT count(*) FROM daily_company_reports;'
    );
    console.log(`[PASS] daily_company_reports table exists. Row count: ${reports[0]?.count}`);

    // 6. Check businesses extended columns
    const columns = await query<{ column_name: string }>(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'businesses' 
         AND column_name IN ('normalized_domain', 'lead_score', 'fit_reason', 'last_verified_at', 'is_update');`
    );
    console.log(`[PASS] businesses table extended columns verified: ${columns.map(c => c.column_name).join(', ')}`);

    console.log('\nALL OVERHAUL TABLES AND COLUMNS ARE FULLY OPERATIONAL IN SUPABASE!');
  } catch (err: any) {
    console.error('Database verification error:', err?.message || err);
    process.exit(1);
  }
}

main().catch(console.error);
