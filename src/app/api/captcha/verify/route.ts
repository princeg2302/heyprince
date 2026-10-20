import { NextRequest, NextResponse } from 'next/server';
import { verifyCaptchaChallenge } from '@/lib/captcha/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function setCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  return response;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const res = new NextResponse(null, { status: 204 });
  return setCorsHeaders(res, origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer');
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  try {
    const body = await request.json().catch(() => ({}));
    const challengeId = body.challengeId;
    const answer = body.answer;
    const signedToken = body.signedToken;
    const purpose = body.purpose || 'contact-form';
    const siteKey = body.siteKey;
    const elapsedMs = typeof body.elapsedMs === 'number' ? body.elapsedMs : undefined;

    const result = await verifyCaptchaChallenge({
      challengeId,
      answer,
      signedToken,
      purpose,
      siteKey,
      clientIp,
      elapsedMs,
    });

    if (!result.success) {
      const status = result.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;
      const res = NextResponse.json(result, { status });
      return setCorsHeaders(res, origin);
    }

    const res = NextResponse.json(result, { status: 200 });
    return setCorsHeaders(res, origin);
  } catch (error: any) {
    console.error('[API /api/captcha/verify] Error:', error);
    const res = NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while verifying challenge.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
    return setCorsHeaders(res, origin);
  }
}

