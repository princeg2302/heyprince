/**
 * HeyPrince Outbound Email Template Builder
 * Formats outreach emails with brand logo, sender profile avatar, clean typography,
 * and a compliant, clickable unsubscribe link without raw URLs or location details.
 */

export const BRAND_LOGO_URL = 'https://heyprince.in/assets/heyprince-logo.png';
export const PROFILE_ICON_URL = 'https://heyprince.in/profile-icon.png';

export interface OutreachEmailTemplateParams {
  subject: string;
  bodyText: string;
  recipientName?: string | null;
  businessName?: string | null;
  unsubscribeUrl?: string; // If provided, replaces {{UNSUBSCRIBE_URL}}
}

/**
 * Returns absolute production base URL for email links.
 * Never returns localhost or 127.0.0.1 in outbound emails.
 */
export function getOutreachProductionBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SERVER_URL?.trim();
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://heyprince.in';
}

/**
 * Parses plain-text outreach draft and formats it into clean HTML paragraphs
 * while stripping location references and separating signature / disclaimer.
 */
export function buildOutreachEmailHtml(params: OutreachEmailTemplateParams): string {
  let text = params.bodyText || '';

  // 1. Remove physical location references if present (e.g., Kolkata, West Bengal, India)
  text = text.replace(/Kolkata,\s*West Bengal(?:,\s*India)?/gi, '');
  text = text.replace(/,\s*West Bengal(?:,\s*India)?/gi, '');

  // 2. Separate footer unsubscribe section if present in the text draft
  let mainBody = text;
  const unsubscribeSplit = text.split(/(?:--|\n\s*To stop receiving updates|\n\s*If you would prefer not to receive)/i);
  if (unsubscribeSplit.length > 1) {
    mainBody = unsubscribeSplit[0].trim();
  }

  // 3. Convert paragraphs into clean HTML <p> elements
  const paragraphs = mainBody
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('Best regards,') && !p.startsWith('Prince') && !p.startsWith('Principal Engineer'));

  const paragraphsHtml = paragraphs
    .map((p) => {
      // Escape HTML
      let formatted = p
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      // Auto-link https://heyprince.in
      formatted = formatted.replace(
        /(https:\/\/heyprince\.in)/g,
        '<a href="$1" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 500;">$1</a>'
      );

      // Handle single newlines inside a paragraph
      formatted = formatted.replace(/\n/g, '<br />');

      return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #e4e4e7;">${formatted}</p>`;
    })
    .join('\n');

  const unsubscribePlaceholder = params.unsubscribeUrl || '{{UNSUBSCRIBE_URL}}';

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark">
  <title>${params.subject ? params.subject.replace(/</g, '&lt;') : 'HeyPrince'}</title>
  <style>
    :root { color-scheme: dark only; supported-color-schemes: dark; }
    body, table, td, p, a, div {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b0f; color: #e4e4e7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0b0f; width: 100%; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #121218; border: 1px solid #22222e; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.45);">
          
          <!-- Header with Brand Logo -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #1c1c28; background: linear-gradient(180deg, #181824 0%, #121218 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="https://heyprince.in" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${BRAND_LOGO_URL}" width="140" height="26" alt="HeyPrince" style="display: block; border: 0; height: auto; max-height: 28px; width: auto; max-width: 150px;" />
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #71717a; text-transform: uppercase;">Digital Engineering</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body Content -->
          <tr>
            <td style="padding: 32px 32px 16px 32px;">
              ${paragraphsHtml}
            </td>
          </tr>

          <!-- Sender Profile & Signature Card -->
          <tr>
            <td style="padding: 8px 32px 28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0d0d14; border: 1px solid #20202c; border-radius: 10px; padding: 14px 18px;">
                <tr>
                  <td width="52" valign="middle" style="padding-right: 14px;">
                    <a href="https://heyprince.in" target="_blank" style="text-decoration: none;">
                      <img src="${PROFILE_ICON_URL}" width="48" height="48" alt="Prince" style="display: block; width: 48px; height: 48px; border-radius: 10px; border: 1px solid #2e2e3e;" />
                    </a>
                  </td>
                  <td valign="middle">
                    <div style="font-size: 15px; font-weight: 700; color: #ffffff; line-height: 1.2; margin-bottom: 3px;">
                      Prince
                    </div>
                    <div style="font-size: 12px; color: #a1a1aa; line-height: 1.3; margin-bottom: 5px;">
                      Principal Engineer &amp; Founder, HeyPrince
                    </div>
                    <div style="font-size: 12px; color: #71717a; line-height: 1.3;">
                      <a href="https://heyprince.in" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 600;">heyprince.in</a>
                      <span style="color: #3f3f46; margin: 0 6px;">•</span>
                      <a href="mailto:it@heyprince.in" style="color: #a1a1aa; text-decoration: none;">it@heyprince.in</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer with Clean, Clickable Unsubscribe Link (NO LOCALHOST, NO FULL RAW URL) -->
          <tr>
            <td style="padding: 20px 32px 24px 32px; background-color: #09090d; border-top: 1px solid #191924; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; line-height: 16px; color: #71717a;">
                You received this direct message regarding digital architecture and web development opportunities.
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 16px; color: #71717a;">
                If you prefer not to receive future messages, you can 
                <a href="${unsubscribePlaceholder}" style="color: #ff3366; text-decoration: underline; font-weight: 600;">unsubscribe here</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

