import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { refineDraftWithAI } from '@/lib/chief-of-staff/draft-refiner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { draftId, sourceType, instructions } = body;

    if (!draftId) {
      return NextResponse.json({ success: false, error: 'draftId is required' }, { status: 400 });
    }
    if (!instructions || !instructions.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customization instructions are required.' },
        { status: 400 }
      );
    }

    const result = await refineDraftWithAI({
      draftId,
      sourceType,
      instructions,
      userEmail: admin.email,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft refined successfully.',
      summaryOfChanges: result.summaryOfChanges,
      draft: result.draft,
    });
  } catch (error: any) {
    console.error('[API /api/admin/approvals/refine] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to refine draft.' },
      { status: 500 }
    );
  }
}

