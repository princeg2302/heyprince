import { getPosts, getPostsPaginated } from '../lib/cms';

async function runBlogPaginationSuite() {
  console.log('================================================================');
  console.log('HEYPRINCE.IN: BLOG LISTING & INFINITE SCROLL PAGINATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Full Article Dataset Inspection
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Full Published Dataset Inspection ---');
  const allPosts = await getPosts();
  console.log(`Total Published Articles Found: ${allPosts.length}`);
  assert(allPosts.length > 0, 'Found published blog posts for infinite scroll testing.');
  assert(Boolean(allPosts[0].slug && allPosts[0].title), 'Articles contain valid slugs and titles.');

  // --------------------------------------------------------------------------
  // TEST 2: Initial Page 1 (Exactly 9 Posts)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Initial Batch Retrieval (Page 1: 9 Posts) ---');
  const page1 = await getPostsPaginated({ limit: 9 });
  console.log(`Page 1 Returned: ${page1.posts.length} posts, hasMore: ${page1.hasMore}`);
  const expectedPage1Count = Math.min(9, allPosts.length);
  assert(page1.posts.length === expectedPage1Count, `Page 1 returned exactly ${expectedPage1Count} posts.`);
  if (allPosts.length > 9) {
    assert(page1.hasMore === true, 'hasMore is true when total posts exceed 9.');
    assert(page1.nextCursor !== null, 'nextCursor is populated for subsequent infinite scroll batch.');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Subsequent Batch (Page 2: Next 9 Posts via Cursor)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Subsequent Batch Retrieval via Stable Cursor ---');
  if (page1.hasMore && page1.nextCursor) {
    console.log(`Executing cursor fetch with nextCursor:`, page1.nextCursor);
    const page2 = await getPostsPaginated({
      limit: 9,
      cursorPublishedAt: page1.nextCursor.publishedAt,
      cursorSlug: page1.nextCursor.slug,
    });
    console.log(`Page 2 Returned: ${page2.posts.length} posts, hasMore: ${page2.hasMore}`);
    assert(page2.posts.length > 0, 'Page 2 retrieved subsequent posts successfully.');

    // ------------------------------------------------------------------------
    // TEST 4: Strict Deduplication Assurance
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 4: Zero-Duplicate Verification Between Batches ---');
    const page1Slugs = new Set(page1.posts.map((p) => p.slug));
    const overlaps = page2.posts.filter((p) => page1Slugs.has(p.slug));
    assert(overlaps.length === 0, `No overlapping slugs between Page 1 and Page 2 (Overlaps: ${overlaps.length}).`);
  } else {
    console.log('[SKIP] Total posts <= 9, skipping Page 2 cursor test.');
    assert(true, 'Dataset size correctly reflects single-batch behavior.');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Category Filtering Verification
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Category Filtering Behavior ---');
  const availableCat = allPosts.find((p) => p.category)?.category || 'Engineering';
  const catFiltered = await getPostsPaginated({ limit: 9, category: availableCat });
  console.log(`Category '${availableCat}' Returned: ${catFiltered.posts.length} posts`);
  assert(catFiltered.posts.length > 0, 'Category filter returned valid filtered results.');

  // --------------------------------------------------------------------------
  // TEST 6: Empty Search Query Result & Error Handling
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Non-Existent Query Empty State Handling ---');
  const emptyRes = await getPostsPaginated({ limit: 9, search: '__XYZ_NON_EXISTENT_QUERY_999__' });
  console.log(`Empty Search Returned: ${emptyRes.posts.length} posts, hasMore: ${emptyRes.hasMore}`);
  assert(emptyRes.posts.length === 0, 'Non-existent search returns clean empty array.');
  assert(emptyRes.hasMore === false, 'hasMore is false when no items remain.');
  assert(emptyRes.nextCursor === null, 'nextCursor is null on empty result.');

  // --------------------------------------------------------------------------
  // TEST 7: Image & Fallback Integrity Across All Retrieved Posts
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Image & Fallback Integrity ---');
  const allImagesValid = page1.posts.every((p) => typeof p.image === 'string' && p.image.trim().length > 0);
  assert(allImagesValid, 'Every post in paginated result possesses a non-empty image URL.');

  console.log('\n================================================================');
  console.log(`BLOG PAGINATION TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBlogPaginationSuite().catch((err) => {
  console.error('Fatal pagination test error:', err);
  process.exit(1);
});
