import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousCompanyCycle } from '@/lib/company/autonomous-worker';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow in dev or if Bearer token matches
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

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

export async function POST(req: NextRequest) {
  return GET(req);
}
