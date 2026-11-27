import { NextRequest, NextResponse } from 'next/server';
import { executeDailyNewsAutomation } from '@/lib/daily-news/orchestrator';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Daily content automation. Production requests require CRON_SECRET. */
export async function GET(request: NextRequest) {
  return handleCronTrigger(request);
}

export async function POST(request: NextRequest) {
  return handleCronTrigger(request);
}

async function handleCronTrigger(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    console.warn('[Cron Daily News] Unauthorized request blocked.');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Prevent execution on preview deployments unless explicitly forced.
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== 'production' && !request.nextUrl.searchParams.has('force')) {
    return NextResponse.json({
      success: true,
      message: `Cron automation is restricted to production. Current environment: ${vercelEnv}`,
    });
  }

  try {
    const result = await executeDailyNewsAutomation({ triggerType: 'scheduled' });
    console.info(
      `[Cron Daily News] Run finished: ${result.status} (Website: ${result.websiteStatus}, LinkedIn: ${result.linkedinStatus})`
    );
    return NextResponse.json(result, { status: result.status === 'failed' ? 500 : 200 });
  } catch (err: any) {
    console.error('[Cron Daily News] Execution failure:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unhandled exception in daily news cron' },
      { status: 500 }
    );
  }
}
