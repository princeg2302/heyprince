import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, getUserById, updateUser, deleteUser } from '@/lib/admin-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const targetUser = await getUserById(numId);
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user: targetUser });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentAdmin();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  // Editors can only update their own profile; admins can update anyone
  if (currentUser.role !== 'admin' && currentUser.id !== numId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // Non-admins cannot elevate their own role
    if (currentUser.role !== 'admin') {
      delete body.role;
    }

    const result = await updateUser(numId, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentAdmin();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Only administrators can delete user accounts.' }, { status: 403 });
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  if (currentUser.id === numId) {
    return NextResponse.json({ error: 'You cannot delete your own active administrator account.' }, { status: 400 });
  }

  const result = await deleteUser(numId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
