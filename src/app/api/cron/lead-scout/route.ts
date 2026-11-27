import { NextRequest, NextResponse } from 'next/server';
import { runLeadScoutDiscovery } from '@/lib/chief-of-staff/agents/lead-scout';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handleLeadScoutCron(request);
}

export async function POST(request: NextRequest) {
  return handleLeadScoutCron(request);
}

async function handleLeadScoutCron(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    console.warn('[Cron Lead Scout] Unauthorized request blocked.');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
