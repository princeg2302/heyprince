import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, verifyPassword, supabase } from '@/lib/admin-db';
import { disableAdminMfa } from '@/lib/mfa';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Password confirmation is required to disable MFA' }, { status: 400 });
    }

    const { data: userRecord, error: userErr } = await supabase
      .from('users')
      .select('id, salt, hash')
      .eq('id', admin.id)
      .single();

    if (userErr || !userRecord) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    const isMatch = verifyPassword(password, userRecord.salt, userRecord.hash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Incorrect administrator password.' }, { status: 401 });
    }

    await disableAdminMfa(admin.id);

    return NextResponse.json({
      success: true,
      message: 'MFA has been successfully disabled.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

