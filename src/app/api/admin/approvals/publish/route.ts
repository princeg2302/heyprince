import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { approveAndPublishDraft } from '@/lib/chief-of-staff/agents/content-researcher';
import { updateDraftStatus, logChiefActivity } from '@/lib/chief-of-staff/db';
import { publishDraftRun } from '@/lib/daily-news/orchestrator';
import { updateDailyRun } from '@/lib/daily-news/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, sourceType, action, publishToLinkedIn, rejectionReason } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'id and action ("publish", "reject") are required.' },
        { status: 400 }
      );
    }

    const isNews =
      sourceType === 'news' ||
      (typeof id === 'number' && !isNaN(id)) ||
      (!String(id).startsWith('draft_') && !isNaN(Number(id)));

    if (action === 'publish' || action === 'approve') {
      if (isNews) {
        const runId = typeof id === 'number' ? id : parseInt(String(id), 10);
        const newsResult = await publishDraftRun(runId);
        if (!newsResult.success) {
          return NextResponse.json({ success: false, error: newsResult.error }, { status: 500 });
        }
        return NextResponse.json({
          success: true,
          message: 'Scheduled blog published to live site successfully.',
          publishedUrl: newsResult.postUrl,
          linkedInUrl: newsResult.linkedinShareUrl,
        });
      } else {
        const publishResult = await approveAndPublishDraft(String(id), {
          publishToLinkedIn: Boolean(publishToLinkedIn),
        });
        if (!publishResult.success) {
          return NextResponse.json({ success: false, error: publishResult.error }, { status: 500 });
        }
        return NextResponse.json({
          success: true,
          message: 'Draft approved and published to live site successfully.',
          publishedUrl: publishResult.publishedUrl,
          linkedInUrl: publishResult.linkedInUrl,
        });
      }
    }

    if (action === 'reject') {
      const reason = rejectionReason || 'Rejected by Admin';
      if (isNews) {
        const runId = typeof id === 'number' ? id : parseInt(String(id), 10);
        await updateDailyRun(runId, {
          status: 'failed',
          errorDetails: {
            stage: 'approval_rejection',
            message: `${reason} (Rejected by ${admin.email})`,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        await updateDraftStatus(String(id), 'rejected', reason);
        await logChiefActivity(
          null,
          'warning',
          `Admin rejected draft #${id}`,
          { rejectedBy: admin.email, reason }
        );
      }
      return NextResponse.json({ success: true, message: 'Draft rejected.' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API /api/admin/approvals/publish] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process approval action.' },
      { status: 500 }
    );
  }
}

