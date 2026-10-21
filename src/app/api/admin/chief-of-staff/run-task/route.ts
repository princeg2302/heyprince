import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { executeAgentTask } from '@/lib/chief-of-staff/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId, payload } = body;

    if (!agentId) {
      return NextResponse.json({ success: false, error: 'agentId is required' }, { status: 400 });
    }

    const result = await executeAgentTask({
      agentId,
      triggerSource: 'manual',
      payload: { ...payload, triggeredByAdmin: admin.email },
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('[API /api/admin/chief-of-staff/run-task] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Agent execution failed.' },
      { status: 500 }
    );
  }
}
