import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, getCategoriesList, createCategory, deleteCategoriesBulk } from '@/lib/admin-db';

export async function GET() {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await getCategoriesList();
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Category title is required.' }, { status: 400 });
    }

    const title = body.title.trim();
    const slug = (body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const result = await createCategory({
      title,
      slug,
      description: body.description?.trim() || '',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, category: result.category });
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

    const result = await deleteCategoriesBulk(ids);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
