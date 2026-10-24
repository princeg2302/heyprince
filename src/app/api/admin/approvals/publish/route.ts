import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { approveAndPublishDraft } from '@/lib/chief-of-staff/agents/content-researcher';
import {
  updateDraftStatus,
  logChiefActivity,
  deleteDraftsBulk,
  getDrafts,
  getDraftById,
} from '@/lib/chief-of-staff/db';
import { publishDraftRun } from '@/lib/daily-news/orchestrator';
import { updateDailyRun, deleteDailyRunsBulk } from '@/lib/daily-news/db';
import {
  checkAndAcquireSendLock,
  recordSendSuccess,
  recordSendFailure,
  generateOutreachIdempotencyKey,
} from '@/lib/deduplication';
import { query, updateBusinessStatus, getContactsForBusiness } from '@/lib/outreach/db';
import {
  SmtpSenderAdapter,
  ResendSenderAdapter,
  MockSenderAdapter,
} from '@/lib/outreach/queue/sender-adapter';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      sourceType,
      action,
      publishToLinkedIn,
      rejectionReason,
      items,
      customSubject,
      customBody,
      recipientEmail,
    } = body;

    // ========================================================================
    // 1. Bulk Action Handler
    // ========================================================================
    if (Array.isArray(items) && items.length > 0) {
      if (action === 'delete') {
        const chiefIds = items
          .filter((i) => i.sourceType === 'chief' || i.sourceType === 'outreach' || String(i.id).startsWith('draft_'))
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
        { success: false, error: 'id and action ("publish", "approve_and_send_outreach", "edit_draft", "save_for_later", "reject", "delete") are required.' },
        { status: 400 }
      );
    }

    const isNews =
      sourceType === 'news' ||
      (typeof id === 'number' && !isNaN(id)) ||
      (!String(id).startsWith('draft_') && !isNaN(Number(id)));

    // ========================================================================
    // 2. Delete Action
    // ========================================================================
    if (action === 'delete') {
      if (isNews) {
        const runId = typeof id === 'number' ? id : parseInt(String(id), 10);
        await deleteDailyRunsBulk([runId]);
      } else {
        await deleteDraftsBulk([String(id)]);
      }
      return NextResponse.json({ success: true, message: 'Draft deleted.' });
    }

    // ========================================================================
    // 3. Edit Draft Action
    // ========================================================================
    if (action === 'edit_draft') {
      const { title, excerpt, content } = body;
      if (!isNews) {
        await query(
          `UPDATE chief_content_drafts 
           SET title = COALESCE($1, title),
               excerpt = COALESCE($2, excerpt),
               content = COALESCE($3, content),
               metadata = CASE 
                 WHEN $4::text IS NOT NULL THEN jsonb_set(COALESCE(metadata, '{}'::jsonb), '{personalizedEmailSubject}', to_jsonb($4::text))
                 ELSE metadata
               END,
               updated_at = NOW()
           WHERE id = $5;`,
          [title, excerpt, content, customSubject || title, String(id)]
        );
        return NextResponse.json({ success: true, message: 'Draft updated successfully.' });
      } else {
        const runId = typeof id === 'number' ? id : parseInt(String(id), 10);
        await updateDailyRun(runId, {
          articleTitle: title || undefined,
          articleExcerpt: excerpt || undefined,
        });
        return NextResponse.json({ success: true, message: 'Daily run updated successfully.' });
      }
    }

    // ========================================================================
    // 4. Save For Later Action
    // ========================================================================
    if (action === 'save_for_later') {
      if (!isNews) {
        await query(
          `UPDATE chief_content_drafts SET status = 'saved_for_later', updated_at = NOW() WHERE id = $1;`,
          [String(id)]
        );
      } else {
        const runId = typeof id === 'number' ? id : parseInt(String(id), 10);
        await updateDailyRun(runId, { status: 'saved_for_later' as any });
      }
      return NextResponse.json({
        success: true,
        message: 'Draft saved for later. It will not be published automatically.',
      });
    }

    // ========================================================================
    // 5. Approve & Send Outreach Proposal (With Strict Idempotency Lock)
    // ========================================================================
    if (action === 'approve_and_send_outreach') {
      let draft = await getDraftById(String(id));
      if (!draft) {
        const drafts = await getDrafts(undefined, 100);
        draft = drafts.find((d) => d.id === String(id)) || null;
      }

      if (!draft) {
        return NextResponse.json({ success: false, error: 'Outreach draft not found.' }, { status: 404 });
      }

      const meta = draft.metadata || {};
      let targetEmail = recipientEmail || meta.contactEmail || meta.email;

      // Fallback: Check business contacts table if email not directly in metadata
      if ((!targetEmail || !targetEmail.includes('@')) && meta.businessId) {
        try {
          const bizContacts = await getContactsForBusiness(meta.businessId);
          if (bizContacts.length > 0 && bizContacts[0].email) {
            targetEmail = bizContacts[0].email;
          }
        } catch {}
      }

      if (!targetEmail || !targetEmail.includes('@')) {
        return NextResponse.json(
          {
            success: false,
            error: 'No valid recipient email address found for this prospect. Please edit before approval or add a contact email.',
          },
          { status: 400 }
        );
      }

      const idempotencyKey =
        draft.idempotency_key ||
        meta.idempotency_key ||
        generateOutreachIdempotencyKey(meta.businessId || draft.id, draft.id, targetEmail);

      // Acquire atomic DB lock to prevent duplicate dispatch
      const lock = await checkAndAcquireSendLock(draft.id, idempotencyKey);
      if (!lock.acquired) {
        return NextResponse.json(
          { success: false, error: lock.reason || 'Send operation locked or already completed.' },
          { status: 409 }
        );
      }

      const emailSubject = customSubject || meta.personalizedEmailSubject || draft.title;
      const emailBody = customBody || meta.personalizedEmailBody || draft.content;

      // Select sender adapter with RFC 8058 compliance
      const smtpAdapter = new SmtpSenderAdapter();
      const resendAdapter = new ResendSenderAdapter();
      const mockAdapter = new MockSenderAdapter();

      let activeSender = mockAdapter;
      if (smtpAdapter.isConfigured()) {
        activeSender = smtpAdapter;
      } else if (resendAdapter.isConfigured()) {
        activeSender = resendAdapter;
      }

      try {
        const sendResult = await activeSender.send({
          messageId: `msg_${draft.id}_${Date.now()}`,
          recipientEmail: targetEmail,
          recipientName: meta.contactName || meta.companyName,
          senderEmail: process.env.SMTP_USER || 'prince@heyprince.in',
          senderName: 'Prince • HeyPrince.in',
          subject: emailSubject,
          bodyText: emailBody,
          bodyHtml: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${emailBody}</div>`,
          unsubscribeUrl: 'https://heyprince.in/api/outreach/unsubscribe',
        });

        if (!sendResult.success) {
          await recordSendFailure(draft.id, sendResult.error || 'Provider rejected email send');
          return NextResponse.json(
            { success: false, error: `Email delivery failed: ${sendResult.error}` },
            { status: 502 }
          );
        }

        // Record successful dispatch & update draft state
        await recordSendSuccess(draft.id, {
          approverEmail: admin.email,
          providerMessageId: sendResult.providerMessageId,
          sentAt: new Date().toISOString(),
        });

        // Update business status & persist message into email_messages
        if (meta.businessId) {
          await updateBusinessStatus(meta.businessId, 'CONTACTED');
          try {
            await query(
              `INSERT INTO email_messages (
                business_id, recipient_email, recipient_name, sender_email, sender_name,
                subject, body_text, body_html, status, sent_at, provider, provider_message_id, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SENT', NOW(), $9, $10, NOW(), NOW());`,
              [
                meta.businessId,
                targetEmail,
                meta.contactName || meta.companyName || 'Business Owner',
                process.env.SMTP_USER || 'prince@heyprince.in',
                'Prince • HeyPrince.in',
                emailSubject,
                emailBody,
                `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${emailBody}</div>`,
                sendResult.provider,
                sendResult.providerMessageId || `msg_${Date.now()}`,
              ]
            );
          } catch (insertErr) {
            console.warn('[approve_and_send_outreach] Note inserting into email_messages:', insertErr);
          }
        }

        await logChiefActivity(
          'lead_scout',
          'success',
          `Dispatched approved outreach pitch to ${targetEmail} (${meta.companyName || 'Lead'})`,
          { draftId: draft.id, provider: sendResult.provider, messageId: sendResult.providerMessageId }
        );

        return NextResponse.json({
          success: true,
          message: `Outreach email successfully sent to ${targetEmail} via ${sendResult.provider}!`,
          provider: sendResult.provider,
          messageId: sendResult.providerMessageId,
        });
      } catch (err: any) {
        await recordSendFailure(draft.id, err?.message || 'Send exception');
        return NextResponse.json(
          { success: false, error: err?.message || 'Outbound email delivery exception.' },
          { status: 500 }
        );
      }
    }

    // ========================================================================
    // 6. Public Article & News Publish Action
    // ========================================================================
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
          message: 'Draft approved and published successfully.',
          publishedUrl: publishResult.publishedUrl,
          linkedInUrl: publishResult.linkedInUrl,
        });
      }
    }

    // ========================================================================
    // 7. Reject Action
    // ========================================================================
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
