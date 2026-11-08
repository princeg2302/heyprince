import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { advanceDiscussionTurn, finishAndSynthesizeDiscussion } from '@/lib/company/orchestrator';

export const dynamic = 'force-dynamic';

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
    if (body.action === 'conclude') {
      const res = await finishAndSynthesizeDiscussion(id);
      return NextResponse.json({
        success: true,
        status: 'concluded',
        conclusion: res.conclusion,
        proposalId: res.proposalId,
      });
    }

    const result = await advanceDiscussionTurn(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /api/admin/company/discussions/[id]/turn] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to advance turn.' },
      { status: 500 }
    );
  }
}
