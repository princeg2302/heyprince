import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/outreach/compliance/tokens';
import { addSuppression, query } from '@/lib/outreach/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return new NextResponse(renderHtmlPage('Invalid Request', 'No unsubscribe token provided.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const result = verifyUnsubscribeToken(token);
  if (!result.valid || !result.payload) {
    return new NextResponse(
      renderHtmlPage('Invalid or Expired Link', 'This unsubscribe link is invalid or has expired.'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const { email, businessId } = result.payload;

  // Immediately suppress future contact
  await addSuppression({
    email,
    reason: 'UNSUBSCRIBE',
    source: 'unsubscribe_link_click',
    metadata: { tokenVerified: true, businessId, timestamp: new Date().toISOString() },
  });

  // Mark latest message as unsubscribed
  await query(
    `UPDATE email_messages SET unsubscribed_at = NOW(), status = 'CANCELLED' 
     WHERE recipient_email = $1 AND status IN ('DRAFT', 'QUEUED');`,
    [email]
  );

  return new NextResponse(
    renderHtmlPage(
      'Unsubscribed Successfully',
      `You have been removed from future updates for <strong>${escapeHtml(email)}</strong>. No further outreach will be sent to this address.`
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

/**
 * Handles RFC 8058 One-Click POST requests from modern mail clients (Gmail, Apple Mail, Outlook)
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
  }

  const result = verifyUnsubscribeToken(token);
  if (!result.valid || !result.payload) {
    return NextResponse.json({ success: false, error: 'Invalid or forged token' }, { status: 400 });
  }

  const { email, businessId } = result.payload;

  await addSuppression({
    email,
    reason: 'UNSUBSCRIBE',
    source: 'rfc8058_one_click_post',
    metadata: { tokenVerified: true, businessId, timestamp: new Date().toISOString() },
  });

  await query(
    `UPDATE email_messages SET unsubscribed_at = NOW(), status = 'CANCELLED' 
     WHERE recipient_email = $1 AND status IN ('DRAFT', 'QUEUED');`,
    [email]
  );

  return NextResponse.json({
    success: true,
    message: `Address ${email} has been permanently unsubscribed and suppressed.`,
  });
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

function renderHtmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — HeyPrince</title>
  <style>
    body {
      background-color: #07070a;
      color: #f4f4f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background-color: #0e0e16;
      border: 1px solid #1c1c2b;
      border-radius: 16px;
      max-width: 500px;
      width: 100%;
      padding: 36px 32px;
      text-align: center;
      box-shadow: 0 16px 40px rgba(0,0,0,0.8);
    }
    .logo {
      height: 38px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 14px 0;
    }
    p {
      color: #9ca3af;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .btn {
      display: inline-block;
      background: #1f1f2e;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      text-decoration: none;
      font-weight: 600;
      border: 1px solid #2d2d42;
    }
    .btn:hover {
      background: #2b2b3d;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="https://heyprince.in/assets/heyprince-logo.png" alt="HeyPrince" class="logo" />
    <h1>${escapeHtml(title)}</h1>
    <p>${message}</p>
    <a href="https://heyprince.in" class="btn">Return to HeyPrince</a>
  </div>
</body>
</html>`;
}
