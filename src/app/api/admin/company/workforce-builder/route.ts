import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { createOrUpdateEmployee, createProposal } from '@/lib/company/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      displayTitle,
      department,
      capabilityGap,
      businessJustification,
      personalityArchetype,
      systemPromptOverlay,
      allowedTools,
      modelPreference,
      estimatedCostUsd,
    } = body;

    if (!name || !displayTitle || !department || !capabilityGap) {
      return NextResponse.json(
        { success: false, error: 'Missing name, displayTitle, department, or capabilityGap.' },
        { status: 400 }
      );
    }

    const agentId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    // 1. Create draft employee record in 'offline' state
    const draftEmployee = await createOrUpdateEmployee({
      id: agentId,
      name,
      display_title: displayTitle,
      department,
      avatar_url: `/assets/avatars/${agentId}.svg`,
      bio: `Specialized AI agent addressing: ${capabilityGap}`,
      personality_archetype: personalityArchetype || 'Pragmatic & Task-focused',
      system_prompt_overlay: systemPromptOverlay || `You are ${name}, ${displayTitle} at HeyPrince.`,
      model_preference: modelPreference || 'gemini-3.5-flash',
      status: 'offline',
      current_activity: 'Draft configuration awaiting CEO activation.',
      tool_permissions: {
        allowed_tools: allowedTools || ['read_memory'],
        requires_approval: ['publish_content', 'send_external_email', 'deploy_code'],
      },
    });

    // 2. Queue formal CEO proposal
    const proposal = await createProposal({
      sponsoredBy: 'alex_vance',
      title: `Workforce Expansion: Activate ${name} (${displayTitle})`,
      proposalType: 'new_agent_activation',
      businessJustification: `${businessJustification || 'Fills strategic capability gap.'}\nCapability Gap: ${capabilityGap}`,
      actionPayload: {
        agentId,
        name,
        displayTitle,
        department,
        capabilityGap,
      },
      estimatedCostUsd: estimatedCostUsd || 0,
    });

    return NextResponse.json({
      success: true,
      employee: draftEmployee,
      proposal,
      message: `Employee "${name}" drafted and CEO approval proposal queued.`,
    });
  } catch (error: any) {
    console.error('[API /api/admin/company/workforce-builder] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to draft new employee.' },
      { status: 500 }
    );
  }
}
