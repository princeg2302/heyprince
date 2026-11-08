import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getCompanyProposalById, updateProposalStatus } from '@/lib/company/db';
import { executeApprovedProposal } from '@/lib/company/orchestrator';

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
  const proposal = await getCompanyProposalById(id);
  if (!proposal) {
    return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, proposal });
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
    const body = await request.json();
    const { action, ceoFeedback, autoExecute } = body;

    if (!['approved', 'rejected', 'changes_requested'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approved', 'rejected', or 'changes_requested'." },
        { status: 400 }
      );
    }

    const updated = await updateProposalStatus(id, action, ceoFeedback);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    }

    let executionResult = null;
    if (action === 'approved' && autoExecute) {
      executionResult = await executeApprovedProposal(id);
    }

    return NextResponse.json({
      success: true,
      proposal: updated,
      execution: executionResult,
    });
  } catch (error: any) {
    console.error('[API /api/admin/company/proposals/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update proposal.' },
      { status: 500 }
    );
  }
}
