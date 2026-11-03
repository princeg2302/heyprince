import { NextRequest, NextResponse } from 'next/server';
import { getBlogLikes, toggleBlogLike, checkRateLimit, recordRateLimitAction } from '@/lib/discussions/db';
import { getClientHash } from '@/lib/discussions/security';

export const dynamic = 'force-dynamic';

function getIpAndUserAgent(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';
  const ua = req.headers.get('user-agent') || 'anonymous';
  return { ip, ua, clientHash: getClientHash(ip, ua) };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug')?.trim();

  if (!slug) {
    return NextResponse.json({ success: false, error: 'Slug parameter is required.' }, { status: 400 });
  }

  const { clientHash } = getIpAndUserAgent(req);
  try {
    const data = await getBlogLikes(slug, clientHash);
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[Blog Likes API] GET error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch likes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Valid post slug is required.' }, { status: 400 });
    }

    const { ip, ua, clientHash } = getIpAndUserAgent(req);

    // Rate limit: Max 10 like operations per 10 seconds per client
    const allowed = await checkRateLimit(clientHash, 'like', 10, 10);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    await recordRateLimitAction(clientHash, 'like');
    const data = await toggleBlogLike(slug, clientHash);
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[Blog Likes API] POST error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update like status' }, { status: 500 });
  }
}

