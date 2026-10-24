import {
  normalizeDomain,
  normalizeCompanyName,
  checkLeadDuplicate,
  mergeBusinessEvidence,
  checkContentDuplicate,
  computeContentHash,
  generateOutreachIdempotencyKey,
  checkAndAcquireSendLock,
  recordSendSuccess,
} from '../lib/deduplication';
import { query } from '../lib/outreach/db';
import { processLeadSubmission } from '../lib/leads';
import { runContentResearcherDiscovery } from '../lib/chief-of-staff/agents/content-researcher';
import { createContentDraft } from '../lib/chief-of-staff/db';

async function runConsolidationTests() {
  console.log('====================================================');
  console.log('🧪 JARVIS AI CONSOLIDATION & DEDUPLICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Canonical Domain & Company Normalization
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Domain & Name Normalization');
  const d1 = normalizeDomain('https://WWW.ACME-Corp.co.uk/pricing?ref=google#team');
  assert(d1 === 'acme-corp.co.uk', `Domain normalization (${d1})`);

  const d2 = normalizeDomain('http://subdomain.testsite.com:8080/index.html');
  assert(d2 === 'subdomain.testsite.com', `Domain port stripping (${d2})`);

  const n1 = normalizeCompanyName('Acme Solutions, LLC.');
  assert(n1 === 'acme solutions', `Company name LLC suffix stripping (${n1})`);

  const n2 = normalizeCompanyName('The Premier Digital Agency Inc.');
  assert(n2 === 'premier digital agency', `Company name The / Inc stripping (${n2})`);

  // --------------------------------------------------------------------------
  // TEST 2: Content Deduplication & Hash Matching
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Content Deduplication Engine');
  const hash1 = computeContentHash('Sample article content for testing deduplication.');
  const hash2 = computeContentHash('Sample article content for testing deduplication.');
  const hash3 = computeContentHash('Different article content altogether.');
  assert(hash1 === hash2, 'Content hash is deterministic');
  assert(hash1 !== hash3, 'Different content produces distinct hash');

  const dupCheck1 = await checkContentDuplicate({
    title: 'How to Speed Up Your WordPress Website in 2026',
    slug: 'how-to-speed-up-wordpress',
    content: 'Sample article content for testing deduplication.',
  });
  console.log('  ℹ️ Content duplicate check result:', dupCheck1.isDuplicate ? 'Found match' : 'Unique');
  assert(typeof dupCheck1.isDuplicate === 'boolean', 'Content duplicate check returns valid boolean');

  // --------------------------------------------------------------------------
  // TEST 3: Lead Deduplication Across Database
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 3: Lead Duplicate Prevention');
  const testDomain = 'test-dedup-corp-' + Date.now() + '.com';
  const testCompany = 'Test Dedup Enterprise ' + Date.now();
  const testEmail = `contact@${testDomain}`;

  // First check should be unique
  const checkUnique = await checkLeadDuplicate({ domain: testDomain, name: testCompany, email: testEmail });
  assert(!checkUnique.isDuplicate, 'Brand new lead is detected as unique');

  // Clean up any stale test rows from previous runs
  await query(`DELETE FROM businesses WHERE source_provider = 'test_suite';`);

  const testProviderId = `test_${Date.now()}`;
  // Insert a test business record
  const insertBiz = await query<{ id: string }>(
    `INSERT INTO businesses (name, domain, normalized_domain, source_provider, source_provider_id, status, category, city, country_code, metadata)
     VALUES ($1, $2, $3, 'test_suite', $4, 'DISCOVERED', 'Web Development', 'London', 'GB', '{"audit_evidence": ["Initial discovery"]}')
     RETURNING id;`,
    [testCompany, testDomain, normalizeDomain(testDomain), testProviderId]
  );
  const bizId = insertBiz[0]?.id;
  assert(Boolean(bizId), `Inserted benchmark test business: ${bizId}`);

  // Second check with same domain must detect duplicate
  const checkDupDomain = await checkLeadDuplicate({ domain: testDomain, name: 'Completely Different Name', email: 'hello@random.com' });
  assert(checkDupDomain.isDuplicate, 'Duplicate domain is successfully detected');
  assert(Boolean(checkDupDomain.existingBusinessId), `Matched existing business ID: ${checkDupDomain.existingBusinessId}`);

  // Test evidence merging
  if (bizId) {
    const mergeRes = await mergeBusinessEvidence(bizId, ['Identified slow LCP 4.2s', 'Missing contact form']);
    assert(mergeRes.evidenceCount >= 3, `Evidence merged successfully (total: ${mergeRes.evidenceCount})`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Atomic Send Lock & Outreach Idempotency
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 4: Outreach Atomic Send Lock & Idempotency');
  // Create a temporary test draft
  const testDraftId = await createContentDraft({
    agentId: 'lead_scout',
    draftType: 'outreach_proposal',
    title: 'Test Outreach Proposal',
    content: 'Pitch content',
    status: 'pending_approval',
    metadata: { contactEmail: 'test@prospect.com' },
  });
  assert(Boolean(testDraftId), `Created test draft: ${testDraftId}`);

  if (testDraftId) {
    const key = generateOutreachIdempotencyKey(bizId || 'biz_1', testDraftId, 'test@prospect.com');
    assert(typeof key === 'string' && key.length >= 16, `Generated valid idempotency key: ${key}`);

    // First lock attempt must SUCCEED
    const lock1 = await checkAndAcquireSendLock(testDraftId, key);
    assert(lock1.acquired === true, 'First send lock attempt acquired successfully');

    // Second lock attempt with SAME key/draft must FAIL (prevents multi-click duplicate sending)
    const lock2 = await checkAndAcquireSendLock(testDraftId, key);
    assert(lock2.acquired === false, 'Concurrent send attempt is rejected by send lock');
    assert(Boolean(lock2.reason?.includes('in progress') || lock2.reason?.includes('already')), `Lock rejection reason: ${lock2.reason}`);

    // Record success
    await recordSendSuccess(testDraftId, 'msg_test_123');
    const lock3 = await checkAndAcquireSendLock(testDraftId, key);
    assert(lock3.acquired === false, 'Already sent draft cannot be re-sent');

    // Clean up test draft
    await query(`DELETE FROM chief_content_drafts WHERE id = $1;`, [testDraftId]);
  }

  // Clean up test business
  if (bizId) {
    await query(`DELETE FROM businesses WHERE id = $1;`, [bizId]);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Inbound Contact Form Routing & Autoresponder Preservation
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Inbound Form Autoresponder & Unified Lead Routing');
  process.env.CAPTCHA_DEV_BYPASS = 'true';
  (process.env as any).NODE_ENV = 'development';

  const inboundEmail = `inbound-client-${Date.now()}@example.org`;
  const leadRes = await processLeadSubmission({
    name: 'Inbound Test Client',
    email: inboundEmail,
    company: 'Inbound Alpha Corp',
    service: 'WordPress Modernization',
    budget: '$5,000 - $10,000',
    timeline: '1 month',
    message: 'Need help modernizing existing WordPress WooCommerce site with custom performance optimization.',
    captchaProof: 'test_dev_bypass_proof',
  });

  assert(leadRes.success === true, `Lead submission succeeded (ID: ${leadRes.leadId})`);

  // Verify lead was routed into unified businesses table
  const routedBiz = await query<{ id: string; status: string; metadata: any }>(
    `SELECT id, status, metadata FROM businesses WHERE name = 'Inbound Alpha Corp' LIMIT 1;`
  );
  assert(routedBiz.length > 0, 'Inbound lead ingested into unified businesses table');
  assert(routedBiz[0]?.metadata?.isInbound === true, 'Inbound flag set to true');

  // Clean up inbound test data
  if (leadRes.leadId) {
    await query(`DELETE FROM leads WHERE id = $1;`, [leadRes.leadId]);
  }
  if (routedBiz[0]?.id) {
    await query(`DELETE FROM businesses WHERE id = $1;`, [routedBiz[0].id]);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Expanded Content Research (Service Blueprint & Website Content)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 6: Expanded Content Research');
  const serviceRes = await runContentResearcherDiscovery({
    contentType: 'service_page',
    customTopic: 'WordPress Performance Optimization',
  });

  assert(serviceRes.success === true, `Service page blueprint generated (${serviceRes.draftId})`);
  assert(Boolean(serviceRes.draftId), `Valid draftId returned: ${serviceRes.draftId}`);

  // Verify the service draft in database
  if (serviceRes.draftId) {
    const draftCheck = await query<{ draft_type: string; metadata: any; content: string }>(
      `SELECT draft_type, metadata, content FROM chief_content_drafts WHERE id = $1;`,
      [serviceRes.draftId]
    );
    assert(draftCheck.length > 0, 'Service blueprint stored in chief_content_drafts table');
    assert(draftCheck[0]?.draft_type === 'service_page', 'draft_type in DB is service_page');
    assert(draftCheck[0]?.metadata?.target_page_type === 'service_page', 'metadata has target_page_type');

    // Clean up test draft
    await query(`DELETE FROM chief_content_drafts WHERE id = $1;`, [serviceRes.draftId]);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Automated Lead Scout, Qualification & Channel Selection
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 7: Lead Scout Automation, Qualification & Channel Selection');
  const { evaluateLeadContactChannels, LEAD_SCOUT_TARGET_ROTATION } = await import(
    '../lib/outreach/qualification'
  );

  // 1. Target Rotation sanity
  assert(
    Array.isArray(LEAD_SCOUT_TARGET_ROTATION) && LEAD_SCOUT_TARGET_ROTATION.length >= 10,
    `Lead Scout rotation configured with ${LEAD_SCOUT_TARGET_ROTATION.length} global targets`
  );

  // 2. Scenario A: Business with ONLY website
  const evalWebsiteOnly = evaluateLeadContactChannels({
    website_url: 'https://example-dentist.com',
    domain: 'example-dentist.com',
    phone: null,
    contacts: [],
  });
  assert(evalWebsiteOnly.isQualified === true, 'Business with only website URL is QUALIFIED');
  assert(evalWebsiteOnly.hasWebsite === true, 'Website presence flagged correctly');
  assert(evalWebsiteOnly.bestChannel === 'none', 'No outreach attempted without direct communication channel');

  // 3. Scenario B: Business with ONLY email
  const evalEmailOnly = evaluateLeadContactChannels({
    website_url: null,
    domain: null,
    phone: null,
    contacts: [{ email: 'hello@agency.co', verification_status: 'VALID' }],
  });
  assert(evalEmailOnly.isQualified === true, 'Business with only email is QUALIFIED');
  assert(evalEmailOnly.bestChannel === 'email', 'Email channel selected when email is available');
  assert(evalEmailOnly.emailStatus === 'verified', 'Email verified status detected');

  // 4. Scenario C: Business with ONLY phone
  const evalPhoneOnly = evaluateLeadContactChannels({
    website_url: null,
    domain: null,
    phone: '+1-512-555-0199',
    contacts: [],
  });
  assert(evalPhoneOnly.isQualified === true, 'Business with only phone is QUALIFIED');

  // 5. Scenario D: Business with all three (WhatsApp preferred over Email)
  const evalAllThree = evaluateLeadContactChannels({
    website_url: 'https://premier-retail.com',
    domain: 'premier-retail.com',
    phone: '+1-512-555-0199',
    contacts: [{ email: 'info@premier-retail.com', verification_status: 'VALID' }],
  });
  assert(evalAllThree.isQualified === true, 'Business with all 3 contact points is QUALIFIED (single lead)');
  assert(evalAllThree.bestChannel === 'whatsapp', 'WhatsApp is preferred channel over Email (1st Priority)');
  assert(Boolean(evalAllThree.whatsappUrl), 'Generated valid WhatsApp chat URL');

  // 6. Scenario E: Business with ZERO contact points
  const evalZero = evaluateLeadContactChannels({
    website_url: null,
    domain: null,
    phone: null,
    contacts: [],
  });
  assert(evalZero.isQualified === false, 'Business with zero contact points is UNQUALIFIED');
  assert(evalZero.bestChannel === 'none', 'No channel selected for zero contact business');

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runConsolidationTests().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
