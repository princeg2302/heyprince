import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { createDiscussion, getActiveDiscussions } from '@/lib/company/db';
import { advanceDiscussionTurn } from '@/lib/company/orchestrator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const discussions = await getActiveDiscussions(20);
    return NextResponse.json({ success: true, discussions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list discussions.' },
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
    const { roomId, title, objective, participantIds, tokenBudget, maxTurns } = body;

    if (!roomId || !title || !objective) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: roomId, title, objective.' },
        { status: 400 }
      );
    }

    const discussion = await createDiscussion({
      roomId,
      title,
      objective,
      participantIds: participantIds || [],
      tokenBudget,
      maxTurns,
    });

    // Automatically trigger Alex Vance's opening statement
    await advanceDiscussionTurn(discussion.id);

    return NextResponse.json({ success: true, discussion });
  } catch (error: any) {
    console.error('[API /api/admin/company/discussions] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to initialize discussion.' },
      { status: 500 }
    );
  }
}
