import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import { extractDomain } from '../lib/outreach/discovery/types';
import { isForbiddenIPv4, isForbiddenIp } from '../lib/outreach/auditor/ssrf-guard';
import { contactVerifier } from '../lib/outreach/verifier/contact-verifier';
import { complianceEngine } from '../lib/outreach/compliance/compliance-engine';
import { generateUnsubscribeToken, verifyUnsubscribeToken } from '../lib/outreach/compliance/tokens';
import { DeterministicRuleEngineAdapter } from '../lib/outreach/ai/deterministic-adapter';
import { MockDiscoveryAdapter } from '../lib/outreach/discovery/mock-adapter';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const envLocal = path.resolve(dirname, '../../.env.local');
if (typeof process.loadEnvFile === 'function' && fs.existsSync(envLocal)) {
  process.loadEnvFile(envLocal);
}

let passedCount = 0;
let failedCount = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
    failedCount++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 HeyPrince Lead Intelligence & Outreach Test Suite');
  console.log('======================================================\n');

  // 1. Business Domain Extraction & Deduplication
  await runTest('Domain Extraction: Normalizes www and protocols correctly', () => {
    const d1 = extractDomain('https://www.ArtisanRoast.com/menu');
    assert.strictEqual(d1.domain, 'www.artisanroast.com');
    assert.strictEqual(d1.normalizedDomain, 'artisanroast.com');

    const d2 = extractDomain('http://cafe-delight.co.uk/');
    assert.strictEqual(d2.normalizedDomain, 'cafe-delight.co.uk');

    const d3 = extractDomain('');
    assert.strictEqual(d3.domain, null);
  });

  // 2. Mock Discovery Provider
  await runTest('Discovery Provider: Mock adapter returns structured records with normalized domains', async () => {
    const adapter = new MockDiscoveryAdapter();
    const res = await adapter.search({ countryCode: 'US', city: 'Austin', category: 'Restaurants' });
    assert.ok(res.records.length > 0);
    assert.ok(res.records[0].normalizedDomain);
    assert.strictEqual(res.records[0].countryCode, 'US');
  });

  // 3. SSRF Protection: IP Validation
  await runTest('SSRF Protection: Blocks loopback and private IPv4 ranges', () => {
    assert.strictEqual(isForbiddenIPv4('127.0.0.1'), true);
    assert.strictEqual(isForbiddenIPv4('127.10.20.30'), true);
    assert.strictEqual(isForbiddenIPv4('10.0.0.1'), true);
    assert.strictEqual(isForbiddenIPv4('172.16.0.1'), true);
    assert.strictEqual(isForbiddenIPv4('172.31.255.255'), true);
    assert.strictEqual(isForbiddenIPv4('192.168.1.1'), true);
    assert.strictEqual(isForbiddenIPv4('169.254.169.254'), true); // Cloud metadata IP
    assert.strictEqual(isForbiddenIPv4('0.0.0.0'), true);
    assert.strictEqual(isForbiddenIPv4('8.8.8.8'), false); // Public DNS
    assert.strictEqual(isForbiddenIPv4('104.21.55.2'), false); // Public Cloudflare
  });

  await runTest('SSRF Protection: Blocks IPv6 loopback, link-local, and unique local', () => {
    assert.strictEqual(isForbiddenIp('::1'), true);
    assert.strictEqual(isForbiddenIp('fe80::1'), true);
    assert.strictEqual(isForbiddenIp('fc00::1'), true);
    assert.strictEqual(isForbiddenIp('2606:4700::6811:3702'), false); // Public Cloudflare IPv6
  });

  // 4. Email Normalization & Role-Account Detection
  await runTest('Email Normalization: Strips mailto, brackets, and uppercase', () => {
    assert.strictEqual(
      contactVerifier.normalizeEmail('mailto:Info@Business.COM'),
      'info@business.com'
    );
    assert.strictEqual(
      contactVerifier.normalizeEmail('<HELLO@Agency.org?subject=hello>'),
      'hello@agency.org'
    );
  });

  await runTest('Email Role Account Detection: Accurately identifies shared prefixes', () => {
    assert.strictEqual(contactVerifier.isRoleAccount('info@company.com').isRole, true);
    assert.strictEqual(contactVerifier.isRoleAccount('support@company.com').isRole, true);
    assert.strictEqual(contactVerifier.isRoleAccount('sales@company.com').isRole, true);
    assert.strictEqual(contactVerifier.isRoleAccount('prince@heyprince.in').isRole, false);
    assert.strictEqual(contactVerifier.isRoleAccount('sarah.miller@company.com').isRole, false);
  });

  // 5. Contact Deliverability Verification
  await runTest('Contact Verification: Flags disposable email domains as INVALID', async () => {
    const res = await contactVerifier.verifyEmail('testuser@mailinator.com');
    assert.strictEqual(res.isDisposable, true);
    assert.strictEqual(res.status, 'INVALID');
    assert.strictEqual(res.confidence, 0.0);
  });

  await runTest('Contact Verification: Flags invalid syntax as INVALID', async () => {
    const res = await contactVerifier.verifyEmail('not-an-email');
    assert.strictEqual(res.syntaxValid, false);
    assert.strictEqual(res.status, 'INVALID');
  });

  // 6. Compliance Engine: Jurisdiction Rules
  await runTest('Compliance Engine: Evaluates US B2B as ELIGIBLE with required disclosures', async () => {
    const outcome = await complianceEngine.evaluateEligibility(
      { email: 'contact@acmecorp.com', verification_status: 'VALID' },
      { country_code: 'US', domain: 'acmecorp.com', name: 'Acme Corp', category: 'Retail' }
    );
    assert.strictEqual(outcome.decision, 'ELIGIBLE');
    assert.strictEqual(outcome.jurisdiction, 'US_CAN_SPAM');
  });

  await runTest('Compliance Engine: Evaluates EU personal consumer email as INELIGIBLE (GDPR)', async () => {
    const outcome = await complianceEngine.evaluateEligibility(
      { email: 'customer123@gmail.com', verification_status: 'VALID' },
      { country_code: 'DE', domain: 'gmail.com', name: 'Berlin Studio', category: 'Art' }
    );
    assert.strictEqual(outcome.decision, 'INELIGIBLE');
    assert.strictEqual(outcome.legalBasis, 'B2C_CONSENT_REQUIRED');
  });

  await runTest('Compliance Engine: Evaluates EU corporate domain as REVIEW_REQUIRED (GDPR LIA)', async () => {
    const outcome = await complianceEngine.evaluateEligibility(
      { email: 'director@berlintechnologies.de', verification_status: 'VALID' },
      { country_code: 'DE', domain: 'berlintechnologies.de', name: 'Berlin Tech', category: 'Tech' }
    );
    assert.strictEqual(outcome.decision, 'REVIEW_REQUIRED');
    assert.strictEqual(outcome.jurisdiction, 'EU_GDPR_B2B');
  });

  await runTest('Compliance Engine: Evaluates missing/unknown country as UNKNOWN (sending blocked)', async () => {
    const outcome = await complianceEngine.evaluateEligibility(
      { email: 'hello@mystery.com', verification_status: 'VALID' },
      { country_code: '', domain: 'mystery.com', name: 'Mystery Co', category: 'Retail' }
    );
    assert.strictEqual(outcome.decision, 'UNKNOWN');
  });

  // 7. Cryptographic Unsubscribe Tokens
  await runTest('Unsubscribe HMAC Tokens: Generates and verifies valid token', () => {
    const token = generateUnsubscribeToken('lead@example.com', 'biz-uuid-123');
    const verification = verifyUnsubscribeToken(token);
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.payload?.email, 'lead@example.com');
    assert.strictEqual(verification.payload?.businessId, 'biz-uuid-123');
  });

  await runTest('Unsubscribe HMAC Tokens: Rejects tampered/forged token', () => {
    const token = generateUnsubscribeToken('lead@example.com', 'biz-uuid-123');
    const tampered = token.slice(0, -4) + 'abcd';
    const verification = verifyUnsubscribeToken(tampered);
    assert.strictEqual(verification.valid, false);
    assert.ok(verification.error?.includes('signature') || verification.error?.includes('Malformed'));
  });

  // 8. AI Analysis Schema Validation & Deterministic Adapter
  await runTest('AI Engine: Deterministic rule engine outputs valid schema with HeyPrince service', async () => {
    const adapter = new DeterministicRuleEngineAdapter();
    const result = await adapter.analyzeBusiness({
      businessName: 'Austin Bistro & Bar',
      category: 'Restaurants',
      city: 'Austin',
      countryCode: 'US',
      websiteUrl: 'https://austinbistro.example.com',
      auditSignals: {
        isReachable: true,
        hasHttps: true,
        mobileFriendly: true,
        hasContactPage: true,
        hasBookingSystem: false, // Triggers booking recommendation
        hasEcommerce: false,
        hasNewsletter: false,
        hasLiveChat: false,
        speedIndexMs: 250,
        detectedTechnologies: ['WordPress'],
        signals: {},
      },
    });

    assert.strictEqual(result.analysis.recommendedService, 'Booking & Reservation System');
    assert.ok(result.analysis.confidenceLevel > 0.8);
    assert.ok(result.analysis.personalizedDraft.includes('{{UNSUBSCRIBE_URL}}'));
    assert.ok(result.analysis.personalizedDraft.includes('HeyPrince'));
  });

  console.log('\n------------------------------------------------------');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('------------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
