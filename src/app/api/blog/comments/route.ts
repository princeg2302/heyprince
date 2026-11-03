import { NextRequest, NextResponse } from 'next/server';
import {
  getCommentsTree,
  createComment,
  checkRateLimit,
  recordRateLimitAction,
} from '@/lib/discussions/db';
import {
  sanitizePlainText,
  checkMaliciousPatterns,
  getClientHash,
} from '@/lib/discussions/security';

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
    const data = await getCommentsTree(slug, clientHash);
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[Blog Comments API] GET error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve comments.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Cyber Defense: Honeypot trap (automated bots fill hidden fields)
    if (body.website_hp_check || body.website_url_trap) {
      console.warn('[Anti-Spam] Bot detected via honeypot trap.');
      return NextResponse.json({ success: true, message: 'Comment submitted for review.' });
    }

    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const parentId = typeof body.parentId === 'number' ? body.parentId : null;
    const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : '';
    const authorEmail = typeof body.authorEmail === 'string' ? body.authorEmail.trim() : '';
    const rawContent = typeof body.content === 'string' ? body.content.trim() : '';
    const securityAnswer = typeof body.securityAnswer === 'string' ? body.securityAnswer.trim() : '';
    const expectedAnswer = typeof body.expectedAnswer === 'string' ? body.expectedAnswer.trim() : '';

    // 2. Anti-Bot Security Math Challenge Check
    if (expectedAnswer && securityAnswer !== expectedAnswer) {
      return NextResponse.json(
        { success: false, error: 'Security check failed. Please verify the math answer.' },
        { status: 400 }
      );
    }

    // 3. Validation: Required fields and lengths
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Post slug is missing.' }, { status: 400 });
    }

    if (!authorName || authorName.length < 2 || authorName.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Please enter a name between 2 and 50 characters.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!authorEmail || !emailRegex.test(authorEmail) || authorEmail.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!rawContent || rawContent.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Comment must be at least 3 characters.' },
        { status: 400 }
      );
    }

    if (rawContent.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Comment cannot exceed 2,000 characters.' },
        { status: 400 }
      );
    }

    const { ip, ua, clientHash } = getIpAndUserAgent(req);

    // 4. Rate Limiting: Max 3 comments per 60 seconds per client
    const isRateAllowed = await checkRateLimit(clientHash, 'comment', 3, 60);
    if (!isRateAllowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a minute before posting another comment.' },
        { status: 429 }
      );
    }

    // 5. Cyber-Attack & Malicious Pattern Screening (SQLi / XSS / Link Farm Spam)
    const securityCheck = checkMaliciousPatterns(`${authorName} ${rawContent}`);
    if (!securityCheck.isClean) {
      console.warn(`[Anti-Spam] Comment blocked by pattern check: ${securityCheck.reason}`);
      return NextResponse.json(
        { success: false, error: securityCheck.reason || 'Comment rejected due to security policy.' },
        { status: 400 }
      );
    }

    // 6. Strict Content Sanitization
    const sanitizedName = sanitizePlainText(authorName);
    const sanitizedContent = sanitizePlainText(rawContent);

    // 7. Author badge verification: Check if email matches site owner or admin
    const isAuthor =
      authorEmail.toLowerCase() === 'contact@heyprince.in' ||
      authorEmail.toLowerCase() === 'prince@heyprince.in';

    // 8. Record Rate Limit Action
    await recordRateLimitAction(clientHash, 'comment');

    // 9. Persist to Database with Parameterized Query
    const created = await createComment({
      postSlug: slug,
      parentId,
      authorName: sanitizedName,
      authorEmail,
      content: sanitizedContent,
      ipHash: clientHash,
      userAgent: ua.slice(0, 500),
      isAuthor,
    });

    return NextResponse.json({
      success: true,
      message: 'Comment posted successfully.',
      comment: created,
    });
  } catch (err: any) {
    console.error('[Blog Comments API] POST error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while posting your comment.' },
      { status: 500 }
    );
  }
}
