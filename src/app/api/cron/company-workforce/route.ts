import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousCompanyCycle } from '@/lib/company/autonomous-worker';
import { getCurrentAdmin } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const customHeader = req.headers.get('x-cron-secret');
    const cronSecret = process.env.CRON_SECRET?.trim();

    const userAgent = req.headers.get('user-agent') || '';
    const isVercelCron =
      req.headers.get('x-vercel-cron') === '1' ||
      req.headers.has('x-vercel-cron-schedule') ||
      userAgent.toLowerCase().includes('vercel-cron');

    if (cronSecret) {
      const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
      const providedSecret = bearerSecret || customHeader;

      if (!providedSecret || providedSecret !== cronSecret) {
        if (!isVercelCron) {
          const admin = await getCurrentAdmin();
          if (!admin) {
            return NextResponse.json({ error: 'Unauthorized: Invalid CRON_SECRET or session' }, { status: 401 });
          }
        }
      }
    } else if (process.env.NODE_ENV === 'production' && !isVercelCron) {
      const admin = await getCurrentAdmin();
      if (!admin) {
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
