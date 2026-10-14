import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { disconnectLinkedInConnection } from '@/lib/linkedin/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await disconnectLinkedInConnection();
  return NextResponse.json({ success: true, message: 'LinkedIn account disconnected.' });
}

