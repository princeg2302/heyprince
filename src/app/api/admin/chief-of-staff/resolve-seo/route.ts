import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { updateSeoRecommendationStatus, logChiefActivity } from '@/lib/chief-of-staff/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id and status are required' }, { status: 400 });
    }

    const validStatuses = ['open', 'approved', 'applied', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    await updateSeoRecommendationStatus(id, status);
    await logChiefActivity(
      'seo_growth',
      'info',
      `Admin resolved SEO recommendation #${id} as "${status}"`,
      { resolvedBy: admin.email, newStatus: status }
    );

    return NextResponse.json({ success: true, message: `SEO recommendation marked as ${status}.` });
  } catch (error: any) {
    console.error('[API /api/admin/chief-of-staff/resolve-seo] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update SEO recommendation.' },
      { status: 500 }
    );
  }
}
