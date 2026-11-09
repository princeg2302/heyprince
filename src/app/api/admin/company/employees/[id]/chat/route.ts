import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getEmployeeById, getCompanyTasks, getAllEmployees } from '@/lib/company/db';
import { getRelevantCompanyMemories, recordCompanyMemory } from '@/lib/company/memory';
import { executeRelevantAgentTool } from '@/lib/company/tools';
import { generateAgentTurnResponse } from '@/lib/company/gemini';
import { sanitizeEmDashes } from '@/lib/ai-content-sanitizer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const allEmployees = await getAllEmployees();
    const employee = allEmployees.find((e) => e.id === id || e.legacy_agent_id === id);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const [tasks, memories] = await Promise.all([
      getCompanyTasks({ assignedTo: employee.id, limit: 10 }),
      getRelevantCompanyMemories({ employeeId: employee.id, limit: 10 }),
    ]);

    return NextResponse.json({
      success: true,
      employee,
      tasks,
      memories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch employee desk data.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty.' }, { status: 400 });
    }

    const cleanInput = message.trim();
    const allEmployees = await getAllEmployees();
    const employee = allEmployees.find((e) => e.id === id || e.legacy_agent_id === id);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    }

    // 1. Record CEO prompt into memory
    try {
      await recordCompanyMemory({
        scope: 'employee',
        department: employee.department,
        employeeId: employee.id,
        category: 'strategy',
        insight: `CEO Directive to ${employee.name}: "${cleanInput.slice(0, 200)}"`,
        confidenceScore: 1.0,
      });
    } catch {}

    // 2. Execute relevant tool if directive asks for audits or telemetry
    let toolResult = null;
    try {
      toolResult = await executeRelevantAgentTool(employee, cleanInput);
    } catch {}

    // 3. Fetch personal memories
    const memories = await getRelevantCompanyMemories({
      department: employee.department,
      employeeId: employee.id,
      limit: 5,
    });
    const memoryContext = memories.map((m) => `• ${m.insight}`).join('\n');

    // 4. Generate direct 1-on-1 in-character response
    const aiResult = await generateAgentTurnResponse({
      speaker: employee,
      discussionTitle: `1-on-1 Desk Briefing: ${employee.name}`,
      discussionObjective: `Direct executive discussion with Prince (CEO) regarding: "${cleanInput}"`,
      recentTranscript: `Prince (CEO): ${cleanInput}`,
      isModerator: employee.id === 'alex_vance',
      isConcludingTurn: false,
      ceoDirective: cleanInput,
      toolResult,
      historicalMemories: memoryContext,
    });

    const replyText = sanitizeEmDashes(aiResult.content.trim());

    // 5. Record response to memory
    try {
      await recordCompanyMemory({
        scope: 'employee',
        department: employee.department,
        employeeId: employee.id,
        category: 'learning',
        insight: `${employee.name} advised CEO: "${replyText.slice(0, 200)}"`,
        confidenceScore: 0.95,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      sender: employee.name,
      senderId: employee.id,
      avatarUrl: employee.avatar_url,
      displayTitle: employee.display_title,
      department: employee.department,
      reply: replyText,
      evidence: aiResult.evidence,
      toolUsed: toolResult?.toolName || null,
    });
  } catch (error: any) {
    console.error('[API /api/admin/company/employees/[id]/chat] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process employee chat.' },
      { status: 500 }
    );
  }
}
