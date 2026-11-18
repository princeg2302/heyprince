import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getVideoStudioSettings, updateVideoStudioSettings } from '@/lib/video-studio/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getVideoStudioSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/settings GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch video studio settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const updated = await updateVideoStudioSettings(body);

    return NextResponse.json({
      success: true,
      message: 'Video Studio settings saved successfully',
      settings: updated,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/settings POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update video studio settings' },
      { status: 500 }
    );
  }
}
