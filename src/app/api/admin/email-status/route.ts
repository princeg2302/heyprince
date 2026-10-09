import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  return trimmed.replace(/^["']|["']$/g, '');
}

export async function GET(request: NextRequest) {
  const hasResend = Boolean(cleanEnv(process.env.RESEND_API_KEY));
  const smtpHost = cleanEnv(process.env.SMTP_HOST);
  const smtpPort = Number(cleanEnv(process.env.SMTP_PORT)) || 465;
  const smtpUser = cleanEnv(process.env.SMTP_USER);
  const smtpPass = cleanEnv(process.env.SMTP_PASS);
  const smtpSecure = cleanEnv(process.env.SMTP_SECURE);

  const envCheck = {
    hasResendKey: hasResend,
    hasSmtpHost: Boolean(smtpHost),
    smtpHost: smtpHost || null,
    smtpPort: smtpPort,
    hasSmtpUser: Boolean(smtpUser),
    smtpUser: smtpUser || null,
    hasSmtpPass: Boolean(smtpPass),
    smtpPassLength: smtpPass ? smtpPass.length : 0,
    hasNotificationEmail: Boolean(cleanEnv(process.env.LEAD_NOTIFICATION_EMAIL)),
    leadNotificationEmail: cleanEnv(process.env.LEAD_NOTIFICATION_EMAIL) || 'it@heyprince.in',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'local-or-unspecified',
  };

  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({
      configured: false,
      verified: false,
      diagnostics: envCheck,
      message: 'SMTP credentials missing in environment variables. Add SMTP_HOST, SMTP_USER, SMTP_PASS to Vercel.',
    });
  }

  // Attempt live connection handshake
  try {
    const isSecure = smtpSecure !== undefined ? smtpSecure === 'true' : smtpPort === 465;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    await transporter.verify();

    return NextResponse.json({
      configured: true,
      verified: true,
      diagnostics: envCheck,
      message: 'Hostinger SMTP connection verified and operational!',
    });
  } catch (verifyErr: any) {
    return NextResponse.json({
      configured: true,
      verified: false,
      diagnostics: envCheck,
      error: verifyErr?.message,
      errorCode: verifyErr?.code,
    });
  }
}

