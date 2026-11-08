import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getAllRooms } from '@/lib/company/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rooms = await getAllRooms();
    return NextResponse.json({ success: true, rooms });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list rooms.' },
      { status: 500 }
    );
  }
}
