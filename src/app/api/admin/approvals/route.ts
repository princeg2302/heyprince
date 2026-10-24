import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getDrafts } from '@/lib/chief-of-staff/db';
import { getRecentDailyRuns } from '@/lib/daily-news/db';

export const dynamic = 'force-dynamic';

export interface UnifiedApprovalItem {
  id: string;
  numericId?: number;
  sourceType: 'chief' | 'news' | 'outreach';
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
  targetUrl?: string;
  // Lead Outreach & Proposal Specific fields
  isOutreachProposal?: boolean;
  businessName?: string;
  domain?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactName?: string;
  phone?: string;
  whatsappUrl?: string;
  recommendedChannel?: string;
  leadScore?: number;
  confidenceLevel?: number;
  evidence?: string[];
  likelyNeeds?: string;
  recommendedService?: string;
  proposedNextAction?: string;
  personalizedEmailSubject?: string;
  personalizedEmailBody?: string;
  whatsappPitch?: string;
  sendStatus?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  raw: any;
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [chiefDrafts, recentNewsRuns] = await Promise.all([
      getDrafts('pending_approval', 100),
      getRecentDailyRuns(50),
    ]);

    const unifiedList: UnifiedApprovalItem[] = [];

    // 1. Process Chief of Staff Drafts (Both Content & Lead Proposals)
    for (const d of chiefDrafts) {
      const meta = d.metadata || {};
      const isOutreach =
        d.draft_type === 'outreach_draft' ||
        d.draft_type === 'outreach_proposal' ||
        d.draft_type === 'client_proposal';

      if (isOutreach) {
        const evidenceArr = Array.isArray(meta.evidence)
          ? meta.evidence
          : Array.isArray(meta.scoreBreakdown)
          ? meta.scoreBreakdown
          : ['Slow server response and outdated CMS detected'];

        unifiedList.push({
          id: d.id,
          sourceType: 'outreach',
          draftType: d.draft_type,
          title: d.title,
          excerpt: d.excerpt || '',
          slug: meta.domain || meta.slug || '',
          readMins: meta.readMins || '1 min review',
          categoryName: meta.industry || 'Lead Opportunity',
          tags: ['Client Outreach', meta.recommendedService || 'Modernization'].filter(Boolean),
          sections: [
            {
              heading: 'Personalized Outreach Pitch',
              paragraphs: d.content.split('\n\n').filter(Boolean),
            },
          ],
          createdAt: d.created_at,
          status: d.status,
          targetUrl: d.target_url || meta.websiteUrl,
          isOutreachProposal: true,
          businessName: meta.companyName || meta.name || d.title,
          domain: meta.domain,
          websiteUrl: meta.websiteUrl || (meta.domain ? `https://${meta.domain}` : undefined),
          contactEmail: meta.contactEmail || meta.email,
          contactName: meta.contactName || meta.name,
          phone: meta.phone,
          whatsappUrl: meta.whatsappUrl,
          recommendedChannel: meta.recommendedChannel || 'email',
          leadScore: meta.leadScore || meta.score || 85,
          confidenceLevel: meta.confidenceLevel || 88,
          evidence: evidenceArr,
          likelyNeeds: meta.likelyNeeds || 'Frontend modernization and performance tuning',
          recommendedService: meta.recommendedService || 'Next.js Frontend Architecture & Speed Optimization',
          proposedNextAction: meta.proposedNextAction || 'Send 1-on-1 Strategy Pitch via Email',
          personalizedEmailSubject: meta.personalizedEmailSubject || `Website performance ideas for ${meta.companyName || meta.domain}`,
          personalizedEmailBody: meta.personalizedEmailBody || d.content,
          whatsappPitch: meta.whatsappPitch || meta.personalizedWhatsAppMessage,
          sendStatus: meta.send_status || 'pending',
          idempotencyKey: d.idempotency_key || meta.idempotency_key,
          metadata: {
            ...meta,
            company_name: meta.companyName || meta.name || d.title,
            domain: meta.domain,
            contact_email: meta.contactEmail || meta.email,
            recommended_service: meta.recommendedService || 'Modernization',
            audit_evidence: evidenceArr,
            fit_score: meta.leadScore || 85,
            confidence: meta.confidenceLevel || 88,
          },
          raw: d,
        });
      } else {
        // Public blog / service page / website content
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
          slug: meta.slug || d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          readMins: meta.readMins || '4 min read',
          categoryName: meta.categoryName || 'Engineering & AI',
          tags: meta.tags || ['Engineering', 'Architecture'],
          sections,
          linkedinPost: meta.linkedinPost || '',
          createdAt: d.created_at,
          status: d.status,
          targetUrl: d.target_url,
          isOutreachProposal: false,
          metadata: meta,
          raw: d,
        });
      }
    }

    // 2. Process News Automation Draft Runs
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
          isOutreachProposal: false,
          raw: r,
        });
      }
    }

    // Sort latest first
    unifiedList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      items: unifiedList,
      totalCount: unifiedList.length,
      chiefCount: unifiedList.filter((i) => i.sourceType === 'chief').length,
      newsCount: unifiedList.filter((i) => i.sourceType === 'news').length,
      outreachCount: unifiedList.filter((i) => i.sourceType === 'outreach').length,
    });
  } catch (error: any) {
    console.error('[API /api/admin/approvals] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch pending approval items.' },
      { status: 500 }
    );
  }
}
