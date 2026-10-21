import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  GLOBAL_SECTORS,
  runFullGlobalBrainSurveillance,
  scanGlobalSector,
  IntelligenceSector,
  extractCleanSpokenText,
} from '@/lib/jarvis/global-brain';
import { getAllMemories } from '@/lib/jarvis/memory';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sector = searchParams.get('sector') as IntelligenceSector | null;

  try {
    const allMemories = await getAllMemories('global_intelligence', 30);
    const filtered = sector
      ? allMemories.filter((m) => m.metadata?.sector === sector)
      : allMemories;

    return NextResponse.json({
      success: true,
      sectors: GLOBAL_SECTORS,
      briefings: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch global intelligence' },
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
    const body = await request.json();
    const { action, sector, topicHint } = body;

    // Action 1: Scan a single specific sector
    if (sector && Object.keys(GLOBAL_SECTORS).includes(sector)) {
      const result = await scanGlobalSector(sector as IntelligenceSector, topicHint);
      return NextResponse.json({
        success: true,
        message: `Surveillance scan completed for ${result.sectorLabel}.`,
        briefing: result,
      });
    }

    // Action 2: Run full 24/7 surveillance cycle across all 6 sectors
    const fullReport = await runFullGlobalBrainSurveillance();
    fullReport.executiveBriefing = extractCleanSpokenText(fullReport.executiveBriefing);

    return NextResponse.json({
      success: true,
      message: `24/7 Global Surveillance complete across all ${fullReport.totalSectorsScanned} sectors.`,
      report: fullReport,
    });
  } catch (err: any) {
    console.error('[API /api/admin/jarvis/global-intelligence] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Global surveillance scan failed.' },
      { status: 500 }
    );
  }
}

