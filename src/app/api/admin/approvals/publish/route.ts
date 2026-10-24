import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { approveAndPublishDraft } from '@/lib/chief-of-staff/agents/content-researcher';
import { updateDraftStatus, logChiefActivity, deleteDraftsBulk } from '@/lib/chief-of-staff/db';
import { publishDraftRun } from '@/lib/daily-news/orchestrator';
import { updateDailyRun, deleteDailyRunsBulk } from '@/lib/daily-news/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, sourceType, action, publishToLinkedIn, rejectionReason, items } = body;

    // Handle Bulk Action if items array is provided
    if (Array.isArray(items) && items.length > 0) {
      if (action === 'delete') {
        const chiefIds = items
          .filter((i) => i.sourceType === 'chief' || String(i.id).startsWith('draft_'))
          .map((i) => String(i.id));
        const newsIds = items
          .filter((i) => i.sourceType === 'news' && !isNaN(Number(i.id)))
          .map((i) => Number(i.id));

        if (chiefIds.length > 0) await deleteDraftsBulk(chiefIds);
        if (newsIds.length > 0) await deleteDailyRunsBulk(newsIds);

        return NextResponse.json({ success: true, count: items.length });
      }

      if (action === 'reject') {
        for (const it of items) {
          const isNews = it.sourceType === 'news' || !String(it.id).startsWith('draft_');
          if (isNews) {
            await updateDailyRun(Number(it.id), {
              status: 'failed',
              errorDetails: {
                stage: 'bulk_rejection',
                message: rejectionReason || 'Bulk rejected by Admin',
                timestamp: new Date().toISOString(),
              },
            });
          } else {
            await updateDraftStatus(String(it.id), 'rejected', rejectionReason || 'Bulk rejected by Admin');
          }
        }
        return NextResponse.json({ success: true, count: items.length });
      }
    }

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'id and action ("publish", "reject", "delete") are required.' },
        { status: 400 }
      );
    }

    const isNews =
      sourceType === 'news' ||
      (typeof id === 'number' && !isNaN(id)) ||
      (!String(id).startsWith('draft_') && !isNaN(Number(id)));

    if (action === 'delete') {
      if (isNews) {
        await deleteDailyRunsBulk([Number(id)]);
      } else {
        await deleteDraftsBulk([String(id)]);
      }
      return NextResponse.json({ success: true, message: 'Item deleted.' });
    }

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
