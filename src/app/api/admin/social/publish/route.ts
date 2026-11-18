import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { publishToAllSocialPlatforms } from '@/lib/social/publisher';
import { SocialPlatform } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const postId = parseInt(body.postId, 10);
    const platforms: SocialPlatform[] | undefined = Array.isArray(body.platforms)
      ? body.platforms
      : undefined;
    const customText: string | undefined = body.customText || body.text;

    if (!postId || isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: 'Valid postId integer is required.' },
        { status: 400 }
      );
    }

    const multiResult = await publishToAllSocialPlatforms(
      {
        postId,
        customText,
        imageUrl: body.imageUrl,
      },
      platforms
    );

    const message = multiResult.publishedCount > 0
      ? `Successfully published to ${multiResult.publishedCount} platform${multiResult.publishedCount > 1 ? 's' : ''}!`
      : multiResult.skippedCount > 0
      ? 'Selected platforms are not configured with API credentials.'
      : 'Failed to publish to selected social platforms.';

    return NextResponse.json({
      success: multiResult.success,
      message,
      postId: multiResult.postId,
      publishedCount: multiResult.publishedCount,
      failedCount: multiResult.failedCount,
      skippedCount: multiResult.skippedCount,
      results: multiResult.results,
    });
  } catch (err: any) {
    console.error('[API Social Publish] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error while publishing.' },
      { status: 500 }
    );
  }
}
