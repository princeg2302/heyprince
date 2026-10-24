import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { query, createQueuedEmail, getBusinessById, updateBusinessStatus } from '@/lib/outreach/db';
import { queueWorker } from '@/lib/outreach/queue/queue-worker';
import { generateUnsubscribeToken } from '@/lib/outreach/compliance/tokens';
import { complianceEngine } from '@/lib/outreach/compliance/compliance-engine';
import { buildOutreachEmailHtml } from '@/lib/outreach/email-template';
import {
  SmtpSenderAdapter,
  ResendSenderAdapter,
  MockSenderAdapter,
} from '@/lib/outreach/queue/sender-adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const status = request.nextUrl.searchParams.get('status');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    let sql = `SELECT m.*, b.name as business_name, b.domain as business_domain, b.phone as business_phone, b.country_code as business_country, b.city as business_city, b.metadata as business_metadata 
               FROM email_messages m 
               LEFT JOIN businesses b ON m.business_id = b.id`;
    const params: any[] = [];
    if (status) {
      sql += ` WHERE m.status = $1`;
      params.push(status);
    }
    sql += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const messages = await query(sql, params);

    const counts = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM email_messages GROUP BY status;`
    );

    return NextResponse.json({ success: true, messages, statusCounts: counts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const action = body.action || 'process_batch';

    if (action === 'process_batch') {
      const outcome = await queueWorker.processBatch(body.batchSize || 5, { forceNow: Boolean(body.forceNow) });
      const summaryParts = [`Processed ${outcome.processed} queue items (${outcome.sent} sent, ${outcome.failed} failed, ${outcome.cancelled} cancelled)`];
      if (outcome.throttled > 0) {
        summaryParts.push(`${outcome.throttled} throttled by domain hourly cap`);
      }
      return NextResponse.json({
        success: true,
        message: outcome.killSwitchActive
          ? 'Emergency Kill Switch is ACTIVE. Outbound emails paused.'
          : summaryParts.join('; '),
        outcome,
      });
    }

    if (action === 'send_single') {
      if (!body.messageId) {
        return NextResponse.json({ success: false, error: 'messageId is required' }, { status: 400 });
      }
      const outcome = await queueWorker.dispatchMessageById(body.messageId, { forceNow: body.forceNow !== false });
      return NextResponse.json({
        success: outcome.status === 'SENT',
        message: outcome.status === 'SENT' ? 'Email dispatched successfully!' : `Outcome: ${outcome.status} ${outcome.error || ''}`,
        outcome,
      });
    }

    if (action === 'cancel_message') {
      if (!body.messageId) {
        return NextResponse.json({ success: false, error: 'messageId is required' }, { status: 400 });
      }
      await queueWorker.cancelMessage(body.messageId);
      return NextResponse.json({
        success: true,
        message: 'Email cancelled.',
      });
    }

    if (action === 'send_followup') {
      const { parentMessageId, recipientEmail, subject, bodyText } = body;
      if (!recipientEmail || !subject || !bodyText) {
        return NextResponse.json(
          { success: false, error: 'recipientEmail, subject, and bodyText are required' },
          { status: 400 }
        );
      }

      let parentMsg: any = null;
      if (parentMessageId) {
        const rows = await query(`SELECT * FROM email_messages WHERE id = $1 LIMIT 1;`, [parentMessageId]);
        parentMsg = rows[0] || null;
      }

      const smtpAdapter = new SmtpSenderAdapter();
      const resendAdapter = new ResendSenderAdapter();
      const mockAdapter = new MockSenderAdapter();
      let activeSender = mockAdapter;
      if (smtpAdapter.isConfigured()) activeSender = smtpAdapter;
      else if (resendAdapter.isConfigured()) activeSender = resendAdapter;

      const sendRes = await activeSender.send({
        messageId: `followup_${Date.now()}`,
        recipientEmail,
        recipientName: parentMsg?.recipient_name || 'Business Team',
        senderEmail: process.env.SMTP_USER || 'prince@heyprince.in',
        senderName: 'Prince • HeyPrince.in',
        subject,
        bodyText,
        bodyHtml: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${bodyText}</div>`,
        unsubscribeUrl: 'https://heyprince.in/api/outreach/unsubscribe',
      });

      if (!sendRes.success) {
        return NextResponse.json(
          { success: false, error: sendRes.error || 'Failed to dispatch follow-up' },
          { status: 502 }
        );
      }

      const token = generateUnsubscribeToken(recipientEmail, parentMsg?.business_id || 'lead');
      await query(
        `INSERT INTO email_messages (
          business_id, recipient_email, recipient_name, sender_email, sender_name,
          subject, body_text, body_html, unsubscribe_token, status, provider, provider_message_id, sent_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SENT', $10, $11, NOW(), NOW(), NOW());`,
        [
          parentMsg?.business_id || null,
          recipientEmail,
          parentMsg?.recipient_name || 'Business Team',
          process.env.SMTP_USER || 'prince@heyprince.in',
          'Prince • HeyPrince.in',
          subject,
          bodyText,
          `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${bodyText}</div>`,
          token,
          sendRes.provider,
          sendRes.providerMessageId || `msg_${Date.now()}`,
        ]
      );

      if (parentMsg?.business_id) {
        await updateBusinessStatus(parentMsg.business_id, 'CONTACTED');
      }

      return NextResponse.json({
        success: true,
        message: `Follow-up email dispatched successfully to ${recipientEmail}!`,
      });
    }

    if (action === 'enqueue_draft') {
      const { businessId, contactId, aiAnalysisId, subject, bodyHtml, bodyText } = body;
      if (!businessId || !contactId || !subject || !bodyText) {
        return NextResponse.json(
          { success: false, error: 'Missing required draft fields (businessId, contactId, subject, bodyText)' },
          { status: 400 }
        );
      }

      const business = await getBusinessById(businessId);
      const contactRows = await query(`SELECT * FROM contacts WHERE id = $1 LIMIT 1;`, [contactId]);
      if (!business || contactRows.length === 0) {
        return NextResponse.json({ success: false, error: 'Business or contact not found' }, { status: 404 });
      }
      const contact = contactRows[0];

      // Compliance evaluation before enqueuing
      const compliance = await complianceEngine.evaluateAndRecord(contact, business);
      if (compliance.decision === 'INELIGIBLE') {
        return NextResponse.json(
          {
            success: false,
            error: `Compliance gate blocked enqueueing: ${compliance.reason}`,
            compliance,
          },
          { status: 400 }
        );
      }

      const unsubscribeToken = generateUnsubscribeToken(contact.email, business.id);

      const message = await createQueuedEmail({
        campaign_id: body.campaignId || null,
        business_id: business.id,
        contact_id: contact.id,
        ai_analysis_id: aiAnalysisId || null,
        recipient_email: contact.email,
        recipient_name: contact.name,
        sender_email: 'contact@heyprince.in',
        sender_name: 'Prince • HeyPrince',
        subject,
        body_html:
          bodyHtml ||
          buildOutreachEmailHtml({
            subject,
            bodyText,
            recipientName: contact.name,
            businessName: business.name,
          }),
        body_text: bodyText,
        unsubscribe_token: unsubscribeToken,
        status: 'QUEUED',
        provider: null,
        provider_message_id: null,
        error_message: null,
        attempts: 0,
        max_attempts: 3,
        scheduled_for: new Date().toISOString(),
        sent_at: null,
        delivered_at: null,
        bounced_at: null,
        unsubscribed_at: null,
      });

      return NextResponse.json({
        success: true,
        message: 'Email approved and added to outbound queue.',
        emailMessage: message,
        complianceDecision: compliance.decision,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown queue action '${action}'` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

