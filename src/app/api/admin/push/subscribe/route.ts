import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { savePushSubscription, sendPushToAllAdmins } from '@/lib/push/push-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription object.' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || undefined;

    await savePushSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      adminEmail: admin.email,
      userAgent,
    });

    // Send instant welcome confirmation push
    try {
      await sendPushToAllAdmins({
        title: '🤖 JARVIS Connected to iPhone',
        body: 'Push alerts are now active on your device! You will get instant alerts whenever drafts are ready.',
        url: '/admin/approvals',
      });
    } catch (pushErr) {
      console.warn('[PushSubscribe] Welcome push error:', pushErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully.',
    });
  } catch (error: any) {
    console.error('[API /api/admin/push/subscribe] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save subscription.' },
      { status: 500 }
    );
  }
}

