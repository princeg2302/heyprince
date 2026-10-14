import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  verifyOAuthState,
  exchangeCodeForTokens,
  resolveMemberIdentity,
  saveLinkedInConnection,
} from '@/lib/linkedin/client';

export const dynamic = 'force-dynamic';

/**
 * Production OAuth 2.0 Callback Route for LinkedIn
 * Exact URL: https://heyprince.in/api/linkedin/callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('hp_linkedin_oauth_state')?.value;

  // Base redirect URL back to admin settings
  const redirectBase = new URL('/admin/settings/', request.nextUrl.origin);

  // 1. Handle error response from LinkedIn
  if (error) {
    console.error('[LinkedIn OAuth Callback] LinkedIn error:', error, errorDescription);
    redirectBase.searchParams.set('linkedin_error', errorDescription || error);
    const res = NextResponse.redirect(redirectBase);
    res.cookies.delete('hp_linkedin_oauth_state');
    return res;
  }

  // 2. Validate code and state presence
  if (!code || !state) {
    console.warn('[LinkedIn OAuth Callback] Missing authorization code or state parameter.');
    redirectBase.searchParams.set(
      'linkedin_error',
      'Missing authorization code or state parameter from LinkedIn.'
    );
    return NextResponse.redirect(redirectBase);
  }

  // 3. Verify state matches stored cookie (CSRF defense)
  if (!storedState || storedState !== state) {
    console.warn('[LinkedIn OAuth Callback] State parameter mismatch or cookie missing.', {
      stateProvided: Boolean(state),
      cookiePresent: Boolean(storedState),
    });
    redirectBase.searchParams.set(
      'linkedin_error',
      'OAuth state validation failed (possible CSRF or session expired). Please try connecting again.'
    );
    const res = NextResponse.redirect(redirectBase);
    res.cookies.delete('hp_linkedin_oauth_state');
    return res;
  }

  // 4. Verify HMAC cryptographic signature and 15-min expiration
  const stateVerification = verifyOAuthState(state);
  if (!stateVerification.valid) {
    console.warn('[LinkedIn OAuth Callback] State HMAC invalid:', stateVerification.error);
    redirectBase.searchParams.set(
      'linkedin_error',
      `OAuth state security check failed: ${stateVerification.error || 'Tampered or expired state'}`
    );
    const res = NextResponse.redirect(redirectBase);
    res.cookies.delete('hp_linkedin_oauth_state');
    return res;
  }

  // 5. Exchange authorization code for access token
  try {
    const tokens = await exchangeCodeForTokens(code);

    // 6. Resolve member Person URN and profile details
    let member;
    try {
      member = await resolveMemberIdentity(tokens.access_token, tokens.id_token);
    } catch (identityErr: any) {
      console.warn('[LinkedIn OAuth Callback] Member resolution notice:', identityErr?.message);
      // If userinfo endpoint could not resolve URN because app only has w_member_social,
      // fallback to placeholder so access token is still safely stored server-side
      member = {
        personUrn: 'urn:li:person:UNKNOWN',
        memberId: 'UNKNOWN',
        name: 'LinkedIn Member',
      };
    }

    // 7. Persist active connection into Supabase
    await saveLinkedInConnection({
      adminUserId: stateVerification.adminUserId,
      personUrn: member.personUrn,
      memberId: member.memberId,
      name: member.name,
      avatarUrl: member.avatarUrl,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresInSeconds: tokens.expires_in,
      refreshTokenExpiresInSeconds: tokens.refresh_token_expires_in,
      scope: tokens.scope || 'w_member_social',
    });

    console.info(
      `[LinkedIn OAuth Callback] Successfully connected personal profile (${member.personUrn}) to Supabase.`
    );

    redirectBase.searchParams.set('linkedin', 'connected');
    if (member.name && member.name !== 'LinkedIn Member') {
      redirectBase.searchParams.set('linkedin_name', member.name);
    }
    if (member.personUrn === 'urn:li:person:UNKNOWN') {
      redirectBase.searchParams.set('linkedin_notice', 'need_person_urn');
    }

    const response = NextResponse.redirect(redirectBase);
    response.cookies.delete('hp_linkedin_oauth_state');
    return response;
  } catch (exchangeErr: any) {
    console.error('[LinkedIn OAuth Callback] Error during token exchange:', exchangeErr);
    redirectBase.searchParams.set(
      'linkedin_error',
      exchangeErr?.message || 'Failed to exchange authorization code for access tokens.'
    );
    const response = NextResponse.redirect(redirectBase);
    response.cookies.delete('hp_linkedin_oauth_state');
    return response;
  }
}
