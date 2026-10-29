import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { generateBase32Secret, getOtpAuthUri, generateRecoveryCodes } from '@/lib/mfa';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = generateBase32Secret(20);
    const otpAuthUri = getOtpAuthUri(admin.email, secret);
    const { rawCodes, hashedCodes } = generateRecoveryCodes(8);

    return NextResponse.json({
      success: true,
      secret,
      otpAuthUri,
      recoveryCodes: rawCodes,
      hashedRecoveryCodes: hashedCodes,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

