import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, getUsersList, createUser, deleteUsersBulk } from '@/lib/admin-db';

export async function GET() {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await getUsersList();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admins can create users
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Only administrators can create users.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const result = await createUser(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Only administrators can delete users.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const ids: number[] = Array.isArray(body.ids) ? body.ids : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required.' }, { status: 400 });
    }

    // Exclude current user id so admin cannot accidentally delete themselves
    const currentId = typeof user.id === 'number' ? user.id : parseInt(String(user.id), 10);
    const result = await deleteUsersBulk(ids, currentId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
