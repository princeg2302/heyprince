import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { publishArticleToLinkedIn } from '@/lib/linkedin/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const postId = parseInt(body.postId, 10);
    const customCommentary = body.commentary;

    if (!postId || isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: 'Valid postId is required.' },
        { status: 400 }
      );
    }

    const result = await publishArticleToLinkedIn({
      postId,
      customCommentary,
      imageUrl: body.imageUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to publish article to LinkedIn.',
          details: result.details,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article published successfully to personal LinkedIn profile!',
      postUrn: result.postUrn,
      postUrl: result.postUrl,
      endpointUsed: result.endpointUsed,
    });
  } catch (err: any) {
    console.error('[API LinkedIn Publish] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error while publishing.' },
      { status: 500 }
    );
  }
}

