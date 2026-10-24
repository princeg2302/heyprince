import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { generateLeadProposal } from '@/lib/outreach/proposal-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { businessId, preferredProvider } = await request.json();
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 });
    }

    const result = await generateLeadProposal(businessId, preferredProvider);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate proposal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'AI opportunity pitch generated & submitted to AI Approvals Hub!',
      draftId: result.draftId,
      draft: result.draft,
      analysis: result.analysis,
      bestChannel: result.bestChannel,
    });
  } catch (err: any) {
    console.error('[outreach/ai-analyze] Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
