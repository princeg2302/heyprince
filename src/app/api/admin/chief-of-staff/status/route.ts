import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getChiefDashboardSummary } from '@/lib/chief-of-staff/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await getChiefDashboardSummary();
    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('[API /api/admin/chief-of-staff/status] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve Chief of Staff status.' },
      { status: 500 }
    );
  }
}

