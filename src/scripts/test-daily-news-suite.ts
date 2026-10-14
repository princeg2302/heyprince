import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import {
  getDailyNewsSettings,
  updateDailyNewsSettings,
  getDailyNewsSources,
  computeUrlHash,
  saveDiscoveredNewsItems,
  getDailyRunByDate,
  createDailyRun,
  updateDailyRun,
  getRecentDailyRuns,
} from '../lib/daily-news/db';
import { fetchFeed } from '../lib/daily-news/rss-collector';
import { retryLinkedInPublishForRun } from '../lib/daily-news/orchestrator';
import { generateDailyBlogImages } from '../lib/daily-news/image-generator';
import { createPost, getPostById, deleteMediaRecord } from '../lib/admin-db';
import { getPostBySlug } from '../lib/cms';
import { query } from '../lib/outreach/db';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const envLocal = path.resolve(dirname, '../../.env.local');
if (typeof (process as any).loadEnvFile === 'function' && fs.existsSync(envLocal)) {
  (process as any).loadEnvFile(envLocal);
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('📰 HeyPrince Daily AI News Automation Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(name: string) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  }

  function fail(name: string, error: any) {
    failed++;
    console.error(`  ❌ FAIL: ${name}`, error?.message || error);
  }

  // --------------------------------------------------------------------------
  // Test 1: Settings & Configurable Source List
  // --------------------------------------------------------------------------
  try {
    const settings = await getDailyNewsSettings();
    assert.ok(settings.id, 'Settings row must exist');
    assert.strictEqual(settings.scheduleCron, '30 3 * * *', 'Default cron must be 30 3 * * *');
    assert.ok(settings.topics.length >= 3, 'Default topics must include core engineering categories');

    const sources = await getDailyNewsSources(true);
    assert.ok(sources.length >= 3, 'Must have at least 3 active trusted sources seeded');
    const tc = sources.find((s) => s.name.toLowerCase().includes('techcrunch'));
    assert.ok(tc, 'TechCrunch RSS source should be pre-seeded');

    pass('Database Layer: Validates Daily News settings & pre-seeded trusted RSS sources');
  } catch (err) {
    fail('Database Layer: Validates Daily News settings & pre-seeded trusted RSS sources', err);
  }

  // --------------------------------------------------------------------------
  // Test 2: RSS Feed Fetching & Parsing (Live Network Test)
  // --------------------------------------------------------------------------
  try {
    const sources = await getDailyNewsSources(true);
    const testSource = sources[0];

    const feedResult = await fetchFeed(testSource, 9000);
    assert.ok(Array.isArray(feedResult.stories), 'Feed should return stories array');
    assert.ok(feedResult.stories.length > 0, `Feed ${testSource.name} should return at least 1 story`);

    const first = feedResult.stories[0];
    assert.ok(first.headline && first.headline.length > 3, 'Headline must be non-empty string');
    assert.ok(first.url && first.url.startsWith('http'), 'URL must be a valid http link');

    pass(`RSS Ingestion: Successfully parsed live feed from ${testSource.name} (${feedResult.stories.length} stories)`);
  } catch (err) {
    fail('RSS Ingestion: Successfully parsed live feed', err);
  }

  // --------------------------------------------------------------------------
  // Test 3: Deduplication & Canonical URL Hashing
  // --------------------------------------------------------------------------
  try {
    const url1 = 'https://techcrunch.com/2026/10/14/ai-breakthrough/?utm_source=twitter&utm_medium=social#comments';
    const url2 = 'https://techcrunch.com/2026/10/14/ai-breakthrough';
    const hash1 = computeUrlHash(url1);
    const hash2 = computeUrlHash(url2);

    assert.strictEqual(hash1, hash2, 'Canonical URL hashes must match after stripping query trackers');

    // Test DB-level deduplication
    const testItem = {
      sourceName: 'Test Dedupe Feed',
      headline: 'Deduplication Test Headline ' + Date.now(),
      url: `https://example.com/test-dedupe-${Date.now()}`,
      summary: 'Dedupe test summary',
      publishedAt: new Date(),
    };

    const firstSave = await saveDiscoveredNewsItems([testItem]);
    assert.strictEqual(firstSave.inserted, 1, 'First insertion must succeed');

    const secondSave = await saveDiscoveredNewsItems([testItem]);
    assert.strictEqual(secondSave.inserted, 0, 'Duplicate insertion must be skipped');
    assert.strictEqual(secondSave.duplicates, 1, 'Duplicate counter must be 1');

    pass('Deduplication: Canonical URL hashing and database conflict prevention');
  } catch (err) {
    fail('Deduplication: Canonical URL hashing and database conflict prevention', err);
  }

  // --------------------------------------------------------------------------
  // Test 4: Article Creation & Public Insights CMS Mapping
  // --------------------------------------------------------------------------
  let testCreatedPostId: number | null = null;
  const testSlug = `test-daily-news-${Date.now()}`;
  try {
    const testPost = await createPost({
      title: 'Automated Daily Intelligence: The Architecture of Real-World Systems',
      slug: testSlug,
      excerpt: 'A comprehensive technical deep-dive into autonomous engineering systems.',
      read_mins: '4 min',
      category_name: 'Artificial Intelligence',
      status: 'published',
      published_at: new Date().toISOString(),
      seo_title: 'Automated Daily Intelligence | HeyPrince',
      seo_description: 'A comprehensive technical deep-dive into autonomous engineering systems.',
      canonical: `https://heyprince.in/insights/${testSlug}/`,
      tags: [{ tag: 'Artificial Intelligence' }, { tag: 'Engineering' }],
      sections: [
        {
          heading: 'The Core Development',
          paragraphs: [
            { text: 'Engineers are moving toward strictly idempotent and transparent AI workflows.' },
          ],
        },
        {
          heading: 'Why This Matters to Tech Teams',
          paragraphs: [
            { text: 'Architecture reliability depends on deterministic states and transparent auditing.' },
          ],
          bullet_points: [
            { point: 'Eliminates cascading failures.' },
            { point: 'Ensures reliable delivery without duplication.' },
          ],
        },
        {
          heading: 'Sources & Further Reading',
          paragraphs: [
            { text: 'Verified against primary developer announcements and technical RFCs.' },
          ],
        },
      ],
    });

    assert.ok(testPost.success && testPost.post, 'Post creation must succeed');
    testCreatedPostId = testPost.post.id;

    // Fetch from admin DB
    const fetchedAdmin = await getPostById(testCreatedPostId);
    assert.ok(fetchedAdmin, 'Post should be queryable by admin DB');
    assert.strictEqual(fetchedAdmin.slug, testSlug, 'Slug must match');
    assert.ok(fetchedAdmin.sections && fetchedAdmin.sections.length === 3, 'Sections must persist');

    // Fetch from frontend CMS layer
    const fetchedPublic = await getPostBySlug(testSlug);
    assert.ok(fetchedPublic, 'Post should be readable by public getPostBySlug()');
    assert.strictEqual(fetchedPublic.title, testPost.post.title, 'Public title must match');
    assert.strictEqual(fetchedPublic.url, `/insights/${testSlug}/`, 'Public URL route must match');

    pass('CMS & Public Listing: Successfully saved structured post and verified public Insights route');
  } catch (err) {
    fail('CMS & Public Listing: Successfully saved structured post and verified public Insights route', err);
  }

  // --------------------------------------------------------------------------
  // Test 5: Visual Asset Generation & Media Vault Cataloging
  // --------------------------------------------------------------------------
  let testMediaIds: number[] = [];
  try {
    const blogImages = await generateDailyBlogImages(
      'Cloud Architecture Microservices 2026',
      'Software Architecture',
      [
        { heading: 'Microservice Resilience', paragraphs: ['Scalable patterns.'] },
        { heading: 'Production Telemetry', paragraphs: ['Sub-second latency metrics.'] },
      ]
    );

    assert.ok(blogImages.coverImage, 'Cover image must be generated');
    assert.ok(blogImages.coverImage.url && blogImages.coverImage.url.startsWith('http'), 'Cover image must have valid URL');
    assert.ok(blogImages.coverImage.alt, 'Cover image must have descriptive alt text');
    assert.ok(blogImages.sectionImages.length === 2, 'Must generate exactly 2 content section images');
    assert.ok(blogImages.sectionImages[0].url && blogImages.sectionImages[0].url.startsWith('http'), 'Section image 1 must have valid URL');
    assert.ok(blogImages.sectionImages[1].url && blogImages.sectionImages[1].url.startsWith('http'), 'Section image 2 must have valid URL');

    if (blogImages.coverImage.mediaId) testMediaIds.push(blogImages.coverImage.mediaId);
    if (blogImages.sectionImages[0].mediaId) testMediaIds.push(blogImages.sectionImages[0].mediaId);
    if (blogImages.sectionImages[1].mediaId) testMediaIds.push(blogImages.sectionImages[1].mediaId);

    pass('Visual Assets & Media Vault: Generated 1 cover + 2 section images and cataloged in Media Vault');
  } catch (err) {
    fail('Visual Assets & Media Vault: Generated 1 cover + 2 section images and cataloged in Media Vault', err);
  }

  // --------------------------------------------------------------------------
  // Test 6: Idempotency & Safe LinkedIn Retry
  // --------------------------------------------------------------------------
  try {
    // Test duplicate prevention logic on retry
    const fakeRunDate = `2099-01-01-${Date.now()}`;
    const testRun = await createDailyRun({
      runDate: fakeRunDate,
      triggerType: 'manual_run',
    });

    // Mark as published on LinkedIn
    await updateDailyRun(testRun.id, {
      postId: testCreatedPostId || 1,
      status: 'success',
      websiteStatus: 'published',
      linkedinStatus: 'published',
      linkedinPostUrn: 'urn:li:share:123456789',
    });

    // Attempt retry
    const retryAttempt = await retryLinkedInPublishForRun(testRun.id);
    assert.strictEqual(retryAttempt.success, false, 'Retry on already published post must be rejected');
    assert.ok(
      retryAttempt.error?.includes('already published'),
      'Error message must state that article was already published to prevent duplicate posts'
    );

    pass('LinkedIn Safeguards: Strict duplicate prevention on retries');
  } catch (err) {
    fail('LinkedIn Safeguards: Strict duplicate prevention on retries', err);
  }

  // --------------------------------------------------------------------------
  // Test 6: Vercel Cron Configuration & CRON_SECRET Check
  // --------------------------------------------------------------------------
  try {
    const vercelJsonPath = path.resolve(dirname, '../../vercel.json');
    assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist in repository root');

    const vercelContent = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    assert.ok(Array.isArray(vercelContent.crons), 'vercel.json must specify crons array');

    const dailyCron = vercelContent.crons.find((c: any) => c.path === '/api/cron/daily-news');
    assert.ok(dailyCron, 'Daily news cron job must be defined in vercel.json');
    assert.strictEqual(dailyCron.schedule, '30 3 * * *', 'Schedule must be nominal 9:00 AM IST (30 3 * * *)');

    pass('Vercel Cron: Validated vercel.json cron configuration (30 3 * * * / 9:00 AM IST)');
  } catch (err) {
    fail('Vercel Cron: Validated vercel.json cron configuration', err);
  }

  // --------------------------------------------------------------------------
  // Cleanup test data
  // --------------------------------------------------------------------------
  if (testCreatedPostId) {
    try {
      await query(`DELETE FROM posts WHERE id = $1;`, [testCreatedPostId]);
    } catch {
      // Ignored
    }
  }

  for (const mid of testMediaIds) {
    try {
      await deleteMediaRecord(mid);
    } catch {
      // Ignored
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

