import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { updateAgentStatus, updateAgentMode, logChiefActivity } from '@/lib/chief-of-staff/db';
import { AgentStatus, OperatingMode } from '@/lib/chief-of-staff/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId, status, mode } = body;

    if (!agentId) {
      return NextResponse.json({ success: false, error: 'agentId is required' }, { status: 400 });
    }

    if (status) {
      const validStatuses: AgentStatus[] = ['enabled', 'paused', 'running', 'error'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      await updateAgentStatus(agentId, status);
      await logChiefActivity(
        agentId,
        'info',
        `Admin changed agent status to "${status}"`,
        { changedBy: admin.email, newStatus: status }
      );
    }

    if (mode) {
      const validModes: OperatingMode[] = ['observe', 'prepare', 'auto'];
      if (!validModes.includes(mode)) {
        return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 });
      }
      await updateAgentMode(agentId, mode);
      await logChiefActivity(
        agentId,
        'info',
        `Admin changed agent operating mode to "${mode}"`,
        { changedBy: admin.email, newMode: mode }
      );
    }

    return NextResponse.json({ success: true, message: 'Agent configuration updated successfully.' });
  } catch (error: any) {
    console.error('[API /api/admin/chief-of-staff/agent-toggle] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update agent.' },
      { status: 500 }
    );
  }
}

