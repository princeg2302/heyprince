/**
 * Production-Ready Custom CAPTCHA Verification Suite
 * Thorough automated testing across 14 security, functional, and resilience vectors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Auto-load .env.local if present
const envLocal = path.resolve(dirname, '../../.env.local');
const envDefault = path.resolve(dirname, '../../.env');

if (typeof (process as any).loadEnvFile === 'function') {
  if (fs.existsSync(envLocal)) {
    (process as any).loadEnvFile(envLocal);
  } else if (fs.existsSync(envDefault)) {
    (process as any).loadEnvFile(envDefault);
  }
}

import {
  createCaptchaChallenge,
  verifyCaptchaChallenge,
  verifyAndConsumeProof,
  signChallengeToken,
  signProofToken,
  hashAnswer,
  hashClientIp,
  hashToken,
  isOriginAllowed,
} from '../lib/captcha';
import { queryCaptcha, insertChallengeRecord } from '../lib/captcha/db';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, title: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${title}`);
  } else {
    console.error(`  ❌ [FAIL] ${title}${details ? ` -> ${details}` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('🛡️  HEYPRINCE CUSTOM CAPTCHA VERIFICATION SUITE');
  console.log('============================================================\n');

  const testIp = '198.51.100.42';
  const siteKey = 'hp_site_live_default';

  // --------------------------------------------------------------------------
  // TEST 1: Challenge Generation
  // --------------------------------------------------------------------------
  console.log('Test 1: Generating a new challenge...');
  const chal1 = await createCaptchaChallenge({
    siteKey,
    purpose: 'contact-form',
    clientIp: testIp,
    origin: 'https://heyprince.in',
  });

  assert(
    chal1.success && Boolean(chal1.challengeId) && Boolean(chal1.signedToken) && Boolean(chal1.question),
    'Challenge created with ID, question, signed token, and expiry',
    chal1.error
  );

  // --------------------------------------------------------------------------
  // TEST 2: Correct Answer Verification
  // --------------------------------------------------------------------------
  console.log('\nTest 2: Verifying with the correct answer...');
  // Inspect stored answer hash directly from DB to simulate user correctly solving the challenge
  const [dbRow] = await queryCaptcha<{ answer_hash: string }>(
    `SELECT answer_hash FROM captcha_challenges WHERE id = $1;`,
    [chal1.challengeId]
  );

  // Test solving standard arithmetic math questions
  const chal2 = await createCaptchaChallenge({
    siteKey,
    purpose: 'contact-form',
    clientIp: testIp,
    difficulty: 'easy',
  });

  // Find the answer by checking 0..50
  let correctVal = '';
  for (let i = 0; i <= 50; i++) {
    if (hashAnswer(i) === (await queryCaptcha(`SELECT answer_hash FROM captcha_challenges WHERE id = $1;`, [chal2.challengeId]))[0]?.answer_hash) {
      correctVal = String(i);
      break;
    }
  }

  const verifyRes = await verifyCaptchaChallenge({
    challengeId: chal2.challengeId!,
    answer: correctVal,
    signedToken: chal2.signedToken!,
    purpose: 'contact-form',
    siteKey,
    clientIp: testIp,
    elapsedMs: 2500, // Valid human time
  });

  assert(
    verifyRes.success && Boolean(verifyRes.verificationProof),
    'Correct answer accepted and returned signed verification proof',
    verifyRes.error
  );

  // --------------------------------------------------------------------------
  // TEST 3: Incorrect Answer Handling
  // --------------------------------------------------------------------------
  console.log('\nTest 3: Incorrect answer rejection & attempt decrement...');
  const chal3 = await createCaptchaChallenge({
    siteKey,
    purpose: 'contact-form',
    clientIp: testIp,
  });

  const wrongRes = await verifyCaptchaChallenge({
    challengeId: chal3.challengeId!,
    answer: '99999_wrong_answer',
    signedToken: chal3.signedToken!,
    purpose: 'contact-form',
    siteKey,
    clientIp: testIp,
    elapsedMs: 2000,
  });

  assert(
    !wrongRes.success && wrongRes.code === 'INCORRECT_ANSWER' && wrongRes.attemptsLeft === 2,
    'Incorrect answer rejected with attemptsLeft = 2',
    `Code: ${wrongRes.code}, Attempts: ${wrongRes.attemptsLeft}`
  );

  // --------------------------------------------------------------------------
  // TEST 4: Expired Challenge Rejection
  // --------------------------------------------------------------------------
  console.log('\nTest 4: Challenge expiration enforcement...');
  const expiredId = crypto.randomUUID();
  const expiredDate = new Date(Date.now() - 60000); // 1 minute in the past
  const expiredAnsHash = hashAnswer('10');
  const ipHash = hashClientIp(testIp);

  await insertChallengeRecord({
    id: expiredId,
    siteKey,
    purpose: 'contact-form',
    challengeType: 'math',
    question: 'What is 5 + 5?',
    answerHash: expiredAnsHash,
    clientIpHash: ipHash,
    difficulty: 'easy',
    expiresAt: expiredDate,
  });

  const expiredToken = signChallengeToken({
    cid: expiredId,
    pur: 'contact-form',
    site: siteKey,
    ans: expiredAnsHash,
    exp: Date.now() - 60000,
    ip: ipHash,
    iat: Date.now() - 360000,
  });

  const expiredVerify = await verifyCaptchaChallenge({
    challengeId: expiredId,
    answer: '10',
    signedToken: expiredToken,
    purpose: 'contact-form',
    siteKey,
    clientIp: testIp,
  });

  assert(
    !expiredVerify.success && (expiredVerify.code === 'CHALLENGE_EXPIRED' || expiredVerify.code === 'INVALID_TOKEN'),
    'Expired challenge properly rejected',
    `Code: ${expiredVerify.code}`
  );

  // --------------------------------------------------------------------------
  // TEST 5: Token Tampering Detection
  // --------------------------------------------------------------------------
  console.log('\nTest 5: Token tampering detection...');
  const tamperedToken = `${chal1.signedToken?.slice(0, -6)}XYZ123`;
  const tamperedVerify = await verifyCaptchaChallenge({
    challengeId: chal1.challengeId!,
    answer: '10',
    signedToken: tamperedToken,
    purpose: 'contact-form',
    siteKey,
    clientIp: testIp,
  });

  assert(
    !tamperedVerify.success && tamperedVerify.code === 'INVALID_TOKEN',
    'Tampered signature rejected cryptographically',
    tamperedVerify.code
  );

  // --------------------------------------------------------------------------
  // TEST 6: Challenge Replay Prevention (Atomic One-Time Use)
  // --------------------------------------------------------------------------
  console.log('\nTest 6: Challenge replay prevention (double-submission)...');
  // Attempt to re-use chal2 which was successfully consumed in Test 2
  const replayVerify = await verifyCaptchaChallenge({
    challengeId: chal2.challengeId!,
    answer: correctVal,
    signedToken: chal2.signedToken!,
    purpose: 'contact-form',
    siteKey,
    clientIp: testIp,
    elapsedMs: 2000,
  });

  assert(
    !replayVerify.success && replayVerify.code === 'CHALLENGE_ALREADY_USED',
    'Replaying already-consumed challenge rejected atomically',
    replayVerify.code
  );

  // --------------------------------------------------------------------------
  // TEST 7: Purpose Mismatch Protection
  // --------------------------------------------------------------------------
  console.log('\nTest 7: Purpose mismatch protection...');
  const chal7 = await createCaptchaChallenge({
    siteKey,
    purpose: 'contact-form',
    clientIp: testIp,
  });

  const purposeMismatchVerify = await verifyCaptchaChallenge({
    challengeId: chal7.challengeId!,
    answer: '10',
    signedToken: chal7.signedToken!,
    purpose: 'login', // Wrong purpose!
    siteKey,
    clientIp: testIp,
  });

  assert(
    !purposeMismatchVerify.success && purposeMismatchVerify.code === 'PURPOSE_MISMATCH',
    'Purpose mismatch rejected (contact-form vs login)',
    purposeMismatchVerify.code
  );

  // --------------------------------------------------------------------------
  // TEST 8: Server-Side Proof Verification & Consumption
  // --------------------------------------------------------------------------
  console.log('\nTest 8: Server-side helper proof validation...');
  // Use proof generated in Test 2
  const proofToken = verifyRes.verificationProof!;
  const consumeRes1 = await verifyAndConsumeProof(proofToken, {
    purpose: 'contact-form',
    siteKey,
    clientIp: testIp,
  });

  assert(
    consumeRes1.success && Boolean(consumeRes1.proofId),
    'Verification proof successfully validated and atomically consumed',
    consumeRes1.error
  );

  // --------------------------------------------------------------------------
  // TEST 9: Proof Replay Prevention (Consume Twice)
  // --------------------------------------------------------------------------
  console.log('\nTest 9: Proof replay prevention (attempting to consume again)...');
  const consumeRes2 = await verifyAndConsumeProof(proofToken, {
    purpose: 'contact-form',
    siteKey,
    clientIp: testIp,
  });

  assert(
    !consumeRes2.success && consumeRes2.code === 'PROOF_ALREADY_USED',
    'Second attempt to consume proof rejected (One-time use enforced)',
    consumeRes2.code
  );

  // --------------------------------------------------------------------------
  // TEST 10: Wrong-Purpose Proof Consumption
  // --------------------------------------------------------------------------
  console.log('\nTest 10: Proof bound to wrong business action...');
  // Create challenge & proof for 'newsletter'
  const chal10 = await createCaptchaChallenge({ siteKey, purpose: 'newsletter', clientIp: testIp });
  let ans10 = '';
  for (let i = 0; i <= 50; i++) {
    if (hashAnswer(i) === (await queryCaptcha(`SELECT answer_hash FROM captcha_challenges WHERE id = $1;`, [chal10.challengeId]))[0]?.answer_hash) {
      ans10 = String(i);
      break;
    }
  }
  const ver10 = await verifyCaptchaChallenge({
    challengeId: chal10.challengeId!,
    answer: ans10,
    signedToken: chal10.signedToken!,
    purpose: 'newsletter',
    siteKey,
    clientIp: testIp,
    elapsedMs: 2000,
  });

  const wrongPurpProof = await verifyAndConsumeProof(ver10.verificationProof, {
    purpose: 'contact-form', // Mismatch!
    siteKey,
    clientIp: testIp,
  });

  assert(
    !wrongPurpProof.success && wrongPurpProof.code === 'PURPOSE_MISMATCH',
    'Proof bound to newsletter rejected when submitted for contact-form',
    wrongPurpProof.code
  );

  // --------------------------------------------------------------------------
  // TEST 11: Timing Signal Check (Bot Submitting in < 600ms)
  // --------------------------------------------------------------------------
  console.log('\nTest 11: Timing signal check (sub-600ms bot submission)...');
  const chal11 = await createCaptchaChallenge({ siteKey, purpose: 'contact-form', clientIp: testIp });
  const rapidVerify = await verifyCaptchaChallenge({
    challengeId: chal11.challengeId!,
    answer: '5',
    signedToken: chal11.signedToken!,
    purpose: 'contact-form',
    siteKey,
    clientIp: testIp,
    elapsedMs: 150, // Rapid automated bot submission (< 600ms)
  });

  assert(
    !rapidVerify.success && rapidVerify.code === 'SUBMISSION_TOO_FAST',
    'Rapid automated submission (< 600ms) flagged and rejected',
    rapidVerify.code
  );

  // --------------------------------------------------------------------------
  // TEST 12: Domain & Origin Allowlist Validation
  // --------------------------------------------------------------------------
  console.log('\nTest 12: Domain & origin allowlist validation...');
  const allowedHeyprince = isOriginAllowed('https://heyprince.in', ['heyprince.in', 'localhost']);
  const allowedWww = isOriginAllowed('https://www.heyprince.in', ['heyprince.in', 'localhost']);
  const blockedHacker = isOriginAllowed('https://evil-phishing-site.com', ['heyprince.in', 'localhost']);

  assert(
    allowedHeyprince && allowedWww && !blockedHacker,
    'Domain allowlist correctly accepts authorized origins and rejects unauthorized origins',
    `HeyPrince: ${allowedHeyprince}, Evil: ${blockedHacker}`
  );

  // --------------------------------------------------------------------------
  // TEST 13: Fail-Closed on Missing / Invalid Proof
  // --------------------------------------------------------------------------
  console.log('\nTest 13: Fail-closed verification behavior...');
  const nullProof = await verifyAndConsumeProof(null, { purpose: 'contact-form' });
  const emptyProof = await verifyAndConsumeProof('', { purpose: 'contact-form' });
  const fakeProof = await verifyAndConsumeProof('cproof_invalid.fake_signature', { purpose: 'contact-form' });

  assert(
    !nullProof.success && !emptyProof.success && !fakeProof.success,
    'Null, empty, and invalid proofs all fail closed immediately'
  );

  // --------------------------------------------------------------------------
  // TEST 14: Rate Limit Counter Verification
  // --------------------------------------------------------------------------
  console.log('\nTest 14: Database atomic rate limit function...');
  const rateKey = `test_rate_counter_${Date.now()}`;
  const r1 = await queryCaptcha(`SELECT check_captcha_rate_limit($1, 2, 60);`, [rateKey]);
  const r2 = await queryCaptcha(`SELECT check_captcha_rate_limit($1, 2, 60);`, [rateKey]);
  const r3 = await queryCaptcha(`SELECT check_captcha_rate_limit($1, 2, 60);`, [rateKey]);

  assert(
    r1[0].check_captcha_rate_limit === true &&
    r2[0].check_captcha_rate_limit === true &&
    r3[0].check_captcha_rate_limit === false,
    'Atomic rate-limit counter allows up to limit (2) and blocks on 3rd request'
  );

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`TEST SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('============================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 All 14 security and functional criteria PASSED successfully!\n');
    process.exit(0);
  } else {
    console.error(`⚠️  ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

