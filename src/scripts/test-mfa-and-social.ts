import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const envLocal = path.resolve(dirname, '../../.env.local');
if (typeof (process as any).loadEnvFile === 'function' && fs.existsSync(envLocal)) {
  (process as any).loadEnvFile(envLocal);
}

import {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  getOtpAuthUri,
  generateRecoveryCodes,
  hashRecoveryCode,
  createMfaPendingToken,
  verifyMfaPendingToken,
} from '../lib/mfa';

import {
  signAdminSessionToken,
  verifyAdminSessionToken,
} from '../lib/admin-db';

import {
  getAllSocialLinks,
  updateSocialLink,
} from '../lib/social-links';

async function runTests() {
  console.log('--- RUNNING MFA & SOCIAL LINKS TEST SUITE ---');

  // Test 1: Base32 Secret & URI
  const secret = generateBase32Secret(20);
  assert.ok(secret && secret.length >= 26, 'Secret should be base32 string');
  const uri = getOtpAuthUri('contact@heyprince.in', secret);
  assert.ok(uri.startsWith('otpauth://totp/HeyPrince:'), 'URI should be valid otpauth');
  console.log('✓ Test 1: Base32 Secret & OTPAuth URI generation passed');

  // Test 2: TOTP Generation & Verification
  const totp = generateTOTP(secret);
  assert.strictEqual(totp.length, 6, 'TOTP must be 6 digits');
  const isValid = verifyTOTP(totp, secret);
  assert.strictEqual(isValid, true, 'Current TOTP must be valid');
  const isInvalid = verifyTOTP('000000', secret);
  assert.strictEqual(isInvalid, false, 'Arbitrary code must be rejected');
  console.log('✓ Test 2: TOTP RFC 6238 generation and verification passed');

  // Test 3: Recovery Codes
  const { rawCodes, hashedCodes } = generateRecoveryCodes(8);
  assert.strictEqual(rawCodes.length, 8, 'Should generate 8 recovery codes');
  assert.strictEqual(hashedCodes.length, 8, 'Should generate 8 hashed recovery codes');
  const sampleHash = hashRecoveryCode(rawCodes[0]);
  assert.strictEqual(sampleHash, hashedCodes[0].hash, 'Recovery code hash must match');
  console.log('✓ Test 3: Emergency Backup Recovery Codes generation passed');

  // Test 4: MFA Pending Token (HMAC-SHA256)
  const pendingToken = createMfaPendingToken(1, 'contact@heyprince.in');
  assert.ok(pendingToken.includes('.'), 'Pending token must be signed with signature');
  const verified = verifyMfaPendingToken(pendingToken);
  assert.ok(verified, 'Valid pending token must verify');
  assert.strictEqual(verified.userId, 1, 'User ID must match');

  const tamperedToken = pendingToken.slice(0, -4) + 'abcd';
  const tamperedResult = verifyMfaPendingToken(tamperedToken);
  assert.strictEqual(tamperedResult, null, 'Tampered token must be rejected');
  console.log('✓ Test 4: MFA Pending Token HMAC signing and tampering rejection passed');

  // Test 5: Admin Session Token Signing (HMAC-SHA256)
  const sessionData = {
    id: 1,
    email: 'contact@heyprince.in',
    role: 'admin',
    exp: Date.now() + 3600000,
  };
  const sessionToken = signAdminSessionToken(sessionData);
  assert.ok(sessionToken.includes('.'), 'Session token must be dot-delimited');
  const sessionVerified = verifyAdminSessionToken(sessionToken);
  assert.ok(sessionVerified, 'Session token should verify');
  assert.strictEqual(sessionVerified.id, 1, 'Verified payload id must match');

  const forgedSession = Buffer.from(JSON.stringify({ id: 1, email: 'fake@hacker.com', exp: 999999999999 })).toString('base64url') + '.fakeSig';
  const forgedResult = verifyAdminSessionToken(forgedSession);
  assert.strictEqual(forgedResult, null, 'Forged session token must be rejected');
  console.log('✓ Test 5: Admin Session Token HMAC cryptographic signature passed');

  // Test 6: Social Links DB read & update
  const links = await getAllSocialLinks();
  assert.ok(Array.isArray(links), 'Social links should return an array');
  const linkedin = links.find((l) => l.platform === 'linkedin');
  assert.ok(linkedin, 'LinkedIn link should exist in database');
  console.log(`✓ Test 6: Social Links DB read verified (${links.length} links configured)`);

  console.log('\n--- ALL MFA & SOCIAL LINKS TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

