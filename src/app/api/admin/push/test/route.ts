import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { sendPushToAllAdmins } from '@/lib/push/push-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendPushToAllAdmins({
      title: '🤖 JARVIS Test Alert',
      body: 'This is a test notification from your AI Chief of Staff. Tapping this opens your approvals queue.',
      url: '/admin/approvals',
    });

    return NextResponse.json({
      success: true,
      message: `Sent test push notification to ${result.sent} device(s).`,
      result,
    });
  } catch (error: any) {
    console.error('[API /api/admin/push/test] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send test push.' },
      { status: 500 }
    );
  }
}

