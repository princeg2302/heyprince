import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { sendCeoDirective } from '@/lib/company/orchestrator';
import { clearDiscussionMessages } from '@/lib/company/db';

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
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty.' }, { status: 400 });
    }

    const result = await sendCeoDirective({
      discussionId: id,
      directive: message,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /api/admin/company/discussions/[id]/message] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send message.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const success = await clearDiscussionMessages(id);
    return NextResponse.json({ success, message: 'Floor timeline cleared.' });
  } catch (error: any) {
    console.error('[API DELETE /api/admin/company/discussions/[id]/message] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to clear timeline.' },
      { status: 500 }
    );
  }
}
