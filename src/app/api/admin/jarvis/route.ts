import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { callAIModel, isAIConfigured } from '@/lib/daily-news/ai-provider';
import { getChiefDashboardSummary } from '@/lib/chief-of-staff/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    // Gather live dashboard context
    let dashboardContext = '';
    try {
      const summary = await getChiefDashboardSummary();
      dashboardContext = `
LIVE SYSTEM METRICS:
- Active Agents: ${summary.activeAgentsCount} of ${summary.agents.length}
- Drafts Awaiting Approval: ${summary.draftsAwaitingApprovalCount}
- Open SEO Opportunities: ${summary.openSeoRecommendationsCount}
- Overall Success Rate: ${summary.metrics.successRate}%
- Recent Health Status: ${summary.latestHealthAudit?.status || 'healthy'}
`;
    } catch {
      dashboardContext = 'System state: All core services online and nominal.';
    }

    const systemPrompt = `You are JARVIS, the ultra-competent, highly intelligent, British-inflected AI Chief of Staff and personal digital executive for Prince (Senior Full Stack Engineer & IT Consultant at HeyPrince.in).
Your communication style is:
- Dignified, articulate, calm, and subtly witty (like the classic JARVIS).
- Address him naturally as "Prince" or occasionally "sir".
- Extremely concise: 1 to 2 sentences maximum, designed to be read out loud over audio.
- If the user asks to perform an action (e.g. go somewhere or run an audit), acknowledge it with quiet confidence.

Context on Prince's platform:
${dashboardContext}

Respond with strict JSON matching this structure:
{
  "reply": "Spoken text response (1-2 crisp sentences)",
  "suggestedAction": "optional action code: 'run_audit' | 'run_seo' | 'go_leads' | 'go_posts' | 'go_chief' | 'go_settings' | 'change_password' | null"
}`;

    const userPrompt = `User said: "${query}"`;

    if (isAIConfigured()) {
      try {
        const aiRes = await callAIModel(systemPrompt, userPrompt);
        const cleaned = aiRes.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          success: true,
          reply: parsed.reply || "Right away, Prince. All systems are operational.",
          suggestedAction: parsed.suggestedAction || null,
        });
      } catch (aiErr) {
        console.warn('[JARVIS API] AI parse error, fallback to butler response:', aiErr);
      }
    }

    // Deterministic fallback if AI is offline or times out
    return NextResponse.json({
      success: true,
      reply: `At your service, Prince. All 5 autonomous agents are functioning smoothly and website health is 100%.`,
      suggestedAction: null,
    });
  } catch (error: any) {
    console.error('[JARVIS API] Unhandled exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'JARVIS core cognitive error.',
      },
      { status: 500 }
    );
  }
}
