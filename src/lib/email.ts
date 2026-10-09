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

function cleanPhoneForWhatsApp(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits;
  return null;
}

/**
 * Builds the executive notification email template sent to it@heyprince.in
 */
export function buildAdminNotificationHtml(params: SendLeadEmailParams, dateFormatted: string): string {
  const waNumber = cleanPhoneForWhatsApp(params.phone);
  const waLink = waNumber ? `https://wa.me/${waNumber}` : null;
  const adminUrl = 'https://heyprince.in/admin/leads/';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project Inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07070b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #07070b; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #101018; border: 1px solid #1f1f2e; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Gradient Top Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #ff3366 0%, #a855f7 50%, #00f5a0 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1a1a27;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: rgba(255, 51, 102, 0.12); border: 1px solid rgba(255, 51, 102, 0.35); color: #ff3366; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 100px; margin-bottom: 10px;">
                      ⚡ New Project Inquiry
                    </span>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                      ${params.name} <span style="font-weight: 400; color: #8e8ea0; font-size: 16px;">${params.company ? `• ${params.company}` : ''}</span>
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #7a7a90;">
                      Received on ${dateFormatted} via <a href="https://heyprince.in" style="color: #ff3366; text-decoration: none;">heyprince.in</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Inquiry Metadata Grid -->
          <tr>
            <td style="padding: 24px 32px 12px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <!-- Email -->
                  <td width="50%" valign="top" style="padding-bottom: 16px; padding-right: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a90; margin-bottom: 4px; font-weight: 600;">Client Email</div>
                    <a href="mailto:${params.email}" style="font-size: 14px; font-weight: 600; color: #ff3366; text-decoration: none; word-break: break-all;">${params.email}</a>
                  </td>
                  <!-- Phone / WhatsApp -->
                  <td width="50%" valign="top" style="padding-bottom: 16px; padding-left: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a90; margin-bottom: 4px; font-weight: 600;">Phone / WhatsApp</div>
                    <div style="font-size: 14px; font-weight: 600; color: #ffffff;">${params.phone || 'Not provided'}</div>
                  </td>
                </tr>
                <tr>
                  <!-- Service -->
                  <td width="50%" valign="top" style="padding-bottom: 16px; padding-right: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a90; margin-bottom: 4px; font-weight: 600;">Selected Service</div>
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #ffffff; font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 6px;">
                      ${params.service}
                    </span>
                  </td>
                  <!-- Budget & Timeline -->
                  <td width="50%" valign="top" style="padding-bottom: 16px; padding-left: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a90; margin-bottom: 4px; font-weight: 600;">Budget & Timeline</div>
                    <div style="font-size: 13px; font-weight: 600; color: #00f5a0;">
                      ${params.budget || 'Custom Quote'} <span style="color: #7a7a90; font-weight: 400;">(${params.timeline || 'Flexible'})</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Project Message Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #0b0b12; border: 1px solid #1a1a27; border-radius: 12px; padding: 18px 20px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #ff3366; margin-bottom: 8px; font-weight: 700;">
                  Project Brief & Requirements
                </div>
                <div style="font-size: 14px; line-height: 1.6; color: #e4e4ed; white-space: pre-line; margin: 0;">
                  ${params.message}
                </div>
              </div>
            </td>
          </tr>

          <!-- Action Buttons Bar -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display: inline-table; margin: 0 auto;">
                      <tr>
                        <!-- Reply Button -->
                        <td align="center" style="border-radius: 8px; background: #ff3366; padding: 0;">
                          <a href="mailto:${params.email}?subject=${encodeURIComponent(`Regarding Your Inquiry with Prince: ${params.service}`)}" style="display: inline-block; padding: 12px 22px; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                            ✉️ Reply to ${params.name.split(' ')[0]}
                          </a>
                        </td>
                        ${
                          waLink
                            ? `
                        <td width="10"></td>
                        <!-- WhatsApp Button -->
                        <td align="center" style="border-radius: 8px; background: #25d366; padding: 0;">
                          <a href="${waLink}" target="_blank" style="display: inline-block; padding: 12px 20px; font-size: 13px; font-weight: 700; color: #000000; text-decoration: none; border-radius: 8px;">
                            💬 WhatsApp Chat
                          </a>
                        </td>
                        `
                            : ''
                        }
                        <td width="10"></td>
                        <!-- CRM Link -->
                        <td align="center" style="border-radius: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); padding: 0;">
                          <a href="${adminUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                            📊 View CRM
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0b12; padding: 18px 32px; border-top: 1px solid #1a1a27; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #626274;">
                Lead Record ${params.leadId ? `<strong>#${params.leadId}</strong>` : ''} • Recorded securely in Supabase PostgreSQL
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Builds the professional confirmation & 4-hour commitment revert email sent directly to the customer
 */
export function buildCustomerRevertHtml(params: SendLeadEmailParams): string {
  const firstName = params.name ? params.name.split(' ')[0] : 'there';
  const waDirectUrl =
    'https://wa.me/919120900010?text=' +
    encodeURIComponent(`Hi Prince, I just submitted an inquiry on heyprince.in regarding ${params.service}.`);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Received — HeyPrince</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07070b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #07070b; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #11111a; border: 1px solid #20202e; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.65);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #ff3366 0%, #8b5cf6 50%, #00f5a0 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1b1b28;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                      HEY<span style="color: #ff3366;">PRINCE</span>
                    </span>
                    <span style="display: block; font-size: 11px; color: #7a7a90; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">
                      Senior Full Stack Engineer &amp; Tech Partner
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(0, 245, 160, 0.1); border: 1px solid rgba(0, 245, 160, 0.3); color: #00f5a0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px;">
                      ● Inquiry Received
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome & 4-Hour Commitment -->
          <tr>
            <td style="padding: 28px 32px 20px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Hi ${firstName}, thank you for reaching out!
              </h2>
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #c8c8d8;">
                I’ve personally received your project inquiry regarding <strong style="color: #ffffff;">${params.service}</strong>.
              </p>

              <!-- Turnaround Guarantee Box -->
              <div style="background: linear-gradient(135deg, rgba(255, 51, 102, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1px solid rgba(255, 51, 102, 0.28); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="36" valign="top">
                      <div style="font-size: 24px; line-height: 1;">⏱️</div>
                    </td>
                    <td valign="top" style="padding-left: 10px;">
                      <strong style="color: #ffffff; font-size: 14px; display: block; margin-bottom: 4px;">
                        Expected Response Time: Within 2 to 4 Hours
                      </strong>
                      <span style="color: #a8a8be; font-size: 13px; line-height: 1.5; display: block;">
                        I am reviewing your scope and technical specifications right now. You will receive a direct reply with initial architectural thoughts, timeline feasibility, or proposal details shortly.
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Brief Recap of Submitted Inquiry -->
              <div style="background-color: #0b0b12; border: 1px solid #1a1a27; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #7a7a90; font-weight: 700; margin-bottom: 12px;">
                  📋 Summary of Your Submitted Scope
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px;">
                  <tr>
                    <td width="35%" style="font-size: 12px; color: #7a7a90; padding-bottom: 8px;">Requested Service:</td>
                    <td style="font-size: 13px; color: #ffffff; font-weight: 600; padding-bottom: 8px;">${params.service}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #7a7a90; padding-bottom: 8px;">Estimated Budget:</td>
                    <td style="font-size: 13px; color: #00f5a0; font-weight: 600; padding-bottom: 8px;">${params.budget || 'Custom Quote'}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #7a7a90; padding-bottom: 8px;">Target Timeline:</td>
                    <td style="font-size: 13px; color: #ffffff; font-weight: 600; padding-bottom: 8px;">${params.timeline || 'Flexible'}</td>
                  </tr>
                </table>

                <div style="border-top: 1px solid #1a1a27; padding-top: 12px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a90; font-weight: 700; display: block; margin-bottom: 6px;">Your Project Notes:</span>
                  <p style="font-size: 13px; line-height: 1.55; color: #d0d0e0; margin: 0; white-space: pre-line;">
                    "${params.message}"
                  </p>
                </div>
              </div>

              <!-- What to Expect Roadmap -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #ffffff; font-weight: 700; margin-bottom: 12px;">
                  What Happens Next?
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="28" valign="top" style="padding-bottom: 10px;">
                      <span style="display: inline-block; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(255, 51, 102, 0.15); color: #ff3366; font-size: 12px; font-weight: 700; text-align: center; line-height: 22px;">1</span>
                    </td>
                    <td style="padding-bottom: 10px; padding-left: 8px;">
                      <strong style="color: #ffffff; font-size: 13px;">Technical Scope Review:</strong>
                      <span style="color: #9292a4; font-size: 13px;"> Evaluating technical feasibility, stack architecture, and sprint timelines.</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="28" valign="top" style="padding-bottom: 10px;">
                      <span style="display: inline-block; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(255, 51, 102, 0.15); color: #ff3366; font-size: 12px; font-weight: 700; text-align: center; line-height: 22px;">2</span>
                    </td>
                    <td style="padding-bottom: 10px; padding-left: 8px;">
                      <strong style="color: #ffffff; font-size: 13px;">Direct Response:</strong>
                      <span style="color: #9292a4; font-size: 13px;"> I’ll reply directly to this email with tailored recommendations and milestone options.</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="28" valign="top">
                      <span style="display: inline-block; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(255, 51, 102, 0.15); color: #ff3366; font-size: 12px; font-weight: 700; text-align: center; line-height: 22px;">3</span>
                    </td>
                    <td style="padding-left: 8px;">
                      <strong style="color: #ffffff; font-size: 13px;">Discovery Call (Optional):</strong>
                      <span style="color: #9292a4; font-size: 13px;"> If helpful, we can hop on a quick 15-minute alignment call before starting development.</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Urgent Contact Option -->
              <div style="background-color: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.25); border-radius: 12px; padding: 16px 20px; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #d0d0e0;">
                  Have an urgent sprint requirement or tight deadline?
                </p>
                <a href="${waDirectUrl}" target="_blank" style="display: inline-block; background-color: #25d366; color: #000000; font-weight: 700; font-size: 13px; text-decoration: none; padding: 10px 22px; border-radius: 8px;">
                  💬 Chat Directly on WhatsApp (+91 9120900010)
                </a>
              </div>
            </td>
          </tr>

          <!-- Signature & Footer -->
          <tr>
            <td style="background-color: #0b0b12; padding: 24px 32px; border-top: 1px solid #1b1b28;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <strong style="color: #ffffff; font-size: 14px; display: block;">Prince</strong>
                    <span style="color: #7a7a90; font-size: 12px; display: block; margin-top: 2px;">
                      Senior Full Stack Engineer &amp; Tech Partner
                    </span>
                    <span style="color: #7a7a90; font-size: 12px; display: block; margin-top: 2px;">
                      <a href="https://heyprince.in" style="color: #ff3366; text-decoration: none;">heyprince.in</a> • <a href="mailto:it@heyprince.in" style="color: #7a7a90; text-decoration: none;">it@heyprince.in</a>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends the internal notification email to it@heyprince.in
 */
export async function sendLeadNotificationEmail(params: SendLeadEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const recipient = process.env.LEAD_NOTIFICATION_EMAIL || 'it@heyprince.in';
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'HeyPrince Inquiries <onboarding@resend.dev>';
  const subject = `⚡ New Project Inquiry: [${params.service}] from ${params.name}`;

  const dateFormatted = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const emailHtml = buildAdminNotificationHtml(params, dateFormatted);

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

      console.info(`[Email:Resend] Admin notification sent (ID: ${data?.id})`);
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      console.error('[Email:Resend] Admin notification failed:', err);
    }
  }

  // 2. Try SMTP if SMTP credentials are configured (Hostinger, Zoho, cPanel)
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const port = Number(process.env.SMTP_PORT) || 465;
      const isSecure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: port,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });

      const senderFrom = process.env.SMTP_FROM || `"HeyPrince Inquiries" <${smtpUser}>`;

      const info = await transporter.sendMail({
        from: senderFrom,
        to: recipient,
        replyTo: params.email,
        subject,
        html: emailHtml,
      });

      console.info(`[Email:SMTP] Admin notification sent (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr: any) {
      console.error('[Email:SMTP] Admin notification failed:', smtpErr);
      return { success: false, error: smtpErr?.message || 'SMTP dispatch error' };
    }
  }

  console.warn('[Email] Neither RESEND_API_KEY nor SMTP credentials configured. Skipping notification.');
  return {
    success: false,
    error: 'No email service credentials configured in environment (RESEND_API_KEY or SMTP)',
  };
}

/**
 * Sends the revert/confirmation email directly to the customer's email address
 */
export async function sendCustomerConfirmationEmail(params: SendLeadEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!params.email || !params.email.includes('@')) {
    return { success: false, error: 'Invalid client email address' };
  }

  const subject = `Inquiry Received: We'll be in touch within 2 to 4 hours | Prince`;
  const emailHtml = buildCustomerRevertHtml(params);

  // 1. Try Resend if configured
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prince • HeyPrince <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [params.email],
        replyTo: process.env.LEAD_NOTIFICATION_EMAIL || 'it@heyprince.in',
        subject,
        html: emailHtml,
      });

      if (!error && data?.id) {
        console.info(`[Email:Resend] Customer revert email sent to ${params.email} (ID: ${data.id})`);
        return { success: true, messageId: data.id };
      }
    } catch (resendErr: any) {
      console.warn('[Email:Resend] Customer confirmation error:', resendErr?.message);
    }
  }

  // 2. Try SMTP if configured (Hostinger)
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const port = Number(process.env.SMTP_PORT) || 465;
      const isSecure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: port,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });

      const senderFrom = process.env.SMTP_FROM || `"Prince • HeyPrince" <${smtpUser}>`;

      const info = await transporter.sendMail({
        from: senderFrom,
        to: params.email,
        replyTo: process.env.LEAD_NOTIFICATION_EMAIL || smtpUser,
        subject,
        html: emailHtml,
      });

      console.info(`[Email:SMTP] Customer revert email sent to ${params.email} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr: any) {
      console.error('[Email:SMTP] Customer revert email error:', smtpErr);
      return { success: false, error: smtpErr?.message || 'SMTP customer dispatch error' };
    }
  }

  return { success: false, error: 'No email service credentials configured' };
}

/**
 * Dispatches both the internal admin alert and the customer 4-hour revert confirmation concurrently
 */
export async function dispatchLeadEmails(params: SendLeadEmailParams): Promise<{
  adminResult: { success: boolean; messageId?: string; error?: string };
  customerResult: { success: boolean; messageId?: string; error?: string };
}> {
  const [adminRes, customerRes] = await Promise.allSettled([
    sendLeadNotificationEmail(params),
    sendCustomerConfirmationEmail(params),
  ]);

  const adminResult = adminRes.status === 'fulfilled' ? adminRes.value : { success: false, error: String(adminRes.reason) };
  const customerResult = customerRes.status === 'fulfilled' ? customerRes.value : { success: false, error: String(customerRes.reason) };

  return { adminResult, customerResult };
}
