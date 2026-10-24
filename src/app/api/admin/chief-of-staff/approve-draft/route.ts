import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { approveAndPublishDraft } from '@/lib/chief-of-staff/agents/content-researcher';
import { updateDraftStatus, logChiefActivity, deleteDraftsBulk } from '@/lib/chief-of-staff/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function DELETE(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let ids: string[] = [];
    const url = new URL(request.url);
    const queryId = url.searchParams.get('id');

    if (queryId) {
      ids = [queryId];
    } else {
      try {
        const body = await request.json();
        if (Array.isArray(body?.ids)) {
          ids = body.ids.map(String);
        } else if (body?.id) {
          ids = [String(body.id)];
        }
      } catch {}
    }

    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No draft IDs provided.' }, { status: 400 });
    }

    const count = await deleteDraftsBulk(ids);
    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete drafts.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { draftId, draftIds, action, publishToLinkedIn, rejectionReason } = body;

    if (action === 'delete') {
      const idsToDelete = Array.isArray(draftIds) ? draftIds : draftId ? [draftId] : [];
      if (idsToDelete.length > 0) {
        const count = await deleteDraftsBulk(idsToDelete);
        return NextResponse.json({ success: true, count });
      }
      return NextResponse.json({ success: false, error: 'No draft IDs provided.' }, { status: 400 });
    }

    if (!draftId || !action) {
      return NextResponse.json(
        { success: false, error: 'draftId and action ("approve", "publish", "reject", "delete") are required' },
        { status: 400 }
      );
    }

    if (action === 'publish' || action === 'approve') {
      const publishResult = await approveAndPublishDraft(draftId, { publishToLinkedIn: Boolean(publishToLinkedIn) });
      if (!publishResult.success) {
        return NextResponse.json({ success: false, error: publishResult.error }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: 'Draft approved and published successfully.',
        data: publishResult,
      });
    }

    if (action === 'reject') {
      await updateDraftStatus(draftId, 'rejected', rejectionReason || 'Rejected by Admin');
      await logChiefActivity(
        null,
        'warning',
        `Admin rejected draft #${draftId}`,
        { rejectedBy: admin.email, reason: rejectionReason }
      );
      return NextResponse.json({ success: true, message: 'Draft rejected.' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API /api/admin/chief-of-staff/approve-draft] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process draft action.' },
      { status: 500 }
    );
  }
}

