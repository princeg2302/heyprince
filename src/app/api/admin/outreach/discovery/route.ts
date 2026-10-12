import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { getDiscoveryJobs } from '@/lib/outreach/db';
import { discoveryService } from '@/lib/outreach/discovery/service';
import { DiscoveryJobCreateSchema } from '@/lib/outreach/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const jobs = await getDiscoveryJobs(50);
    return NextResponse.json({ success: true, jobs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parse = DiscoveryJobCreateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const result = await discoveryService.executeJob(parse.data);
    return NextResponse.json({
      success: true,
      message: `Discovery job completed. Discovered ${result.totalFound} businesses (${result.totalInserted} new, ${result.totalDuplicates} duplicates).`,
      job: result.job,
      stats: {
        totalFound: result.totalFound,
        totalInserted: result.totalInserted,
        totalDuplicates: result.totalDuplicates,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

