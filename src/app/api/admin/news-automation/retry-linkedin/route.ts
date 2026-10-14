import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { retryLinkedInPublishForRun } from '@/lib/daily-news/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const runId = parseInt(body.runId, 10);

    if (isNaN(runId)) {
      return NextResponse.json(
        { success: false, error: 'Valid runId integer is required.' },
        { status: 400 }
      );
    }

    const result = await retryLinkedInPublishForRun(runId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[DailyNewsRetryLinkedInAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Retry failed' },
      { status: 500 }
    );
  }
}

