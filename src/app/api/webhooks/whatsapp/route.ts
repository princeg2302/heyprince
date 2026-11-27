import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { logChiefActivity } from '@/lib/chief-of-staff/db';
import { supabase } from '@/lib/admin-db';
import { sanitizeEmDashes } from '@/lib/ai-content-sanitizer';

export const dynamic = 'force-dynamic';

/**
 * Health check / verification endpoint for Whapi.cloud or webhook testers.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'HeyPrince WhatsApp Webhook',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Inbound webhook handler for Whapi.cloud WhatsApp events.
 * Handles incoming client messages (messages.post) and delivery receipts (statuses.post).
 */
export async function POST(request: NextRequest) {
  // Whapi.Cloud supports custom webhook headers. Require a shared secret before
  // accepting events because this route writes leads using a privileged server key.
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json({ success: false, error: 'Webhook authentication is not configured.' }, { status: 503 });
  }

  const suppliedSecret = request.headers.get('x-heyprince-webhook-secret')?.trim() || '';
  const expectedBuffer = Buffer.from(expectedSecret, 'utf8');
  const suppliedBuffer = Buffer.from(suppliedSecret, 'utf8');
  if (
    !suppliedSecret ||
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();

    // 1. Process incoming messages (messages.post)
    if (Array.isArray(payload.messages) && payload.messages.length > 0) {
      for (const msg of payload.messages) {
        // Skip messages sent by our own account
        if (msg.from_me) {
          continue;
        }

        const senderJid = String(msg.from || '');
        const isDirectChat = senderJid.endsWith('@s.whatsapp.net');
        const phoneDigits = senderJid.replace(/[^0-9]/g, '');
        const senderName = msg.from_name || (phoneDigits ? `+${phoneDigits}` : 'WhatsApp Lead');
        const messageBody = sanitizeEmDashes(
          msg.text?.body || msg.caption || (msg.type ? `[${msg.type} message]` : 'No text content')
        );

        console.info(`[WhatsApp Webhook] Incoming message from ${senderName} (${phoneDigits}): "${messageBody.slice(0, 80)}"`);

        // Record inbound message activity for Chief of Staff
        try {
          await logChiefActivity(
            'inbound_responder',
            'info',
            `WhatsApp message from ${senderName} (+${phoneDigits})`,
            {
              messageId: msg.id,
              phone: phoneDigits,
              senderName,
              body: messageBody,
              chatId: msg.chat_id,
              type: msg.type,
              timestamp: msg.timestamp,
            }
          );
        } catch (logErr) {
          console.warn('[WhatsApp Webhook] Non-fatal Chief of Staff log notice:', logErr);
        }

        // If it is a direct personal message from a client (not a group or channel)
        if (isDirectChat && phoneDigits && messageBody.length > 0) {
          try {
            const now = new Date().toISOString();
            // Check if lead already exists with this phone number
            const { data: existingLeads, error: lookupError } = await supabase
              .from('leads')
              .select('id, name, phone, message')
              .ilike('phone', `%${phoneDigits.slice(-10)}%`)
              .limit(1);

            if (lookupError) {
              throw new Error(`WhatsApp lead lookup failed: ${lookupError.message}`);
            }

            if (!existingLeads || existingLeads.length === 0) {
              // Create new inbound WhatsApp lead. A failed write must be retried
              // by the webhook provider rather than acknowledged and lost.
              const { error: insertError } = await supabase.from('leads').insert([
                {
                  name: senderName,
                  email: `${phoneDigits}@whatsapp.inbound`,
                  phone: `+${phoneDigits}`,
                  company: '',
                  service: 'WhatsApp Inquiry',
                  budget: 'Custom Quote',
                  timeline: 'Immediate',
                  message: messageBody,
                  source: 'whatsapp_direct',
                  status: 'NEW',
                  created_at: now,
                  updated_at: now,
                },
              ]);

              if (insertError) {
                throw new Error(`WhatsApp lead insert failed: ${insertError.message}`);
              }
              console.info(`[WhatsApp Webhook] Created new lead for incoming WhatsApp contact (+${phoneDigits})`);
            }
          }
        }
      }
    }

    // 2. Process message delivery statuses (statuses.post)
    if (Array.isArray(payload.statuses) && payload.statuses.length > 0) {
      for (const st of payload.statuses) {
        if (st.status === 'failed') {
          console.warn(`[WhatsApp Webhook] Message delivery failed for ID ${st.id}:`, st.error || 'Unknown error');
        }
      }
    }

    // Always acknowledge Whapi with 200 OK so webhook deliveries stay healthy
    return NextResponse.json({
      success: true,
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed. The provider may retry this event.',
      },
      { status: 500 }
    );
  }
}
