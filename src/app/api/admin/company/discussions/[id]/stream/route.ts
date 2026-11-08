import { NextRequest } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getDiscussionById, getDiscussionMessages } from '@/lib/company/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      request.signal.addEventListener('abort', () => {
        isClosed = true;
        try {
          controller.close();
        } catch {}
      });

      // Initial state push
      try {
        const disc = await getDiscussionById(id);
        const msgs = await getDiscussionMessages(id);
        const payload = JSON.stringify({ discussion: disc, messages: msgs });
        controller.enqueue(encoder.encode(`event: update\ndata: ${payload}\n\n`));
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to read initial state' })}\n\n`));
      }

      // Heartbeat pulse to keep connection alive
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }
        try {
          const disc = await getDiscussionById(id);
          const msgs = await getDiscussionMessages(id);
          const payload = JSON.stringify({ discussion: disc, messages: msgs });
          controller.enqueue(encoder.encode(`event: update\ndata: ${payload}\n\n`));

          if (disc?.status === 'concluded' || disc?.status === 'cancelled') {
            clearInterval(interval);
            if (!isClosed) {
              controller.close();
              isClosed = true;
            }
          }
        } catch {
          clearInterval(interval);
          if (!isClosed) {
            controller.close();
            isClosed = true;
          }
        }
      }, 3000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
