import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getSocialSharesForPost } from '@/lib/social/db';
import { query } from '@/lib/outreach/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const postId = parseInt(searchParams.get('postId') || '0', 10);

  if (!postId || isNaN(postId)) {
    return NextResponse.json(
      { success: false, error: 'Valid postId query parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const socialShares = await getSocialSharesForPost(postId);

    let linkedInShares: any[] = [];
    try {
      linkedInShares = await query(
        `SELECT * FROM linkedin_post_shares WHERE post_id = $1 ORDER BY created_at DESC;`,
        [postId]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      postId,
      socialShares,
      linkedInShares,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error fetching share history.' },
      { status: 500 }
    );
  }
}
