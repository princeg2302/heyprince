import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export interface SendLeadEmailParams {
  leadId?: string | number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  budget?: string;
  timeline?: string;
  message: string;
  createdAt?: string;
}

export function isEmailConfigured(): boolean {
  const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  return hasResend || hasSmtp;
}

function buildEmailHtml(params: SendLeadEmailParams, dateFormatted: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0f; color: #f5f5f7; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #141419; border: 1px solid #23232c; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #e53e3e 0%, #9b2c2c 100%); padding: 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; }
          .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
          .content { padding: 24px; }
          .field-row { margin-bottom: 16px; border-bottom: 1px solid #23232c; padding-bottom: 12px; }
          .field-row:last-child { border-bottom: none; }
          .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #a0a0b0; margin-bottom: 4px; }
          .value { font-size: 16px; color: #ffffff; font-weight: 500; }
          .message-box { background-color: #0b0b0f; border: 1px solid #23232c; border-radius: 8px; padding: 16px; margin-top: 8px; white-space: pre-wrap; font-size: 15px; line-height: 1.5; color: #e2e8f0; }
          .footer { padding: 16px 24px; background-color: #0f0f14; border-top: 1px solid #23232c; text-align: center; font-size: 12px; color: #718096; }
          .badge { display: inline-block; padding: 4px 10px; background: rgba(229, 62, 62, 0.15); border: 1px solid rgba(229, 62, 62, 0.4); color: #ff6b6b; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ New Client Project Inquiry</h1>
            <p>Received via heyprince.in on ${dateFormatted}</p>
          </div>
          <div class="content">
            <div class="field-row">
              <div class="label">Client Name</div>
              <div class="value">${params.name}</div>
            </div>
            <div class="field-row">
              <div class="label">Email Address</div>
              <div class="value"><a href="mailto:${params.email}" style="color: #ff6b6b; text-decoration: none;">${params.email}</a></div>
            </div>
            ${
              params.phone
                ? `
            <div class="field-row">
              <div class="label">Phone / WhatsApp</div>
              <div class="value"><a href="tel:${params.phone}" style="color: #ffffff; text-decoration: none;">${params.phone}</a></div>
            </div>
            `
                : ''
            }
            ${
              params.company
                ? `
            <div class="field-row">
              <div class="label">Company / Brand</div>
              <div class="value">${params.company}</div>
            </div>
            `
                : ''
            }
            <div class="field-row">
              <div class="label">Interested Service</div>
              <div class="value"><span class="badge">${params.service}</span></div>
            </div>
            <div class="field-row">
              <div class="label">Estimated Budget</div>
              <div class="value">${params.budget || 'Flexible'}</div>
            </div>
            <div class="field-row">
              <div class="label">Target Timeline</div>
              <div class="value">${params.timeline || 'Flexible'}</div>
            </div>
            <div class="field-row">
              <div class="label">Project Scope & Details</div>
              <div class="message-box">${params.message}</div>
            </div>
          </div>
          <div class="footer">
            <p>HeyPrince Platform CRM — Inquiries recorded securely in PostgreSQL.</p>
            ${params.leadId ? `<p>Lead Record ID: #${params.leadId}</p>` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendLeadNotificationEmail(params: SendLeadEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const recipient = process.env.LEAD_NOTIFICATION_EMAIL || 'it@heyprince.in';
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'HeyPrince Inquiries <onboarding@resend.dev>';
  const subject = `New Lead: [${params.service}] from ${params.name}`;

  const dateFormatted = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const emailHtml = buildEmailHtml(params, dateFormatted);

  // 1. Try Resend if RESEND_API_KEY is configured
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        replyTo: params.email,
        subject,
        html: emailHtml,
      });

      if (error) {
        console.error('[Email:Resend] API returned error:', error);
        return { success: false, error: error.message };
      }

      console.info(`[Email:Resend] Lead email successfully sent (ID: ${data?.id})`);
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      console.error('[Email:Resend] Dispatch failed:', err);
      // Fall through to SMTP if configured
    }
  }

  // 2. Try SMTP if SMTP credentials are configured
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `HeyPrince <${smtpUser}>`,
        to: recipient,
        replyTo: params.email,
        subject,
        html: emailHtml,
      });

      console.info(`[Email:SMTP] Lead email successfully sent (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr: any) {
      console.error('[Email:SMTP] Dispatch failed:', smtpErr);
      return { success: false, error: smtpErr?.message || 'SMTP dispatch error' };
    }
  }

  // 3. Neither email provider is configured
  console.warn(
    '[Email] Neither RESEND_API_KEY nor SMTP credentials configured in environment. Inquiries are stored in Supabase CRM.'
  );
  return {
    success: false,
    error: 'No email service credentials configured in environment (RESEND_API_KEY or SMTP)',
  };
}
