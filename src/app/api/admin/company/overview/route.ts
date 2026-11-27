import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getCompanyOverview } from '@/lib/company/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getCompanyOverview();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[API /api/admin/company/overview] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve company overview.' },
      { status: 500 }
    );
  }
}
