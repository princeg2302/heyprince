import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getCompanyTaskById, updateTaskStatus } from '@/lib/company/db';
import { processCompanyTask } from '@/lib/company/orchestrator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const task = await getCompanyTaskById(id);
  if (!task) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, task });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'execute') {
      const result = await processCompanyTask(id);
      return NextResponse.json(result);
    }

    if (body.status) {
      const task = await updateTaskStatus(id, body.status, body.outputResult, body.verificationNotes);
      return NextResponse.json({ success: true, task });
    }

    return NextResponse.json({ success: false, error: 'No valid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update task.' },
      { status: 500 }
    );
  }
}
