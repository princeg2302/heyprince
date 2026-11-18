import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getStorageDashboardSummary, getRetainedPublishedVideoJobs } from '@/lib/video-studio/db';
import { enforceR2RetentionPolicy } from '@/lib/video-studio/retention';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await getStorageDashboardSummary();
    const retainedJobs = await getRetainedPublishedVideoJobs();

    return NextResponse.json({
      success: true,
      summary,
      retainedJobs,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/storage GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch storage summary' },
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
    // Run retention enforcement check across published jobs
    const retainedJobs = await getRetainedPublishedVideoJobs();
    if (retainedJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No published jobs found in retention pool. Cleanup not needed.',
        summary: await getStorageDashboardSummary(),
      });
    }

    // Pass the newest published job to retention enforcer
    const newestJob = retainedJobs[0];
    const enforcementResult = await enforceR2RetentionPolicy(newestJob);

    const updatedSummary = await getStorageDashboardSummary();

    const objectsCount = enforcementResult.objectsDeleted?.length || 0;
    return NextResponse.json({
      success: true,
      message: objectsCount > 0
        ? `Retention cleanup completed. Pruned ${objectsCount} assets (${(enforcementResult.bytesFreed / 1024 / 1024).toFixed(2)} MB reclaimed).`
        : 'Retention pool is within limits. No cleanup required.',
      enforcementResult,
      summary: updatedSummary,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/storage POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to enforce storage retention' },
      { status: 500 }
    );
  }
}
