import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  generateDailyProductivityReport,
} from '@/lib/company/productivity-reporter';
import {
  getDailyCompanyReportByDate,
  getLatestDailyCompanyReport,
} from '@/lib/company/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');

  try {
    let report;
    if (dateStr) {
      report = await getDailyCompanyReportByDate(dateStr);
      if (!report) {
        // Try generating on the fly for requested date
        report = await generateDailyProductivityReport({ dateStr });
      }
    } else {
      report = await getLatestDailyCompanyReport();
      if (!report) {
        report = await generateDailyProductivityReport();
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch daily productivity report.' },
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
    const dateStr = body?.dateStr;
    const forceRegenerate = body?.forceRegenerate ?? true;

    const report = await generateDailyProductivityReport({
      dateStr,
      forceRegenerate,
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate productivity report.' },
      { status: 500 }
    );
  }
}
