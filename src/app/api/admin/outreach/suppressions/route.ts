import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { query, addSuppression } from '@/lib/outreach/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const items = await query(`SELECT * FROM suppressions ORDER BY created_at DESC LIMIT 100;`);
    return NextResponse.json({ success: true, suppressions: items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { email, domain, reason } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const item = await addSuppression({
      email,
      domain: domain || null,
      reason: reason || 'MANUAL_BLOCK',
      source: `admin_manual_${auth.email}`,
      metadata: { addedBy: auth.email, addedAt: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, message: `Address ${email} added to suppression list.`, suppression: item });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
