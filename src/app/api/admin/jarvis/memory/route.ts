import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  getAllMemories,
  saveMemory,
  deleteMemory,
  conductAutonomousSelfStudy,
} from '@/lib/jarvis/memory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const memories = await getAllMemories(category, limit);
    return NextResponse.json({ success: true, memories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, topic, title, content, category, tags, id } = body;

    // Action 1: Autonomous Self-Study Trigger
    if (action === 'study' || action === 'self_study') {
      const newStudy = await conductAutonomousSelfStudy(topic);
      return NextResponse.json({
        success: true,
        message: `JARVIS completed self-study on "${newStudy.title}" and saved insights to permanent memory.`,
        memory: newStudy,
      });
    }

    // Action 2: Delete Memory Item
    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Memory ID is required for deletion' }, { status: 400 });
      }
      await deleteMemory(id);
      return NextResponse.json({ success: true, message: 'Memory entry deleted successfully.' });
    }

    // Action 3: Teach JARVIS a new rule or preference
    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 });
    }

    const saved = await saveMemory({
      category: category || 'teaching',
      title,
      content,
      source: 'prince',
      tags: tags || ['rule', 'prince_teaching'],
      importance: 9,
    });

    return NextResponse.json({
      success: true,
      message: `Committed lesson "${saved.title}" to JARVIS permanent memory vault.`,
      memory: saved,
    });
  } catch (err: any) {
    console.error('[API /api/admin/jarvis/memory] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Memory operation failed.' },
      { status: 500 }
    );
  }
}
