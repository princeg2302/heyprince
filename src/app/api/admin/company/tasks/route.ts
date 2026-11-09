import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getCompanyTasks, createCompanyTask } from '@/lib/company/db';
import { processCompanyTask } from '@/lib/company/orchestrator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as any;
  const assignedTo = searchParams.get('assignedTo') || undefined;

  try {
    const tasks = await getCompanyTasks({ status, assignedTo, limit: 50 });
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list tasks.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, assignedTo, reviewerId, priority, acceptanceCriteria, executionPayload, executeImmediately } = body;

    if (!title || !description || !assignedTo) {
      return NextResponse.json(
        { success: false, error: 'Missing title, description, or assignedTo.' },
        { status: 400 }
      );
    }

    const task = await createCompanyTask({
      title,
      description,
      assignedTo,
      assignedBy: 'prince_ceo',
      reviewerId,
      priority: priority || 'medium',
      acceptanceCriteria: Array.isArray(acceptanceCriteria) && acceptanceCriteria.length > 0
        ? acceptanceCriteria
        : ['Execute deliverable to enterprise quality standards', 'Validate output metrics and findings'],
      executionPayload: executionPayload || {},
    });

    if (executeImmediately) {
      const execResult = await processCompanyTask(task.id);
      return NextResponse.json({
        success: true,
        task: execResult.task || task,
        message: execResult.message,
        executed: true,
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create task.' },
      { status: 500 }
    );
  }
}
