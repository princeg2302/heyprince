import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getAllSocialPlatformStatuses } from '@/lib/social/publisher';
import { getRecentSocialShares } from '@/lib/social/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const platforms = getAllSocialPlatformStatuses();
    const recentShares = await getRecentSocialShares(15);

    return NextResponse.json({
      success: true,
      platforms,
      recentShares,
    });
  } catch (err: any) {
    console.error('[API Social Status] Error fetching status:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error fetching status.' },
      { status: 500 }
    );
  }
}
