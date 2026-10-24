import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { deleteDailyRunsBulk } from '@/lib/daily-news/db';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const ids: number[] = Array.isArray(body.ids) ? body.ids : [];
    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'ids array is required' }, { status: 400 });
    }

    await deleteDailyRunsBulk(ids);
    return NextResponse.json({ success: true, count: ids.length });
  } catch (err: any) {
    console.error('[DailyNewsRunsAPI] Delete error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete runs' },
      { status: 500 }
    );
  }
}

