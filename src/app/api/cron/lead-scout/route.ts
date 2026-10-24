import { NextRequest, NextResponse } from 'next/server';
import { runLeadScoutDiscovery } from '@/lib/chief-of-staff/agents/lead-scout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handleLeadScoutCron(request);
}

export async function POST(request: NextRequest) {
  return handleLeadScoutCron(request);
}

async function handleLeadScoutCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get('authorization');
  const customHeader = request.headers.get('x-cron-secret');

  const userAgent = request.headers.get('user-agent') || '';
  const isVercelCron =
    request.headers.get('x-vercel-cron') === '1' ||
    request.headers.has('x-vercel-cron-schedule') ||
    userAgent.toLowerCase().includes('vercel-cron');

  if (cronSecret) {
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const providedSecret = bearerSecret || customHeader;

    if (!providedSecret || providedSecret !== cronSecret) {
      console.warn('[Cron Lead Scout] Blocked unauthorized request.');
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET.' },
        { status: 401 }
      );
    }
  } else if (!isVercelCron && process.env.NODE_ENV === 'production') {
    console.warn('[Cron Lead Scout] Blocked unauthenticated public request.');
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Protected cron route.' },
      { status: 401 }
    );
  }

  try {
    const scoutResult = await runLeadScoutDiscovery();
    return NextResponse.json({
      success: true,
      message: scoutResult.summary,
      scanTarget: scoutResult.scanTarget,
      leadsDiscovered: scoutResult.leadsDiscovered,
      draftsCreated: scoutResult.draftsCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Cron Lead Scout] Automated scan error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Daily Lead Scout execution failed' },
      { status: 500 }
    );
  }
}

