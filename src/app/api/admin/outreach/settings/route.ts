import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { getOutreachSettings, updateOutreachSettings } from '@/lib/outreach/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await getOutreachSettings();
    return NextResponse.json({
      success: true,
      settings,
      providerStatus: {
        hasSmtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        hasResend: Boolean(process.env.RESEND_API_KEY),
        hasGemini: Boolean(process.env.GEMINI_API_KEY),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const updated = await updateOutreachSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Outreach settings successfully updated.',
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
