import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { query, createQueuedEmail, getBusinessById } from '@/lib/outreach/db';
import { queueWorker } from '@/lib/outreach/queue/queue-worker';
import { generateUnsubscribeToken } from '@/lib/outreach/compliance/tokens';
import { complianceEngine } from '@/lib/outreach/compliance/compliance-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const status = request.nextUrl.searchParams.get('status');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    let sql = `SELECT * FROM email_messages`;
    const params: any[] = [];
    if (status) {
      sql += ` WHERE status = $1`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1};`;
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
      const outcome = await queueWorker.processBatch(body.batchSize || 5);
      return NextResponse.json({
        success: true,
        message: outcome.killSwitchActive
          ? 'Emergency Kill Switch is ACTIVE. Outbound emails paused.'
          : `Processed ${outcome.processed} queue items (${outcome.sent} sent, ${outcome.failed} failed, ${outcome.cancelled} cancelled).`,
        outcome,
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
        sender_email: 'it@heyprince.in',
        sender_name: 'Prince • HeyPrince',
        subject,
        body_html: bodyHtml || `<pre style="font-family: sans-serif; white-space: pre-wrap;">${bodyText}</pre>`,
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
