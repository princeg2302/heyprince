import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface OutboundEmailPayload {
  messageId: string;
  recipientEmail: string;
  recipientName?: string | null;
  senderEmail: string;
  senderName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  unsubscribeUrl: string;
}

export interface OutboundSendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  error?: string;
}

export interface EmailSenderAdapter {
  name: string;
  isConfigured(): boolean;
  send(payload: OutboundEmailPayload): Promise<OutboundSendResult>;
}

/**
 * Mock sender used when Test Mode is active or credentials are unconfigured
 */
export class MockSenderAdapter implements EmailSenderAdapter {
  name = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async send(payload: OutboundEmailPayload): Promise<OutboundSendResult> {
    console.info(
      `[MockSenderAdapter] Test Mode: Simulated email dispatch to ${payload.recipientEmail} (Subject: "${payload.subject}")`
    );
    return {
      success: true,
      provider: 'mock',
      providerMessageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
  }
}

/**
 * Real Hostinger SMTP Sender Adapter with RFC 8058 One-Click Unsubscribe headers
 */
export class SmtpSenderAdapter implements EmailSenderAdapter {
  name = 'hostinger_smtp';

  isConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  async send(payload: OutboundEmailPayload): Promise<OutboundSendResult> {
    const host = process.env.SMTP_HOST?.trim().replace(/^["']|["']$/g, '');
    const user = process.env.SMTP_USER?.trim().replace(/^["']|["']$/g, '');
    const pass = process.env.SMTP_PASS?.trim().replace(/^["']|["']$/g, '');
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!host || !user || !pass) {
      return { success: false, provider: this.name, error: 'SMTP credentials missing' };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    try {
      const info = await transporter.sendMail({
        from: `"${payload.senderName}" <${payload.senderEmail || user}>`,
        to: payload.recipientEmail,
        subject: payload.subject,
        text: payload.bodyText,
        html: payload.bodyHtml,
        headers: {
          'List-Unsubscribe': `<${payload.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-HeyPrince-Message-ID': payload.messageId,
        },
      });

      return {
        success: true,
        provider: this.name,
        providerMessageId: info.messageId,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err.message || 'SMTP transmission failure',
      };
    }
  }
}

/**
 * Resend API Sender Adapter with RFC 8058 One-Click Unsubscribe headers
 */
export class ResendSenderAdapter implements EmailSenderAdapter {
  name = 'resend';

  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  async send(payload: OutboundEmailPayload): Promise<OutboundSendResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, '');
    if (!apiKey) {
      return { success: false, provider: this.name, error: 'RESEND_API_KEY is not configured' };
    }

    const resend = new Resend(apiKey);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Prince • HeyPrince <onboarding@resend.dev>';

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [payload.recipientEmail],
        subject: payload.subject,
        text: payload.bodyText,
        html: payload.bodyHtml,
        headers: {
          'List-Unsubscribe': `<${payload.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      if (error) {
        return { success: false, provider: this.name, error: error.message };
      }

      return {
        success: true,
        provider: this.name,
        providerMessageId: data?.id,
      };
    } catch (err: any) {
      return { success: false, provider: this.name, error: err.message || 'Resend API failure' };
    }
  }
}
