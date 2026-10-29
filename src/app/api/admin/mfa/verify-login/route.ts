import { NextRequest, NextResponse } from 'next/server';
import { getUserById, issueAdminSessionCookie } from '@/lib/admin-db';
import {
  verifyMfaPendingToken,
  getAdminMfaState,
  verifyTOTP,
  verifyAndConsumeRecoveryCode,
  verifyEmailOtp,
} from '@/lib/mfa';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { mfaPendingToken, code, type } = await request.json();

    if (!mfaPendingToken || !code) {
      return NextResponse.json({ success: false, error: 'MFA token and verification code are required.' }, { status: 400 });
    }

    const pending = verifyMfaPendingToken(mfaPendingToken);
    if (!pending) {
      return NextResponse.json(
        { success: false, error: 'MFA session has expired or is invalid. Please log in again.' },
        { status: 401 }
      );
    }

    const mfa = await getAdminMfaState(pending.userId);
    if (!mfa) {
      return NextResponse.json({ success: false, error: 'No MFA configuration found for this account.' }, { status: 400 });
    }

    let isAuthorized = false;
    const factorType = type || 'totp';

    if (factorType === 'totp') {
      if (!mfa.totp_secret) {
        return NextResponse.json({ success: false, error: 'Authenticator app MFA is not configured.' }, { status: 400 });
      }
      isAuthorized = verifyTOTP(code, mfa.totp_secret);
    } else if (factorType === 'recovery') {
      isAuthorized = await verifyAndConsumeRecoveryCode(pending.userId, code);
    } else if (factorType === 'email') {
      isAuthorized = await verifyEmailOtp(pending.userId, code);
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code. Please try again.' },
        { status: 401 }
      );
    }

    // Success: fetch user & issue cryptographically signed session cookie
    const user = await getUserById(pending.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User record not found.' }, { status: 404 });
    }

    await issueAdminSessionCookie(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url || null,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (err: any) {
    console.error('[verify-login] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server authentication error' }, { status: 500 });
  }
}

