import { NextRequest, NextResponse } from 'next/server';
import { verifyMfaPendingToken, sendEmailOtp } from '@/lib/mfa';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { mfaPendingToken } = await request.json();

    if (!mfaPendingToken) {
      return NextResponse.json({ success: false, error: 'MFA token is required.' }, { status: 400 });
    }

    const pending = verifyMfaPendingToken(mfaPendingToken);
    if (!pending) {
      return NextResponse.json(
        { success: false, error: 'MFA session expired. Please log in again.' },
        { status: 401 }
      );
    }

    const result = await sendEmailOtp(pending.userId, pending.email);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send verification email.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code was sent to ${pending.email}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

