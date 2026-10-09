import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, getLeadsList } from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const result = await getLeadsList({ search, status, page, limit });
  return NextResponse.json(result);
}
