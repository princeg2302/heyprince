import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { updateAgentStatus, updateAgentMode, logChiefActivity } from '@/lib/chief-of-staff/db';
import { AgentStatus, OperatingMode } from '@/lib/chief-of-staff/types';

export const dynamic = 'force-dynamic';

const ALL_CHIEF_AGENTS = [
  'content_researcher',
  'website_guardian',
  'seo_growth',
  'inbound_responder',
  'lead_scout',
];

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { agentId, agentIds, quantifier, status, mode } = body;

    // Normalizing mode names (e.g. "mode b", "b", "prepare")
    if (typeof mode === 'string') {
      const lm = mode.toLowerCase().trim();
      if (lm === 'b' || lm === 'mode b' || lm === 'prepare') mode = 'prepare';
      else if (lm === 'a' || lm === 'mode a' || lm === 'observe') mode = 'observe';
      else if (lm === 'c' || lm === 'mode c' || lm === 'auto') mode = 'auto';
    }

    // Resolving target agents based on quantifier or array
    let targetAgents: string[] = [];

    if (quantifier === 'all' || agentId === 'all' || agentIds === 'all') {
      targetAgents = [...ALL_CHIEF_AGENTS];
    } else if (quantifier === 'first_three' || agentId === 'first_three' || quantifier === '3') {
      targetAgents = ALL_CHIEF_AGENTS.slice(0, 3);
    } else if (quantifier === 'first_two' || agentId === 'first_two' || quantifier === '2') {
      targetAgents = ALL_CHIEF_AGENTS.slice(0, 2);
    } else if (quantifier === 'first_one' || agentId === 'first_one' || quantifier === '1') {
      targetAgents = ALL_CHIEF_AGENTS.slice(0, 1);
    } else if (Array.isArray(agentIds) && agentIds.length > 0) {
      targetAgents = agentIds;
    } else if (typeof agentId === 'string' && agentId) {
      targetAgents = [agentId];
    }

    if (targetAgents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid agentId, agentIds, or quantifier is required' },
        { status: 400 }
      );
    }

    const updated: string[] = [];

    for (const id of targetAgents) {
      if (status) {
        const validStatuses: AgentStatus[] = ['enabled', 'paused', 'running', 'error'];
        if (validStatuses.includes(status)) {
          await updateAgentStatus(id, status);
          await logChiefActivity(
            id,
            'info',
            `Admin changed agent status to "${status}"`,
            { changedBy: admin.email, newStatus: status, quantifier: quantifier || 'single' }
          );
        }
      }

      if (mode) {
        const validModes: OperatingMode[] = ['observe', 'prepare', 'auto'];
        if (validModes.includes(mode)) {
          await updateAgentMode(id, mode);
          await logChiefActivity(
            id,
            'info',
            `Admin changed agent operating mode to "${mode}"`,
            { changedBy: admin.email, newMode: mode, quantifier: quantifier || 'single' }
          );
        }
      }

      updated.push(id);
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated.length} agent(s) successfully.`,
      updatedCount: updated.length,
      updatedAgents: updated,
      modeApplied: mode || null,
      statusApplied: status || null,
    });
  } catch (error: any) {
    console.error('[API /api/admin/chief-of-staff/agent-toggle] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update agent(s).' },
      { status: 500 }
    );
  }
}
