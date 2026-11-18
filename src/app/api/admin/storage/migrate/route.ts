import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { runStorageMigration, getStorageMigrationStatus } from '@/lib/storage/migrate';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getStorageMigrationStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch migration status' },
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
    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);
    const limit = typeof body?.limit === 'number' ? body.limit : 500;

    const summary = await runStorageMigration({ dryRun, limit });

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('[StorageMigrationAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Storage migration encountered an unhandled error' },
      { status: 500 }
    );
  }
}
