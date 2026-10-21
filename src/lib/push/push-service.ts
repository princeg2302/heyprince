import webpush from 'web-push';
import { query } from '../outreach/db';

const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  'BBr4nqm4JW1Zv5DLe_R5NGnfip68mI8xQgb7gXiVm-eV6vVtAp3NiiSE-j_F553adRFQA3IRzw5FF221wwk9RzM';

const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || '5FacYlKOk3A3c53OfCVVEhr7mWNgvnMDRnjhuWep1t0';

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:heyprince.connect@gmail.com';

let vapidConfigured = false;

export function getVapidPublicKey(): string {
  return DEFAULT_VAPID_PUBLIC_KEY;
}

export function initVapid() {
  if (!vapidConfigured) {
    try {
      webpush.setVapidDetails(
        VAPID_SUBJECT,
        DEFAULT_VAPID_PUBLIC_KEY,
        DEFAULT_VAPID_PRIVATE_KEY
      );
      vapidConfigured = true;
    } catch (err) {
      console.error('[WebPush] Error setting VAPID details:', err);
    }
  }
}

export async function ensurePushSubscriptionsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
      id SERIAL PRIMARY KEY,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      admin_email VARCHAR(255),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

export async function savePushSubscription(params: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  adminEmail?: string;
  userAgent?: string;
}): Promise<boolean> {
  await ensurePushSubscriptionsTable();

  await query(
    `INSERT INTO admin_push_subscriptions (endpoint, p256dh, auth, admin_email, user_agent, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (endpoint) DO UPDATE 
     SET p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         admin_email = COALESCE(EXCLUDED.admin_email, admin_push_subscriptions.admin_email),
         user_agent = COALESCE(EXCLUDED.user_agent, admin_push_subscriptions.user_agent),
         updated_at = NOW();`,
    [
      params.endpoint,
      params.keys.p256dh,
      params.keys.auth,
      params.adminEmail || null,
      params.userAgent || null,
    ]
  );

  return true;
}

export async function deletePushSubscription(endpoint: string): Promise<boolean> {
  await ensurePushSubscriptionsTable();
  await query(`DELETE FROM admin_push_subscriptions WHERE endpoint = $1;`, [endpoint]);
  return true;
}

export async function sendPushToAllAdmins(payload: {
  title: string;
  body: string;
  url?: string;
  draftId?: string | number;
}): Promise<{ sent: number; failed: number; total: number }> {
  initVapid();
  await ensurePushSubscriptionsTable();

  const subscriptions = await query<any>(
    `SELECT endpoint, p256dh, auth FROM admin_push_subscriptions;`
  );

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || (payload.draftId ? `/admin/approvals?draftId=${payload.draftId}` : '/admin/approvals'),
    draftId: payload.draftId,
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, notificationPayload, {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: 'high',
      });
      sent++;
    } catch (err: any) {
      failed++;
      console.warn(`[WebPush] Push failed for ${sub.endpoint.slice(0, 30)}...:`, err?.statusCode || err?.message);

      // Clean up expired or unsubscribed devices (HTTP 410 or 404)
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await deletePushSubscription(sub.endpoint);
      }
    }
  }

  return { sent, failed, total: subscriptions.length };
}

