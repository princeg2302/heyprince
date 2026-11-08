import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getCompanyProposals, createProposal } from '@/lib/company/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as any;

  try {
    const proposals = await getCompanyProposals(status || undefined);
    return NextResponse.json({ success: true, proposals });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list proposals.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, sponsoredBy, proposalType, businessJustification, actionPayload, estimatedCostUsd } = body;

    if (!title || !sponsoredBy || !proposalType || !businessJustification) {
      return NextResponse.json(
        { success: false, error: 'Missing required proposal fields.' },
        { status: 400 }
      );
    }

    const proposal = await createProposal({
      title,
      sponsoredBy,
      proposalType,
      businessJustification,
      actionPayload: actionPayload || {},
      estimatedCostUsd: estimatedCostUsd || 0,
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create proposal.' },
      { status: 500 }
    );
  }
}
