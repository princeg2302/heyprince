import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getDrafts } from '@/lib/chief-of-staff/db';
import { getRecentDailyRuns } from '@/lib/daily-news/db';

export const dynamic = 'force-dynamic';

export interface UnifiedApprovalItem {
  id: string;
  numericId?: number;
  sourceType: 'chief' | 'news';
  draftType: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  slug: string;
  readMins: string;
  categoryName: string;
  tags: string[];
  sections: Array<{
    heading: string;
    quote?: string;
    proTip?: string;
    paragraphs: string[];
    bulletPoints?: string[];
  }>;
  linkedinPost?: string;
  createdAt: string;
  status: string;
  raw: any;
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [chiefDrafts, recentNewsRuns] = await Promise.all([
      getDrafts('pending_approval', 50),
      getRecentDailyRuns(30),
    ]);

    const unifiedList: UnifiedApprovalItem[] = [];

    // 1. Process Chief of Staff Drafts
    for (const d of chiefDrafts) {
      const meta = d.metadata || {};
      const rawSections = meta.rawSections || [];
      const sections =
        rawSections.length > 0
          ? rawSections
          : d.content
          ? [
              {
                heading: 'Draft Content',
                paragraphs: d.content.split('\n\n').filter(Boolean),
              },
            ]
          : [];

      unifiedList.push({
        id: d.id,
        sourceType: 'chief',
        draftType: d.draft_type,
        title: d.title,
        excerpt: d.excerpt || '',
        coverImage: meta.coverImage || meta.featured_image_url || '/assets/blog/photo1.webp',
        slug: meta.slug || '',
        readMins: meta.readMins || '5 min',
        categoryName: meta.category || 'Technology & Engineering',
        tags: meta.tags || [],
        sections,
        linkedinPost: meta.linkedinPost || meta.linkedinCopy || '',
        createdAt: d.created_at,
        status: d.status,
        raw: d,
      });
    }

    // 2. Process News Automation Draft Runs (runs with articleContent ready but not published)
    for (const r of recentNewsRuns) {
      if (!r.postId && r.articleContent && r.articleTitle) {
        const content = r.articleContent || {};
        unifiedList.push({
          id: String(r.id),
          numericId: r.id,
          sourceType: 'news',
          draftType: 'scheduled_blog',
          title: content.title || r.articleTitle,
          excerpt: content.excerpt || r.articleExcerpt || '',
          coverImage: content.coverImage || '/assets/blog/photo1.webp',
          slug: content.slug || r.articleSlug || '',
          readMins: content.readMins || '5 min',
          categoryName: content.categoryName || 'Tech & AI News',
          tags: content.tags || [],
          sections: content.sections || [],
          linkedinPost: content.linkedinPost || r.linkedinCommentary || '',
          createdAt: r.startedAt,
          status: 'pending_approval',
          raw: r,
        });
      }
    }

    // Sort newest first
    unifiedList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      count: unifiedList.length,
      items: unifiedList,
    });
  } catch (error: any) {
    console.error('[API /api/admin/approvals] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch pending approvals.' },
      { status: 500 }
    );
  }
}

