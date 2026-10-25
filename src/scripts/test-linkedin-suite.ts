import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import {
  getLinkedInConfig,
  generateOAuthState,
  verifyOAuthState,
  getLinkedInAuthorizationUrl,
  saveLinkedInConnection,
  getActiveLinkedInConnection,
  disconnectLinkedInConnection,
} from '../lib/linkedin/client';
import { query } from '../lib/outreach/db';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const envLocal = path.resolve(dirname, '../../.env.local');
if (typeof (process as any).loadEnvFile === 'function' && fs.existsSync(envLocal)) {
  (process as any).loadEnvFile(envLocal);
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 HeyPrince LinkedIn Integration & OAuth Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(name: string) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  }

  function fail(name: string, error: any) {
    failed++;
    console.error(`  ❌ FAIL: ${name}`, error);
  }

  // Test 1: Configuration check
  try {
    const config = getLinkedInConfig();
    assert.strictEqual(
      config.redirectUri,
      process.env.LINKEDIN_REDIRECT_URI || 'https://heyprince.in/api/linkedin/callback'
    );
    assert.strictEqual(
      config.scope,
      process.env.LINKEDIN_SCOPE || 'openid profile email w_member_social'
    );
    pass('Configuration: Validates redirect URI and OpenID + w_member_social scope defaults');
  } catch (err) {
    fail('Configuration: Validates redirect URI and OpenID + w_member_social scope defaults', err);
  }

  // Test 2: OAuth 2.0 State Security (HMAC Signing & Verification)
  try {
    const state = generateOAuthState(42);
    assert.ok(state && state.length > 30, 'State should be a non-empty string');

    const result = verifyOAuthState(state);
    assert.strictEqual(result.valid, true, 'Valid state should verify');
    assert.strictEqual(result.adminUserId, 42, 'Admin user ID should match');

    // Tampered state test
    const tampered = state.slice(0, -4) + 'abcd';
    const tamperedRes = verifyOAuthState(tampered);
    assert.strictEqual(tamperedRes.valid, false, 'Tampered state must be rejected');

    pass('State Security: HMAC signature generation and tamper protection');
  } catch (err) {
    fail('State Security: HMAC signature generation and tamper protection', err);
  }

  // Test 3: OAuth 2.0 Authorization URL Construction
  try {
    // Provide temporary test clientId if env var is empty
    const origEnv = process.env.LINKEDIN_CLIENT_ID;
    if (!process.env.LINKEDIN_CLIENT_ID) {
      process.env.LINKEDIN_CLIENT_ID = 'test_client_id_12345';
    }

    const testState = generateOAuthState(1);
    const authUrl = getLinkedInAuthorizationUrl(testState);

    const parsed = new URL(authUrl);
    assert.strictEqual(parsed.origin, 'https://www.linkedin.com');
    assert.strictEqual(parsed.pathname, '/oauth/v2/authorization');
    assert.strictEqual(parsed.searchParams.get('response_type'), 'code');
    assert.strictEqual(parsed.searchParams.get('client_id'), process.env.LINKEDIN_CLIENT_ID);
    assert.strictEqual(
      parsed.searchParams.get('redirect_uri'),
      process.env.LINKEDIN_REDIRECT_URI || 'https://heyprince.in/api/linkedin/callback'
    );
    assert.strictEqual(
      parsed.searchParams.get('scope'),
      process.env.LINKEDIN_SCOPE || 'openid profile email w_member_social'
    );
    assert.strictEqual(parsed.searchParams.get('state'), testState);

    if (origEnv !== undefined) {
      process.env.LINKEDIN_CLIENT_ID = origEnv;
    } else {
      delete process.env.LINKEDIN_CLIENT_ID;
    }
    pass('Authorization URL: Exactly matches LinkedIn OAuth specifications and registered callback');
  } catch (err) {
    fail('Authorization URL: Exactly matches LinkedIn OAuth specifications and registered callback', err);
  }

  // Test 4: Supabase Connection Persistence & Active Session Handling
  try {
    // Remember existing active connection to restore after testing
    const existingActive = await query<any>(`SELECT id FROM linkedin_connections WHERE is_active = true ORDER BY id DESC LIMIT 1;`);
    const restoreId = existingActive[0]?.id;

    // Save mock test connection
    const testUrn = 'urn:li:person:TEST_MEMBER_9999';
    await saveLinkedInConnection({
      adminUserId: 1,
      personUrn: testUrn,
      memberId: 'TEST_MEMBER_9999',
      name: 'Prince Test Profile',
      accessToken: 'MOCK_ACCESS_TOKEN_FOR_VERIFICATION',
      expiresInSeconds: 3600,
      scope: 'w_member_social',
    });

    const active = await getActiveLinkedInConnection();
    assert.ok(active, 'Active connection should exist in database');
    assert.strictEqual(active.person_urn, testUrn);
    assert.strictEqual(active.name, 'Prince Test Profile');
    assert.strictEqual(active.is_active, true);

    // Test post share logging
    const postRows = await query(`SELECT id FROM posts ORDER BY id DESC LIMIT 1;`);
    if (postRows.length > 0) {
      const postId = postRows[0].id;
      await query(
        `
        INSERT INTO linkedin_post_shares (
          post_id,
          linkedin_post_urn,
          author_urn,
          status,
          commentary,
          article_url,
          api_response,
          created_at
        ) VALUES ($1, $2, $3, 'published', $4, $5, $6, NOW());
        `,
        [
          postId,
          'urn:li:share:TEST_MOCK_SHARE',
          testUrn,
          'Test Commentary',
          'https://heyprince.in/insights/test-post/',
          JSON.stringify({ mock: true }),
        ]
      );

      const shareCheck = await query(
        `SELECT * FROM linkedin_post_shares WHERE linkedin_post_urn = 'urn:li:share:TEST_MOCK_SHARE';`
      );
      assert.strictEqual(shareCheck.length, 1);
    }

    // Clean up test records
    await query(`DELETE FROM linkedin_post_shares WHERE linkedin_post_urn = 'urn:li:share:TEST_MOCK_SHARE';`);
    await disconnectLinkedInConnection();
    const afterDisconnect = await getActiveLinkedInConnection();
    assert.strictEqual(afterDisconnect, null, 'Connection should be inactive after disconnect');
    await query(`DELETE FROM linkedin_connections WHERE person_urn = '${testUrn}';`);
    if (restoreId) {
      await query(`UPDATE linkedin_connections SET is_active = true WHERE id = $1;`, [restoreId]);
    }

    pass('Supabase Persistence: Stores, activates, logs shares, and disconnects securely');
  } catch (err) {
    fail('Supabase Persistence: Stores, activates, logs shares, and disconnects securely', err);
  }

  // Test 5: Real LinkedIn API Key Evaluation
  const config = getLinkedInConfig();
  console.log('\n------------------------------------------------------');
  console.log('🔍 Live LinkedIn API Credential & Endpoint Diagnostic');
  console.log('------------------------------------------------------');
  console.log(`  • LINKEDIN_CLIENT_ID:     ${config.clientId ? 'CONFIGURED (' + config.clientId.slice(0, 4) + '...)' : 'MISSING'}`);
  console.log(`  • LINKEDIN_CLIENT_SECRET: ${config.clientSecret ? 'CONFIGURED (Set)' : 'MISSING'}`);
  console.log(`  • LINKEDIN_REDIRECT_URI:  ${config.redirectUri}`);
  console.log(`  • Required Scope:         ${config.scope}`);

  if (!config.clientId || !config.clientSecret) {
    console.log(
      '\n  ⚠️  Notice: Client ID / Secret are not yet in local environment.\n' +
      '      Server-side architecture and callback route are ready.\n' +
      '      Once you add LINKEDIN_CLIENT_ID & LINKEDIN_CLIENT_SECRET, real OAuth and publishing will run.'
    );
  }

  console.log('------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
