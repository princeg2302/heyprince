import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, getServicesList, createService, deleteServicesBulk } from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const publishedParam = searchParams.get('published');
  const published = publishedParam !== null ? publishedParam === 'true' : undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const result = await getServicesList({ search, published, page, limit });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Title and slug are required.' }, { status: 400 });
    }

    const result = await createService(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, service: result.service });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const ids: number[] = Array.isArray(body.ids) ? body.ids : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required.' }, { status: 400 });
    }

    const result = await deleteServicesBulk(ids);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
