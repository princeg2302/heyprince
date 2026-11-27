import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousCompanyCycle } from '@/lib/company/autonomous-worker';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    console.warn('[Cron:CompanyWorkforce] Unauthorized request blocked.');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await runAutonomousCompanyCycle();
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error('[Cron:CompanyWorkforce] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
