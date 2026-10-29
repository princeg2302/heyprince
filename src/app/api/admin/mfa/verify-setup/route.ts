import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { verifyTOTP, enableAdminTotpMfa } from '@/lib/mfa';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, secret, hashedRecoveryCodes } = await request.json();

    if (!code || !secret || !Array.isArray(hashedRecoveryCodes)) {
      return NextResponse.json({ error: 'Missing required setup verification parameters' }, { status: 400 });
    }

    const isValid = verifyTOTP(code, secret);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid 6-digit verification code. Please check your authenticator app and try again.' }, { status: 400 });
    }

    await enableAdminTotpMfa(admin.id, secret, hashedRecoveryCodes);

    return NextResponse.json({
      success: true,
      message: 'Multi-Factor Authentication (MFA) enabled successfully for your administrator account.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

