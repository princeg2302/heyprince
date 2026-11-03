import { NextRequest, NextResponse } from 'next/server';
import { toggleCommentLike, checkRateLimit, recordRateLimitAction } from '@/lib/discussions/db';
import { getClientHash } from '@/lib/discussions/security';

export const dynamic = 'force-dynamic';

function getIpAndUserAgent(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';
  const ua = req.headers.get('user-agent') || 'anonymous';
  return { ip, ua, clientHash: getClientHash(ip, ua) };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const commentId = typeof body.commentId === 'number' ? body.commentId : null;

    if (!commentId) {
      return NextResponse.json({ success: false, error: 'Valid comment ID is required.' }, { status: 400 });
    }

    const { clientHash } = getIpAndUserAgent(req);

    // Rate limit: Max 15 comment like operations per 10 seconds
    const allowed = await checkRateLimit(clientHash, 'like', 15, 10);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Please slow down.' }, { status: 429 });
    }

    await recordRateLimitAction(clientHash, 'like');
    const result = await toggleCommentLike(commentId, clientHash);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Comment Like API] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update like status' }, { status: 500 });
  }
}
