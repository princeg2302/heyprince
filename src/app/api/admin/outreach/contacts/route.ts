import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { getAllContacts } from '@/lib/outreach/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
    const contacts = await getAllContacts(limit);
    return NextResponse.json({ success: true, contacts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

