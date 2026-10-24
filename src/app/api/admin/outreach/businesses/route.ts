import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { getBusinesses, deleteBusinessesBulk } from '@/lib/outreach/db';
import { BusinessStatus } from '@/lib/outreach/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const countryCode = searchParams.get('country') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = (searchParams.get('status') as BusinessStatus) || undefined;
    const search = searchParams.get('q') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { items, total } = await getBusinesses({
      countryCode,
      category,
      status,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, items, total, limit, offset });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'ids array is required.' }, { status: 400 });
    }

    const result = await deleteBusinessesBulk(ids);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

