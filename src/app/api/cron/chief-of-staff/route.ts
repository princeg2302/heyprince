import { NextRequest, NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/chief-of-staff/orchestrator';
import { getAllAgents } from '@/lib/chief-of-staff/db';
import { scanGlobalSector, IntelligenceSector } from '@/lib/jarvis/global-brain';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handleCronTrigger(request);
}

export async function POST(request: NextRequest) {
  return handleCronTrigger(request);
}

async function handleCronTrigger(request: NextRequest) {
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
      console.warn('[Cron Chief of Staff] Unauthorized access attempt blocked.');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid or missing CRON_SECRET authentication.',
        },
        { status: 401 }
      );
    }
  } else if (!isVercelCron && process.env.NODE_ENV === 'production') {
    console.warn('[Cron Chief of Staff] Blocked unauthenticated public request.');
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized. Protected cron route.',
      },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const targetAgent = searchParams.get('agent');

  try {
    const allAgents = await getAllAgents();
    const results = [];

    if (targetAgent) {
      const match = allAgents.find((a) => a.id === targetAgent);
      if (!match) {
        return NextResponse.json({ success: false, error: `Agent ${targetAgent} not found` }, { status: 404 });
      }
      const res = await executeAgentTask({
        agentId: targetAgent,
        triggerSource: 'cron',
      });
      results.push(res);
    } else {
      // Run active non-paused scheduled agents sequentially
      for (const agent of allAgents) {
        if (agent.status === 'enabled' && agent.schedule_cron !== 'event_driven') {
          try {
            const res = await executeAgentTask({
              agentId: agent.id,
              triggerSource: 'cron',
            });
            results.push(res);
          } catch (agentErr: any) {
            results.push({
              agentId: agent.id,
              success: false,
              message: agentErr?.message || 'Agent failed during cron run',
              durationMs: 0,
            });
          }
        }
      }
    }

    // 24/7 JARVIS Global Brain Surveillance: cycle through sectors in the background
    try {
      const sectors: IntelligenceSector[] = ['ai', 'technology', 'automobile', 'geopolitics', 'infrastructure', 'recession'];
      const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
      await scanGlobalSector(randomSector);
    } catch (e) {
      console.warn('[Cron Chief of Staff] Global brain scan notice:', e);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tasksRun: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[Cron Chief of Staff] Fatal execution exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal cron execution failure.',
      },
      { status: 500 }
    );
  }
}

