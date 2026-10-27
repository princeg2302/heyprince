import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import crypto from 'crypto';
import {
  generateDailyBlogImages,
  generateDynamicEditorialSvg,
  generateDynamicEditorialImageFallback,
} from '../lib/daily-news/image-generator';
import {
  computeBufferHash,
  isImageContentDuplicate,
  recordMediaContentHash,
} from '../lib/deduplication';
import { query } from '../lib/outreach/db';
import { deleteMediaRecord } from '../lib/admin-db';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const envLocal = path.resolve(dirname, '../../.env.local');
if (typeof (process as any).loadEnvFile === 'function' && fs.existsSync(envLocal)) {
  (process as any).loadEnvFile(envLocal);
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🎨 HeyPrince Zero-Duplicate Visual Asset Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;
  const createdMediaIds: number[] = [];

  function pass(name: string) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  }

  function fail(name: string, error: any) {
    failed++;
    console.error(`  ❌ FAIL: ${name}`, error?.message || error);
  }

  // --------------------------------------------------------------------------
  // Test 1: Content Hash Calculation & Database Duplicate Detection
  // --------------------------------------------------------------------------
  try {
    const fakeBuffer1 = Buffer.from('TEST_IMAGE_BUFFER_UNIQUE_ALPHA_' + Date.now());
    const fakeBuffer2 = Buffer.from('TEST_IMAGE_BUFFER_UNIQUE_BETA_' + Date.now());

    const hash1 = computeBufferHash(fakeBuffer1);
    const hash2 = computeBufferHash(fakeBuffer2);

    assert.notStrictEqual(hash1, hash2, 'Different buffers must produce different SHA-256 hashes');

    // Fresh hash should not be duplicate
    const check1 = await isImageContentDuplicate(hash1);
    assert.strictEqual(check1.isDuplicate, false, 'Unseen hash must be recognized as non-duplicate');

    // Simulate recording into media table
    const insertRes = await query<{ id: number }>(
      `INSERT INTO media (alt, filename, mime_type, filesize, url, content_hash)
       VALUES ('Test Unique Image', 'test-unique-${Date.now()}.webp', 'image/webp', 1000, 'https://example.com/test-${Date.now()}.webp', $1)
       RETURNING id;`,
      [hash1]
    );
    const insertedId = insertRes[0]?.id;
    if (insertedId) createdMediaIds.push(insertedId);

    // Now check1 should be recognized as duplicate
    const checkDuplicate = await isImageContentDuplicate(hash1);
    assert.strictEqual(checkDuplicate.isDuplicate, true, 'Known hash must be strictly flagged as duplicate');
    assert.strictEqual(checkDuplicate.existingId, insertedId, 'Duplicate check must return existing media id');

    pass('Content Hashing: Accurately identifies new vs existing image byte buffers');
  } catch (err) {
    fail('Content Hashing: Accurately identifies new vs existing image byte buffers', err);
  }

  // --------------------------------------------------------------------------
  // Test 2: Existing Cover Image URL Duplicate Blocking
  // --------------------------------------------------------------------------
  try {
    // Fetch a real existing post's cover_image
    const existingPost = await query<{ cover_image: string; title: string }>(
      `SELECT cover_image, title FROM posts WHERE cover_image IS NOT NULL LIMIT 1;`
    );

    if (existingPost.length > 0 && existingPost[0].cover_image) {
      const usedUrl = existingPost[0].cover_image;
      const dupCheck = await isImageContentDuplicate('non_existent_hash', usedUrl);
      assert.strictEqual(dupCheck.isDuplicate, true, 'Image URL already used in posts must be flagged as duplicate');
      assert.ok(dupCheck.reason?.includes('already used'), 'Duplicate check should explain why it is blocked');
    }

    pass('Post Guard: Rejects image URLs already assigned to existing blog posts');
  } catch (err) {
    fail('Post Guard: Rejects image URLs already assigned to existing blog posts', err);
  }

  // --------------------------------------------------------------------------
  // Test 3: Procedural Technical SVG Generation Uniqueness
  // --------------------------------------------------------------------------
  try {
    const titleA = 'Architectural Microservices in Modern Next.js';
    const titleB = 'Quantum Cryptography and Edge Network Security';

    const svgA = generateDynamicEditorialSvg({
      title: titleA,
      category: 'Software Architecture',
      role: 'cover',
    });

    const svgB = generateDynamicEditorialSvg({
      title: titleB,
      category: 'Cybersecurity',
      role: 'cover',
    });

    const svgSecA = generateDynamicEditorialSvg({
      title: titleA,
      category: 'Software Architecture',
      role: 'section1',
      heading: 'Event-Driven Concurrency',
    });

    assert.ok(svgA.svg.includes('<svg'), 'Generated SVG must be valid SVG markup');
    assert.ok(svgA.buffer.length > 500, 'SVG buffer must have non-trivial size');
    assert.notStrictEqual(svgA.svg, svgB.svg, 'Different articles must generate distinct SVG visuals');
    assert.notStrictEqual(svgA.svg, svgSecA.svg, 'Cover and section must generate distinct SVG visuals');

    pass('Procedural SVG Engine: Produces mathematically unique visuals for different articles and roles');
  } catch (err) {
    fail('Procedural SVG Engine: Produces mathematically unique visuals for different articles and roles', err);
  }

  // --------------------------------------------------------------------------
  // Test 4: End-to-End Image Package Uniqueness (Cover + Section 1 + Section 2)
  // --------------------------------------------------------------------------
  try {
    const uniqueTitle = `Frontier AI Engineering at Scale ${Date.now()}`;
    const result = await generateDailyBlogImages(
      uniqueTitle,
      'Artificial Intelligence',
      [
        { heading: 'Autonomous Agent Topology', paragraphs: ['Scalable orchestrator flow.'] },
        { heading: 'Real-Time Telemetry & Safety', paragraphs: ['Latency metrics and edge verification.'] },
      ]
    );

    assert.ok(result.coverImage?.url, 'Cover image URL must exist');
    assert.ok(result.sectionImages[0]?.url, 'Section 1 image URL must exist');
    assert.ok(result.sectionImages[1]?.url, 'Section 2 image URL must exist');

    // 1. None of the images should be the static placeholder
    assert.notStrictEqual(result.coverImage.url, '/assets/blog/photo1.webp', 'Cover must not be static placeholder');
    assert.notStrictEqual(result.sectionImages[0].url, '/assets/blog/photo1.webp', 'Section 1 must not be static placeholder');
    assert.notStrictEqual(result.sectionImages[1].url, '/assets/blog/photo1.webp', 'Section 2 must not be static placeholder');

    // 2. All 3 images within the post must be strictly distinct
    assert.notStrictEqual(result.coverImage.url, result.sectionImages[0].url, 'Cover and Section 1 must have distinct URLs');
    assert.notStrictEqual(result.coverImage.url, result.sectionImages[1].url, 'Cover and Section 2 must have distinct URLs');
    assert.notStrictEqual(result.sectionImages[0].url, result.sectionImages[1].url, 'Section 1 and Section 2 must have distinct URLs');

    if (result.coverImage.mediaId) createdMediaIds.push(result.coverImage.mediaId);
    if (result.sectionImages[0].mediaId) createdMediaIds.push(result.sectionImages[0].mediaId);
    if (result.sectionImages[1].mediaId) createdMediaIds.push(result.sectionImages[1].mediaId);

    pass('Full Image Package: Generates 3 strictly unique, non-overlapping visual assets');
  } catch (err) {
    fail('Full Image Package: Generates 3 strictly unique, non-overlapping visual assets', err);
  }

  // --------------------------------------------------------------------------
  // Test 5: Standalone Dynamic Fallback Generator
  // --------------------------------------------------------------------------
  try {
    const fallback1 = await generateDynamicEditorialImageFallback('Emergency Zero-Day Patching in Distributed Kubernetes', 'Security', 'cover');
    assert.ok(fallback1.url && fallback1.url.startsWith('http'), 'Dynamic fallback must return live HTTPS URL');
    assert.notStrictEqual(fallback1.url, '/assets/blog/photo1.webp', 'Dynamic fallback must never return photo1.webp');

    if (fallback1.mediaId) createdMediaIds.push(fallback1.mediaId);

    pass('Dynamic Editorial Fallback: On-demand fallback creates unique registered media asset');
  } catch (err) {
    fail('Dynamic Editorial Fallback: On-demand fallback creates unique registered media asset', err);
  }

  // --------------------------------------------------------------------------
  // Teardown test artifacts
  // --------------------------------------------------------------------------
  for (const mid of createdMediaIds) {
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
  console.error('[TestSuite Fatal Exception]:', err);
  process.exit(1);
});
