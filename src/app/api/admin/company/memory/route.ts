import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { queryCompanyMemory, recordCompanyMemory, deleteCompanyMemory } from '@/lib/company/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') as any;
  const category = searchParams.get('category') as any;
  const employeeId = searchParams.get('employeeId') || undefined;

  try {
    const memory = await queryCompanyMemory({ scope, category, employeeId, limit: 50 });
    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to query memory.' },
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
    const { scope, department, employeeId, discussionId, category, insight, metadata, confidenceScore } = body;

    if (!scope || !category || !insight) {
      return NextResponse.json(
        { success: false, error: 'Missing scope, category, or insight.' },
        { status: 400 }
      );
    }

    const item = await recordCompanyMemory({
      scope,
      department,
      employeeId,
      discussionId,
      category,
      insight,
      metadata: metadata || {},
      confidenceScore: confidenceScore || 1.0,
    });

    return NextResponse.json({ success: true, memory: item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to record memory.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || undefined;

  try {
    const success = await deleteCompanyMemory(id);
    return NextResponse.json({
      success,
      message: id === 'all' || !id ? 'All memory cleared.' : 'Memory entry deleted.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete memory.' },
      { status: 500 }
    );
  }
}
