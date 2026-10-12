import {
  getOutreachSettings,
  getDueQueuedEmails,
  updateEmailStatus,
  query,
  isSuppressed,
} from '../db';
import { complianceEngine } from '../compliance/compliance-engine';
import {
  EmailSenderAdapter,
  MockSenderAdapter,
  SmtpSenderAdapter,
  ResendSenderAdapter,
  OutboundSendResult,
} from './sender-adapter';
import { EmailMessageEntity } from '../types';

export class QueueWorker {
  private senderAdapters: Map<string, EmailSenderAdapter> = new Map();
  private mockSender = new MockSenderAdapter();

  constructor() {
    this.senderAdapters.set('hostinger_smtp', new SmtpSenderAdapter());
    this.senderAdapters.set('resend', new ResendSenderAdapter());
    this.senderAdapters.set('mock', this.mockSender);
  }

  /**
   * Processes the next batch of queued emails with safety gates
   */
  async processBatch(batchSize = 5): Promise<{
    processed: number;
    sent: number;
    failed: number;
    cancelled: number;
    killSwitchActive: boolean;
  }> {
    const settings = await getOutreachSettings();

    // 1. Emergency Kill Switch Gate
    if (settings.global_kill_switch) {
      console.warn('[QueueWorker] 🛑 Global Kill Switch is ACTIVE. No outbound emails will be dispatched.');
      return { processed: 0, sent: 0, failed: 0, cancelled: 0, killSwitchActive: true };
    }

    const dueMessages = await getDueQueuedEmails(batchSize);
    if (dueMessages.length === 0) {
      return { processed: 0, sent: 0, failed: 0, cancelled: 0, killSwitchActive: false };
    }

    let sentCount = 0;
    let failedCount = 0;
    let cancelledCount = 0;

    for (const msg of dueMessages) {
      const outcome = await this.dispatchSingleMessage(msg, settings.test_mode, settings.domain_hourly_cap);
      if (outcome.status === 'SENT') sentCount++;
      else if (outcome.status === 'FAILED') failedCount++;
      else cancelledCount++;
    }

    return {
      processed: dueMessages.length,
      sent: sentCount,
      failed: failedCount,
      cancelled: cancelledCount,
      killSwitchActive: false,
    };
  }

  private async dispatchSingleMessage(
    msg: EmailMessageEntity,
    testMode: boolean,
    domainHourlyCap: number
  ): Promise<{ status: string; error?: string }> {
    // Atomically claim message
    await updateEmailStatus(msg.id, 'SENDING');

    const email = msg.recipient_email.toLowerCase().trim();
    const domain = email.split('@')[1];

    // 2. Pre-Send Suppression Gate
    const suppressed = await isSuppressed(email, domain);
    if (suppressed) {
      await updateEmailStatus(msg.id, 'SUPPRESSED', {
        error_message: 'Recipient address or domain is present on the global suppression list.',
      });
      return { status: 'SUPPRESSED' };
    }

    // 3. Domain Rate-Limit Throttling Gate
    const recentDomainSends = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM email_messages 
       WHERE recipient_email LIKE $1 
         AND status = 'SENT' 
         AND sent_at >= NOW() - INTERVAL '1 hour';`,
      [`%@${domain}`]
    );
    const domainSendsLastHour = parseInt(recentDomainSends[0]?.count || '0', 10);
    if (domainSendsLastHour >= domainHourlyCap) {
      // Re-queue with 30-minute delay
      await query(
        `UPDATE email_messages SET 
          status = 'QUEUED', 
          scheduled_for = NOW() + INTERVAL '30 minutes',
          updated_at = NOW() 
         WHERE id = $1;`,
        [msg.id]
      );
      return { status: 'THROTTLED' };
    }

    // 4. Pre-Send Compliance Eligibility Recheck
    const contactRows = await query<{ verification_status: string }>(
      `SELECT verification_status FROM contacts WHERE id = $1 LIMIT 1;`,
      [msg.contact_id]
    );
    const businessRows = await query<{ country_code: string; domain: string; name: string }>(
      `SELECT country_code, domain, name FROM businesses WHERE id = $1 LIMIT 1;`,
      [msg.business_id]
    );

    if (businessRows.length > 0 && contactRows.length > 0) {
      const compliance = await complianceEngine.evaluateEligibility(
        { email, verification_status: contactRows[0].verification_status },
        businessRows[0]
      );

      if (compliance.decision === 'INELIGIBLE' || compliance.decision === 'UNKNOWN') {
        await updateEmailStatus(msg.id, 'CANCELLED', {
          error_message: `Blocked by pre-send compliance gate (${compliance.decision}): ${compliance.reason}`,
        });
        return { status: 'CANCELLED' };
      }
    }

    // 5. Select Sender Provider
    let sender: EmailSenderAdapter = this.mockSender;
    if (!testMode) {
      const smtp = this.senderAdapters.get('hostinger_smtp');
      const resend = this.senderAdapters.get('resend');

      if (smtp && smtp.isConfigured()) {
        sender = smtp;
      } else if (resend && resend.isConfigured()) {
        sender = resend;
      }
    }

    // Build absolute unsubscribe URL
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://heyprince.in';
    const unsubscribeUrl = `${baseUrl}/api/outreach/unsubscribe?token=${encodeURIComponent(msg.unsubscribe_token)}`;

    // Replace unsubscribe placeholder in body
    const finalHtml = msg.body_html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);
    const finalText = msg.body_text.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);

    // 6. Execute Send
    const sendResult: OutboundSendResult = await sender.send({
      messageId: msg.id,
      recipientEmail: email,
      recipientName: msg.recipient_name,
      senderEmail: msg.sender_email,
      senderName: msg.sender_name,
      subject: msg.subject,
      bodyHtml: finalHtml,
      bodyText: finalText,
      unsubscribeUrl,
    });

    if (sendResult.success) {
      const now = new Date().toISOString();
      await updateEmailStatus(msg.id, 'SENT', {
        provider_message_id: sendResult.providerMessageId,
        sent_at: now,
      });

      // Record Email Event
      await query(
        `INSERT INTO email_events (email_message_id, event_type, provider, provider_event_id, raw_payload)
         VALUES ($1, 'SENT', $2, $3, $4::jsonb);`,
        [msg.id, sendResult.provider, sendResult.providerMessageId || null, JSON.stringify(sendResult)]
      );

      return { status: 'SENT' };
    } else {
      const nextAttempt = msg.attempts + 1;
      const willRetry = nextAttempt < msg.max_attempts;

      if (willRetry) {
        // Exponential backoff: 5m, 15m, 45m
        const backoffMinutes = Math.pow(3, nextAttempt) * 5;
        await query(
          `UPDATE email_messages SET 
            status = 'QUEUED', 
            attempts = $1, 
            error_message = $2,
            scheduled_for = NOW() + ($3 || ' minutes')::interval,
            updated_at = NOW() 
           WHERE id = $4;`,
          [nextAttempt, sendResult.error || 'Send failed', backoffMinutes, msg.id]
        );
      } else {
        await updateEmailStatus(msg.id, 'FAILED', {
          error_message: sendResult.error || 'Max send attempts exhausted',
        });
      }

      await query(
        `INSERT INTO email_events (email_message_id, event_type, provider, raw_payload)
         VALUES ($1, 'FAILED', $2, $3::jsonb);`,
        [msg.id, sendResult.provider, JSON.stringify(sendResult)]
      );

      return { status: 'FAILED', error: sendResult.error };
    }
  }
}

export const queueWorker = new QueueWorker();

