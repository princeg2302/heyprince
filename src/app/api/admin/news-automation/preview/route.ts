import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { executeDailyNewsAutomation } from '@/lib/daily-news/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await executeDailyNewsAutomation({
      triggerType: 'preview',
      contentType: body?.contentType,
      customTopic: body?.customTopic,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[DailyNewsPreviewAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Preview generation failed' },
      { status: 500 }
    );
  }
}

