import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { runLeadScoutDiscovery } from '@/lib/chief-of-staff/agents/lead-scout';
import { deduplicateExistingBusinesses, query } from '@/lib/outreach/db';
import { ChiefContentDraft } from '@/lib/chief-of-staff/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const scoutDrafts = await query<ChiefContentDraft>(
      `SELECT * FROM chief_content_drafts WHERE draft_type = 'outreach_draft' ORDER BY created_at DESC LIMIT 50;`
    );
    const totalDiscovered = await query<{ count: string }>(`SELECT COUNT(*) as count FROM businesses;`);
    const totalAudited = await query<{ count: string }>(`SELECT COUNT(*) as count FROM businesses WHERE status = 'AUDITED';`);

    return NextResponse.json({
      success: true,
      drafts: scoutDrafts,
      stats: {
        totalBusinesses: parseInt(totalDiscovered[0]?.count || '0', 10),
        totalAudited: parseInt(totalAudited[0]?.count || '0', 10),
        totalProposalsGenerated: scoutDrafts.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'deduplicate') {
      const res = await deduplicateExistingBusinesses();
      return NextResponse.json({
        success: true,
        message: `Deduplication complete. Removed ${res.duplicatesRemoved} duplicate business records.`,
        duplicatesRemoved: res.duplicatesRemoved,
      });
    }

    // Default action: Run Lead Scout discovery & proposal drafting
    const scoutResult = await runLeadScoutDiscovery();
    return NextResponse.json({
      success: true,
      message: scoutResult.summary,
      leadsDiscovered: scoutResult.leadsDiscovered,
      draftsCreated: scoutResult.draftsCreated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
