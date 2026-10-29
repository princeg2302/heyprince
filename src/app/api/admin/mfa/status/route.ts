import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getAdminMfaState } from '@/lib/mfa';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mfa = await getAdminMfaState(admin.id);
    const mfaEnabled = Boolean(mfa?.mfa_enabled);

    let recoveryCodesLeft = 0;
    if (mfa && Array.isArray(mfa.recovery_codes)) {
      recoveryCodesLeft = mfa.recovery_codes.filter((c: any) => !c.used).length;
    }

    return NextResponse.json({
      success: true,
      mfaEnabled,
      recoveryCodesLeft,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
