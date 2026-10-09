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

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  return trimmed.replace(/^["']|["']$/g, '');
}

export function isEmailConfigured(): boolean {
  const hasResend = Boolean(cleanEnv(process.env.RESEND_API_KEY));
  const hasSmtp = Boolean(
    cleanEnv(process.env.SMTP_HOST) &&
    cleanEnv(process.env.SMTP_USER) &&
    cleanEnv(process.env.SMTP_PASS)
  );
  return hasResend || hasSmtp;
}

function cleanPhoneForWhatsApp(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits;
  return null;
}

export const BRAND_LOGO_URL = 'https://heyprince.in/assets/heyprince-logo.png';

/**
 * Builds the ultra-premium dark theme notification email sent to it@heyprince.in
 */
export function buildAdminNotificationHtml(
  params: SendLeadEmailParams,
  dateFormatted: string,
  logoSrc: string = BRAND_LOGO_URL
): string {
  const waNumber = cleanPhoneForWhatsApp(params.phone);
  const waLink = waNumber ? `https://wa.me/${waNumber}` : null;
  const adminUrl = 'https://heyprince.in/admin/leads/';

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark">
  <title>New Project Inquiry</title>
  <style>
    :root {
      color-scheme: dark only;
      supported-color-schemes: dark;
    }
    body, table, td, p, a, div {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }
    body, .email-bg {
      background-color: #06060a !important;
    }
    .card-bg {
      background-color: #0e0e16 !important;
    }
    .subcard-bg {
      background-color: #08080f !important;
    }
    a {
      text-decoration: none;
    }
  </style>
</head>
<body bgcolor="#06060a" style="margin: 0; padding: 0; background-color: #06060a; color: #f4f4f7; -webkit-font-smoothing: antialiased;">
  <!-- Outer Canvas Table -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#06060a" style="background-color: #06060a; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Dark Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0e0e16" style="max-width: 620px; background-color: #0e0e16; border: 1px solid #1c1c2b; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85);">
          
          <!-- Glowing Top Neon Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #ff3366 0%, #8b5cf6 50%, #00f5a0 100%);"></td>
          </tr>

          <!-- Brand Header Bar with Official Logo -->
          <tr>
            <td bgcolor="#07070d" style="padding: 24px 32px 18px 32px; border-bottom: 1px solid #161624; background-color: #07070d;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <a href="https://heyprince.in" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoSrc}" width="140" height="26" alt="HeyPrince" style="display: block; height: 26px; width: auto; max-width: 160px; border: 0; outline: none;" />
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: rgba(255, 51, 102, 0.14); border: 1px solid rgba(255, 51, 102, 0.38); color: #ff3366; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 100px; white-space: nowrap;">
                      ⚡ New Project Inquiry
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Lead Summary Bar -->
          <tr>
            <td bgcolor="#0b0b12" style="padding: 22px 32px 18px 32px; border-bottom: 1px solid #181826; background-color: #0b0b12;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                ${params.name} <span style="font-weight: 400; color: #8e8ea2; font-size: 16px;">${params.company ? `• ${params.company}` : ''}</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #76768e;">
                Received on ${dateFormatted} via <a href="https://heyprince.in" style="color: #ff3366; font-weight: 600;">heyprince.in</a>
              </p>
            </td>
          </tr>

          <!-- Client Metadata Grid -->
          <tr>
            <td style="padding: 24px 32px 14px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <!-- Email -->
                  <td width="50%" valign="top" style="padding-bottom: 18px; padding-right: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a92; margin-bottom: 5px; font-weight: 700;">Client Email</div>
                    <a href="mailto:${params.email}" style="font-size: 14px; font-weight: 600; color: #ff3366; word-break: break-all;">${params.email}</a>
                  </td>
                  <!-- Phone / WhatsApp -->
                  <td width="50%" valign="top" style="padding-bottom: 18px; padding-left: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a92; margin-bottom: 5px; font-weight: 700;">Phone / WhatsApp</div>
                    <div style="font-size: 14px; font-weight: 600; color: #ffffff;">${params.phone || 'Not provided'}</div>
                  </td>
                </tr>
                <tr>
                  <!-- Service -->
                  <td width="50%" valign="top" style="padding-bottom: 18px; padding-right: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a92; margin-bottom: 5px; font-weight: 700;">Selected Service</div>
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.14); color: #ffffff; font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 6px;">
                      ${params.service}
                    </span>
                  </td>
                  <!-- Budget & Timeline -->
                  <td width="50%" valign="top" style="padding-bottom: 18px; padding-left: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7a92; margin-bottom: 5px; font-weight: 700;">Budget & Timeline</div>
                    <div style="font-size: 13px; font-weight: 600; color: #00f5a0;">
                      ${params.budget || 'Custom Quote'} <span style="color: #76768e; font-weight: 400;">(${params.timeline || 'Flexible'})</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Project Message Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div bgcolor="#07070d" style="background-color: #07070d; border: 1px solid #181826; border-radius: 12px; padding: 20px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #ff3366; margin-bottom: 8px; font-weight: 700;">
                  Project Brief & Requirements
                </div>
                <div style="font-size: 14px; line-height: 1.6; color: #e4e4ee; white-space: pre-line; margin: 0;">
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
                          <a href="mailto:${params.email}?subject=${encodeURIComponent(`Regarding Your Inquiry with Prince: ${params.service}`)}" style="display: inline-block; padding: 12px 22px; font-size: 13px; font-weight: 700; color: #ffffff; border-radius: 8px;">
                            ✉️ Reply to ${params.name.split(' ')[0]}
                          </a>
                        </td>
                        ${
                          waLink
                            ? `
                        <td width="10"></td>
                        <!-- WhatsApp Button -->
                        <td align="center" style="border-radius: 8px; background: #25d366; padding: 0;">
                          <a href="${waLink}" target="_blank" style="display: inline-block; padding: 12px 20px; font-size: 13px; font-weight: 700; color: #000000; border-radius: 8px;">
                            💬 WhatsApp Chat
                          </a>
                        </td>
                        `
                            : ''
                        }
                        <td width="10"></td>
                        <!-- CRM Link -->
                        <td align="center" style="border-radius: 8px; background: #161622; border: 1px solid #28283c; padding: 0;">
                          <a href="${adminUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; font-size: 13px; font-weight: 600; color: #ffffff; border-radius: 8px;">
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
            <td bgcolor="#07070c" style="background-color: #07070c; padding: 22px 32px; border-top: 1px solid #161622; text-align: center;">
              <a href="https://heyprince.in" target="_blank" style="text-decoration: none; display: inline-block; margin-bottom: 8px;">
                <img src="${logoSrc}" width="105" height="20" alt="HeyPrince" style="display: inline-block; height: 20px; width: auto; max-width: 115px; border: 0; outline: none; opacity: 0.75;" />
              </a>
              <p style="margin: 0; font-size: 12px; color: #5a5a6e;">
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
 * Builds the ultra-premium dark theme confirmation & 4-hour commitment revert email sent to the customer
 */
export function buildCustomerRevertHtml(
  params: SendLeadEmailParams,
  logoSrc: string = BRAND_LOGO_URL
): string {
  const firstName = params.name ? params.name.split(' ')[0] : 'there';
  const waDirectUrl =
    'https://wa.me/919120900010?text=' +
    encodeURIComponent(`Hi Prince, I just submitted an inquiry on heyprince.in regarding ${params.service}.`);

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark">
  <title>Inquiry Received — HeyPrince</title>
  <style>
    :root {
      color-scheme: dark only;
      supported-color-schemes: dark;
    }
    body, table, td, p, a, div {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }
    body, .email-bg {
      background-color: #06060a !important;
    }
    .card-bg {
      background-color: #0e0e16 !important;
    }
    .subcard-bg {
      background-color: #07070d !important;
    }
    a {
      text-decoration: none;
    }
  </style>
</head>
<body bgcolor="#06060a" style="margin: 0; padding: 0; background-color: #06060a; color: #f4f4f7; -webkit-font-smoothing: antialiased;">
  <!-- Outer Canvas Table -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#06060a" style="background-color: #06060a; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Dark Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0e0e16" style="max-width: 600px; background-color: #0e0e16; border: 1px solid #1c1c2b; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85);">
          
          <!-- Glowing Top Neon Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #ff3366 0%, #8b5cf6 50%, #00f5a0 100%);"></td>
          </tr>

          <!-- Brand Header with Official Logo -->
          <tr>
            <td bgcolor="#0a0a10" style="padding: 26px 32px 20px 32px; border-bottom: 1px solid #181826; background-color: #0a0a10;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <a href="https://heyprince.in" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoSrc}" width="140" height="26" alt="HeyPrince" style="display: block; height: 26px; width: auto; max-width: 160px; border: 0; outline: none;" />
                    </a>
                    <span style="display: block; font-size: 11px; color: #76768e; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 6px;">
                      Senior Full Stack Engineer &amp; Tech Partner
                    </span>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: rgba(0, 245, 160, 0.1); border: 1px solid rgba(0, 245, 160, 0.32); color: #00f5a0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px; white-space: nowrap;">
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
              <h2 style="margin: 0 0 12px 0; font-size: 21px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Hi ${firstName}, thank you for reaching out!
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #c4c4d6;">
                I’ve personally received your project inquiry regarding <strong style="color: #ffffff;">${params.service}</strong>.
              </p>

              <!-- Turnaround Guarantee Box (Dark Glass) -->
              <div bgcolor="#130d18" style="background-color: #130d18; border: 1px solid rgba(255, 51, 102, 0.35); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
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
              <div bgcolor="#07070d" style="background-color: #07070d; border: 1px solid #181826; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #76768e; font-weight: 700; margin-bottom: 12px;">
                  📋 Summary of Your Submitted Scope
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px;">
                  <tr>
                    <td width="35%" style="font-size: 12px; color: #76768e; padding-bottom: 8px;">Requested Service:</td>
                    <td style="font-size: 13px; color: #ffffff; font-weight: 600; padding-bottom: 8px;">${params.service}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #76768e; padding-bottom: 8px;">Estimated Budget:</td>
                    <td style="font-size: 13px; color: #00f5a0; font-weight: 600; padding-bottom: 8px;">${params.budget || 'Custom Quote'}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #76768e; padding-bottom: 8px;">Target Timeline:</td>
                    <td style="font-size: 13px; color: #ffffff; font-weight: 600; padding-bottom: 8px;">${params.timeline || 'Flexible'}</td>
                  </tr>
                </table>

                <div style="border-top: 1px solid #181826; padding-top: 12px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #76768e; font-weight: 700; display: block; margin-bottom: 6px;">Your Project Notes:</span>
                  <p style="font-size: 13px; line-height: 1.55; color: #d0d0e2; margin: 0; white-space: pre-line;">
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
                      <span style="display: inline-block; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(255, 51, 102, 0.16); color: #ff3366; font-size: 12px; font-weight: 700; text-align: center; line-height: 22px;">1</span>
                    </td>
                    <td style="padding-bottom: 10px; padding-left: 8px;">
                      <strong style="color: #ffffff; font-size: 13px;">Technical Scope Review:</strong>
                      <span style="color: #9292a4; font-size: 13px;"> Evaluating technical feasibility, stack architecture, and sprint timelines.</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="28" valign="top" style="padding-bottom: 10px;">
                      <span style="display: inline-block; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(255, 51, 102, 0.16); color: #ff3366; font-size: 12px; font-weight: 700; text-align: center; line-height: 22px;">2</span>
                    </td>
                    <td style="padding-bottom: 10px; padding-left: 8px;">
                      <strong style="color: #ffffff; font-size: 13px;">Direct Response:</strong>
                      <span style="color: #9292a4; font-size: 13px;"> I’ll reply directly to this email with tailored recommendations and milestone options.</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="28" valign="top">
                      <span style="display: inline-block; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(255, 51, 102, 0.16); color: #ff3366; font-size: 12px; font-weight: 700; text-align: center; line-height: 22px;">3</span>
                    </td>
                    <td style="padding-left: 8px;">
                      <strong style="color: #ffffff; font-size: 13px;">Discovery Call (Optional):</strong>
                      <span style="color: #9292a4; font-size: 13px;"> If helpful, we can hop on a quick 15-minute alignment call before starting development.</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Urgent WhatsApp Card (Dark Forest Glass) -->
              <div bgcolor="#08140c" style="background-color: #08140c; border: 1px solid rgba(37, 211, 102, 0.28); border-radius: 12px; padding: 16px 20px; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #cfcfde;">
                  Have an urgent sprint requirement or tight deadline?
                </p>
                <a href="${waDirectUrl}" target="_blank" style="display: inline-block; background-color: #25d366; color: #000000; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px;">
                  💬 Chat Directly on WhatsApp (+91 9120900010)
                </a>
              </div>
            </td>
          </tr>

          <!-- Signature & Footer -->
          <tr>
            <td bgcolor="#07070c" style="background-color: #07070c; padding: 24px 32px; border-top: 1px solid #161622;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <a href="https://heyprince.in" target="_blank" style="text-decoration: none; display: inline-block; margin-bottom: 8px;">
                      <img src="${logoSrc}" width="115" height="21" alt="HeyPrince" style="display: block; height: 21px; width: auto; max-width: 125px; border: 0; outline: none; opacity: 0.9;" />
                    </a>
                    <strong style="color: #ffffff; font-size: 14px; display: block;">Prince</strong>
                    <span style="color: #76768e; font-size: 12px; display: block; margin-top: 2px;">
                      Senior Full Stack Engineer &amp; Tech Partner
                    </span>
                    <span style="color: #76768e; font-size: 12px; display: block; margin-top: 4px;">
                      <a href="https://heyprince.in" style="color: #ff3366; font-weight: 600;">heyprince.in</a> • <a href="mailto:it@heyprince.in" style="color: #76768e;">it@heyprince.in</a>
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
  const recipient = cleanEnv(process.env.LEAD_NOTIFICATION_EMAIL) || 'it@heyprince.in';
  const fromEmail = cleanEnv(process.env.RESEND_FROM_EMAIL) || cleanEnv(process.env.SMTP_FROM) || 'HeyPrince Inquiries <onboarding@resend.dev>';
  const subject = `⚡ New Project Inquiry: [${params.service}] from ${params.name}`;

  const dateFormatted = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // 1. Try Resend if RESEND_API_KEY is configured
  const resendApiKey = cleanEnv(process.env.RESEND_API_KEY);
  if (resendApiKey) {
    try {
      const emailHtml = buildAdminNotificationHtml(params, dateFormatted, BRAND_LOGO_URL);

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
  const smtpHost = cleanEnv(process.env.SMTP_HOST);
  const smtpUser = cleanEnv(process.env.SMTP_USER);
  const smtpPass = cleanEnv(process.env.SMTP_PASS);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const emailHtml = buildAdminNotificationHtml(params, dateFormatted, BRAND_LOGO_URL);

      const port = Number(cleanEnv(process.env.SMTP_PORT)) || 465;
      const secureEnv = cleanEnv(process.env.SMTP_SECURE);
      const isSecure = secureEnv !== undefined ? secureEnv === 'true' : port === 465;

      const transporter = getSmtpTransporter(smtpHost, port, isSecure, smtpUser, smtpPass);

      const senderFrom = cleanEnv(process.env.SMTP_FROM) || `"HeyPrince Inquiries" <${smtpUser}>`;

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

function getSmtpTransporter(
  host: string,
  port: number,
  secure: boolean,
  user: string,
  pass: string
) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
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

  // 1. Try Resend if configured
  const resendApiKey = cleanEnv(process.env.RESEND_API_KEY);
  if (resendApiKey) {
    try {
      const emailHtml = buildCustomerRevertHtml(params, BRAND_LOGO_URL);

      const resend = new Resend(resendApiKey);
      const fromEmail = cleanEnv(process.env.RESEND_FROM_EMAIL) || 'Prince • HeyPrince <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [params.email],
        replyTo: cleanEnv(process.env.LEAD_NOTIFICATION_EMAIL) || 'it@heyprince.in',
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
  const smtpHost = cleanEnv(process.env.SMTP_HOST);
  const smtpUser = cleanEnv(process.env.SMTP_USER);
  const smtpPass = cleanEnv(process.env.SMTP_PASS);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const emailHtml = buildCustomerRevertHtml(params, BRAND_LOGO_URL);

      const port = Number(cleanEnv(process.env.SMTP_PORT)) || 465;
      const secureEnv = cleanEnv(process.env.SMTP_SECURE);
      const isSecure = secureEnv !== undefined ? secureEnv === 'true' : port === 465;

      const transporter = getSmtpTransporter(smtpHost, port, isSecure, smtpUser, smtpPass);

      const senderFrom = cleanEnv(process.env.SMTP_FROM) || `"Prince • HeyPrince" <${smtpUser}>`;

      const info = await transporter.sendMail({
        from: senderFrom,
        to: params.email,
        replyTo: cleanEnv(process.env.LEAD_NOTIFICATION_EMAIL) || smtpUser,
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
