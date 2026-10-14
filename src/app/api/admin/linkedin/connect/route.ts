import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  getLinkedInConfig,
  generateOAuthState,
  getLinkedInAuthorizationUrl,
} from '@/lib/linkedin/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const config = getLinkedInConfig();
  if (!config.clientId) {
    return NextResponse.json(
      {
        success: false,
        error: 'LINKEDIN_CLIENT_ID is not configured in environment variables.',
      },
      { status: 500 }
    );
  }

  const state = generateOAuthState(admin.id);
  const authUrl = getLinkedInAuthorizationUrl(state);

  // Check if client expects JSON or direct redirect
  const format = request.nextUrl.searchParams.get('format');
  if (format === 'json') {
    const res = NextResponse.json({ success: true, url: authUrl, state });
    res.cookies.set('hp_linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });
    return res;
  }

  // Redirect directly to LinkedIn authorization page
  const res = NextResponse.redirect(authUrl);
  res.cookies.set('hp_linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });
  return res;
}

