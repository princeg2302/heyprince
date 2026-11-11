import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getCompanyOverview } from '@/lib/company/db';
import { triggerOpportunisticAutonomousCycle } from '@/lib/company/autonomous-worker';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Heartbeat pulse: trigger autonomous workforce cycle if >= 10 mins have elapsed
  triggerOpportunisticAutonomousCycle(10 * 60 * 1000).catch((pulseErr) => {
    console.warn('[Overview Heartbeat] Background pulse notice:', pulseErr);
  });

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
