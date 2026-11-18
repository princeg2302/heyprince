import {
  isR2Configured,
  getR2Endpoint,
  getR2PublicBaseUrl,
  generateR2ObjectKey,
  getR2PublicUrl,
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_BYTES,
  uploadToR2,
  downloadFromR2,
  deleteFromR2,
  checkR2FileExists,
  getR2PresignedUploadUrl,
  getR2PresignedDownloadUrl,
} from '../lib/storage/r2';

async function runR2TestSuite() {
  console.log('================================================================');
  console.log('HEYPRINCE.IN: CLOUDFLARE R2 OBJECT STORAGE TEST SUITE');
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
  // TEST 1: Environment & Configuration Check
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: R2 Configuration & Credentials Check ---');
  const configured = isR2Configured();
  console.log(`R2 Configured State: ${configured ? 'YES (Live Credentials Set)' : 'NO (Unset/Mock Mode)'}`);
  assert(true, 'R2 configuration inspector executed without throwing.');

  // --------------------------------------------------------------------------
  // TEST 2: Endpoint & Custom Domain URL Generation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Endpoint & Domain Resolution ---');
  const endpoint = getR2Endpoint();
  const publicBase = getR2PublicBaseUrl();
  console.log(`Resolved Endpoint: ${endpoint}`);
  console.log(`Resolved Public Base URL: ${publicBase}`);
  assert(endpoint.includes('cloudflarestorage.com') || endpoint.startsWith('https://'), 'Endpoint resolves valid URL format.');
  assert(publicBase.startsWith('http'), 'Public base URL resolves valid HTTP(S) format.');

  // --------------------------------------------------------------------------
  // TEST 3: Object Key Generation & Folder Whitelist
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Object Key Generation & Path Sanitization ---');
  const testKey = generateR2ObjectKey('blogs', 'article cover image #1 (draft).png');
  console.log(`Generated Key: ${testKey}`);
  assert(testKey.startsWith('blogs/'), 'Key places asset into expected folder hierarchy.');
  assert(!testKey.includes('#') && !testKey.includes('('), 'Special characters and spaces properly sanitized.');
  assert(testKey.endsWith('_draft_.png') || testKey.endsWith('.png'), 'File extension correctly preserved.');

  const publicUrl = getR2PublicUrl(testKey);
  console.log(`Public Asset URL: ${publicUrl}`);
  assert(publicUrl.includes(testKey), 'Public URL matches resolved public base and object key.');

  // --------------------------------------------------------------------------
  // TEST 4: MIME Type & File Size Validation Guardrails
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Security Guardrails: MIME Types & Size Limits ---');
  assert(ALLOWED_MIME_TYPES.has('image/webp'), 'Allowed MIME includes image/webp.');
  assert(ALLOWED_MIME_TYPES.has('image/jpeg'), 'Allowed MIME includes image/jpeg.');
  assert(ALLOWED_MIME_TYPES.has('application/pdf'), 'Allowed MIME includes application/pdf.');
  assert(!ALLOWED_MIME_TYPES.has('application/x-msdownload'), 'Disallowed MIME types (executables) blocked.');
  assert(MAX_IMAGE_SIZE_BYTES === 25 * 1024 * 1024, 'Max image size strictly set to 25 MB.');
  assert(MAX_DOCUMENT_SIZE_BYTES === 50 * 1024 * 1024, 'Max document size strictly set to 50 MB.');

  // --------------------------------------------------------------------------
  // TEST 5: Size Limit Rejection Simulation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Oversized File Upload Validation ---');
  // Create virtual 30MB payload (exceeds 25MB image limit)
  const fakeLargePayload = Buffer.alloc(1024); // 1KB proxy
  const rejectTest = await uploadToR2({
    folder: 'blogs',
    filename: 'giant.png',
    body: fakeLargePayload,
    contentType: 'image/png',
    maxSizeBytes: 500, // artificially low limit to test validation
  });
  assert(!rejectTest.success, 'Oversized payload rejected by storage guardrail.');
  assert(Boolean(rejectTest.error && rejectTest.error.includes('exceeds allowed limit')), 'Error message clearly indicates size limit violation.');

  // --------------------------------------------------------------------------
  // TEST 6: Invalid File Type Rejection
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Disallowed File Type Validation ---');
  const badMimeTest = await uploadToR2({
    folder: 'documents/reports',
    filename: 'script.exe',
    body: Buffer.from('binary-content'),
    contentType: 'application/x-msdownload',
  });
  assert(!badMimeTest.success, 'Disallowed MIME type rejected before transmission.');
  assert(Boolean(badMimeTest.error && badMimeTest.error.includes('not permitted')), 'Clear error message returned for invalid file type.');

  // --------------------------------------------------------------------------
  // TEST 7: Live R2 Operations (if credentials available in environment)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Live Cloudflare R2 Operations ---');
  if (configured) {
    console.log('Live credentials detected. Executing real S3 API upload, head, presign, download, and delete...');
    const liveKey = generateR2ObjectKey('blogs', 'test-probe.txt');
    const probeContent = `HeyPrince Cloudflare R2 probe test at ${new Date().toISOString()}`;

    // Upload
    const liveUpload = await uploadToR2({
      key: liveKey,
      body: Buffer.from(probeContent, 'utf-8'),
      contentType: 'text/plain',
      visibility: 'public',
      metadata: { testSuite: 'true' },
    });
    assert(liveUpload.success, `Live R2 PutObject succeeded: ${liveUpload.url}`);

    // Exists check
    const exists = await checkR2FileExists(liveKey);
    assert(exists, 'Live HeadObject confirmed file exists in R2 bucket.');

    // Presigned download URL
    const presigned = await getR2PresignedDownloadUrl({ key: liveKey, expiresInSeconds: 300 });
    assert(presigned.success && Boolean(presigned.downloadUrl), 'Presigned GET URL generated successfully.');

    // Download
    const liveDownload = await downloadFromR2(liveKey);
    assert(liveDownload.success && Boolean(liveDownload.body), 'Live R2 GetObject downloaded content.');
    assert(liveDownload.body?.toString('utf-8') === probeContent, 'Downloaded content matches original payload exactly.');

    // Delete
    const liveDelete = await deleteFromR2(liveKey);
    assert(liveDelete.success, 'Live R2 DeleteObject removed test object cleanly.');
  } else {
    console.log('[INFO] R2 credentials not yet configured in local environment.');
    console.log('Testing graceful unconfigured response behavior...');

    const unconfiguredUpload = await uploadToR2({
      folder: 'blogs',
      filename: 'test.jpg',
      body: Buffer.from('test-image'),
      contentType: 'image/jpeg',
    });
    assert(!unconfiguredUpload.success, 'Gracefully returns false without throwing unhandled exception.');
    assert(unconfiguredUpload.error!.includes('not configured'), 'Error indicates R2 credentials requirement clearly.');

    const unconfiguredPresigned = await getR2PresignedUploadUrl({
      key: 'test/file.png',
      contentType: 'image/png',
    });
    assert(!unconfiguredPresigned.success, 'Presigned URL generation reports unconfigured gracefully.');
  }

  console.log('\n================================================================');
  console.log(`R2 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runR2TestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
