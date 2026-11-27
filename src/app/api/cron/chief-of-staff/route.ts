import { NextRequest, NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/chief-of-staff/orchestrator';
import { getAllAgents } from '@/lib/chief-of-staff/db';
import { scanGlobalSector, IntelligenceSector } from '@/lib/jarvis/global-brain';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handleCronTrigger(request);
}

export async function POST(request: NextRequest) {
  return handleCronTrigger(request);
}

async function handleCronTrigger(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    console.warn('[Cron Chief of Staff] Unauthorized request blocked.');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const targetAgent = request.nextUrl.searchParams.get('agent');

  try {
    const allAgents = await getAllAgents();
    const results = [];

    if (targetAgent) {
      const match = allAgents.find((agent) => agent.id === targetAgent);
      if (!match) {
        return NextResponse.json({ success: false, error: `Agent ${targetAgent} not found` }, { status: 404 });
      }
      results.push(await executeAgentTask({ agentId: targetAgent, triggerSource: 'cron' }));
    } else {
      // This endpoint is the executive sweep. Dedicated agents with their own
      // Vercel cron routes are deliberately excluded to avoid duplicate runs.
      for (const agent of allAgents) {
        if (agent.status !== 'enabled' || agent.schedule_cron === 'event_driven') continue;
        if (agent.id === 'lead_scout' || agent.id === 'alex_vance') continue;
        try {
          results.push(await executeAgentTask({ agentId: agent.id, triggerSource: 'cron' }));
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

    try {
      const sectors: IntelligenceSector[] = ['ai', 'technology', 'automobile', 'geopolitics', 'infrastructure', 'recession'];
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      await scanGlobalSector(sector);
    } catch (error) {
      console.warn('[Cron Chief of Staff] Global brain scan notice:', error);
    }

    const hasFailures = results.some((result: any) => result.success === false);
    return NextResponse.json({
      success: !hasFailures,
      timestamp: new Date().toISOString(),
      tasksRun: results.length,
      results,
    }, { status: hasFailures ? 500 : 200 });
  } catch (error: any) {
    console.error('[Cron Chief of Staff] Fatal execution exception:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal cron execution failure.' },
      { status: 500 }
    );
  }
}
