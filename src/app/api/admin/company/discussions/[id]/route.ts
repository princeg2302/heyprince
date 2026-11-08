import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getDiscussionById, getDiscussionMessages } from '@/lib/company/db';

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

  try {
    const discussion = await getDiscussionById(id);
    if (!discussion) {
      return NextResponse.json({ success: false, error: 'Discussion not found' }, { status: 404 });
    }

    const messages = await getDiscussionMessages(id);
    return NextResponse.json({
      success: true,
      discussion,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch discussion.' },
      { status: 500 }
    );
  }
}
