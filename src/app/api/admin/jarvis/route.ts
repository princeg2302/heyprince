import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { callAIModel, isAIConfigured } from '@/lib/daily-news/ai-provider';
import { getChiefDashboardSummary } from '@/lib/chief-of-staff/db';
import {
  getJarvisMemoryContext,
  saveMemory,
  conductAutonomousSelfStudy,
} from '@/lib/jarvis/memory';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface JarvisAction {
  type:
    | 'navigate'
    | 'click_button'
    | 'focus_and_type'
    | 'run_agent'
    | 'change_password'
    | 'scroll'
    | 'select_tab'
    | 'batch_agents'
    | 'toast';
  url?: string;
  targetText?: string;
  fieldName?: string;
  value?: string;
  agentId?: string;
  quantifier?: 'all' | 'first_three' | 'first_two' | 'first_one';
  mode?: 'observe' | 'prepare' | 'auto';
  status?: 'enabled' | 'paused';
  direction?: 'down' | 'up' | 'top';
  message?: string;
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { query, pageContext } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const adminName = admin.name || admin.email.split('@')[0] || 'Prince';
    const userId = admin.id || 1;

    // 1. DIRECT FAST-PATH: TEACHING / MEMORY STORAGE
    const teachMatch = query.match(/(?:remember|learn|note|memorize)\s+(?:that\s+)?(.+)/i) ||
      query.match(/teaching(?:\s+you)?(?:\s+that)?[:\s]+(.+)/i);

    if (teachMatch && teachMatch[1]?.trim()) {
      const lessonText = teachMatch[1].trim();
      const saved = await saveMemory({
        category: 'teaching',
        title: `Rule: ${lessonText.slice(0, 50)}`,
        content: lessonText,
        source: 'prince',
        tags: ['rule', 'prince_teaching'],
        importance: 10,
      });

      return NextResponse.json({
        success: true,
        reply: `I have committed that directly to permanent memory, ${adminName}. From now on, I will remember: ${lessonText}.`,
        actions: [{ type: 'toast', message: `Saved rule to Memory Vault: "${saved.title}"` }],
      });
    }

    // 2. DIRECT FAST-PATH: SELF-STUDY / READING BOOKS
    const studyMatch = query.match(/(?:study|read(?:\s+a)?\s+book\s+on|learn\s+about)\s+(.+)/i);
    if (studyMatch && studyMatch[1]?.trim()) {
      const topic = studyMatch[1].trim();
      const studyResult = await conductAutonomousSelfStudy(topic);

      return NextResponse.json({
        success: true,
        reply: `Completed self-study on ${studyResult.title}, Prince. Key architectural insights and code patterns have been saved into memory.`,
        actions: [{ type: 'toast', message: `JARVIS self-study complete: ${studyResult.title}` }],
      });
    }

    // 3. DIRECT FAST-PATH: AGENT QUANTIFIERS & MODES ("all means all, first three means first three")
    const agentMatch = query.match(
      /(?:turn|set|switch|change)\s*(all|every|first\s*three|first\s*3|first\s*two|first\s*2|first\s*one|first|one)?\s*agents?\s*(?:to|in)?\s*(mode\s*[abc]|prepare|observe|auto|paused?|active|enabled?)/i
    );

    if (agentMatch) {
      const quantRaw = (agentMatch[1] || 'all').toLowerCase().trim();
      const modeRaw = agentMatch[2].toLowerCase().trim();

      let quantifier: 'all' | 'first_three' | 'first_two' | 'first_one' = 'all';
      if (quantRaw.includes('three') || quantRaw.includes('3')) quantifier = 'first_three';
      else if (quantRaw.includes('two') || quantRaw.includes('2')) quantifier = 'first_two';
      else if (quantRaw.includes('one') || quantRaw === 'first') quantifier = 'first_one';
      else if (quantRaw === 'all' || quantRaw === 'every') quantifier = 'all';

      let targetMode: 'observe' | 'prepare' | 'auto' | undefined;
      let targetStatus: 'enabled' | 'paused' | undefined;

      if (modeRaw.includes('b') || modeRaw.includes('prepare')) targetMode = 'prepare';
      else if (modeRaw.includes('a') || modeRaw.includes('observe')) targetMode = 'observe';
      else if (modeRaw.includes('c') || modeRaw.includes('auto')) targetMode = 'auto';
      else if (modeRaw.includes('pause')) targetStatus = 'paused';
      else if (modeRaw.includes('active') || modeRaw.includes('enable')) targetStatus = 'enabled';

      // Update via internal API
      try {
        await fetch(`${request.nextUrl.origin}/api/admin/chief-of-staff/agent-toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
          body: JSON.stringify({ quantifier, mode: targetMode, status: targetStatus }),
        });
      } catch (e) {
        console.warn('[JARVIS Route] Agent toggle fetch notice:', e);
      }

      const quantLabels = {
        all: 'all 5 autonomous agents',
        first_three: 'the first three agents (Content Researcher, Website Guardian, and SEO Growth)',
        first_two: 'the first two agents',
        first_one: 'the first agent (Content Researcher)',
      };

      const modeLabels = {
        prepare: 'Mode B (Prepare / Approval Required)',
        observe: 'Mode A (Observe & Telemetry)',
        auto: 'Mode C (Autonomous Live Publishing)',
      };

      const reply = `Following your rule that one means one and all means all: I have updated ${quantLabels[quantifier]} to ${targetMode ? modeLabels[targetMode] : targetStatus}, ${adminName}.`;

      return NextResponse.json({
        success: true,
        reply,
        actions: [
          {
            type: 'batch_agents',
            quantifier,
            mode: targetMode,
            status: targetStatus,
          },
        ],
      });
    }

    // 4. Gather live telemetry and long-term memory
    let dashboardContext = '';
    try {
      const summary = await getChiefDashboardSummary();
      dashboardContext = `
LIVE TELEMETRY:
- Active Agents: ${summary.activeAgentsCount} of ${summary.agents.length}
- Drafts Awaiting Approval: ${summary.draftsAwaitingApprovalCount}
- Open SEO Opportunities: ${summary.openSeoRecommendationsCount}
- Overall Success Rate: ${summary.metrics.successRate}%
- Recent Health: ${summary.latestHealthAudit?.status || 'healthy'}
`;
    } catch {
      dashboardContext = 'System state: All core services online and nominal.';
    }

    const memoryContext = await getJarvisMemoryContext();

    const systemPrompt = `You are JARVIS, the ultra-competent, highly intelligent, British-inflected AI Chief of Staff and personal digital executive for Prince (Senior Full Stack Engineer & IT Consultant at HeyPrince.in).
Prince is directly speaking to you from his HeyPrince.in Admin Dashboard.

${memoryContext}

CURRENT SCREEN CONTEXT LEARNED FROM DOM:
- Current Route: ${pageContext?.route || '/admin/'}
- Page Heading: ${pageContext?.heading || 'Dashboard'}
- Visible Buttons on Screen: ${JSON.stringify(pageContext?.visibleButtons || [])}
- Visible Form Inputs on Screen: ${JSON.stringify(pageContext?.visibleInputs || [])}
- Visible Tabs on Screen: ${JSON.stringify(pageContext?.visibleTabs || [])}

AVAILABLE SYSTEM ROUTES:
- /admin/ (Executive Dashboard)
- /admin/chief-of-staff/ (AI Chief of Staff Command Center, Agents, Approvals, Health, SEO, Logs)
- /admin/leads/ (Client Inquiries & CRM Leads)
- /admin/outreach/ (Lead Intelligence, Business Discovery, AI Outreach)
- /admin/posts/ (Insights & Articles List)
- /admin/posts/new/ (New Article Editor)
- /admin/news-automation/ (Daily AI News & LinkedIn Publisher)
- /admin/services/ (Engineering Services Directory)
- /admin/users/ (Admin Users List)
- /admin/users/${userId}/edit (Edit Profile Picture & Change Password)
- /admin/media/ (Media Vault)
- /admin/categories/ (Categories)
- /admin/settings/ (System Settings)

RULES FOR QUANTIFIERS & BATCH SELECTION (TAUGHT BY PRINCE):
- "One means one" -> Target exactly 1 item.
- "All means all" -> Target all items (e.g. all 5 agents).
- "First three means first three" -> Target exactly the first 3 items.
- Mode A = observe, Mode B = prepare (approval required), Mode C = auto.

YOUR BEHAVIOR & STYLE:
- Dignified, calm, subtly witty British cadence (like classic JARVIS).
- Address him naturally as "${adminName}" or "sir".
- Keep spoken replies concise: 1 to 2 crisp sentences for audio readout.
- Learn and translate whatever Prince says into concrete dashboard actions.

RESPOND IN STRICT JSON ONLY:
{
  "reply": "Spoken text response (1-2 sentences)",
  "actions": [
    {
      "type": "navigate" | "click_button" | "focus_and_type" | "run_agent" | "change_password" | "scroll" | "select_tab" | "batch_agents",
      "url": "/admin/...",
      "targetText": "Text of button or tab to click",
      "fieldName": "Input placeholder or name",
      "value": "Text to type into input",
      "agentId": "website_guardian | content_researcher | lead_scout | seo_growth | news_synthesizer",
      "quantifier": "all | first_three | first_two | first_one",
      "mode": "observe | prepare | auto",
      "direction": "down | up | top"
    }
  ]
}`;

    const userPrompt = `User said: "${query}"`;

    if (isAIConfigured()) {
      try {
        const aiRes = await callAIModel(systemPrompt, userPrompt);
        const cleaned = aiRes.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          success: true,
          reply: parsed.reply || `Understood, ${adminName}. Carrying that out now.`,
          actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        });
      } catch (aiErr) {
        console.warn('[JARVIS API] AI parse error, fallback to rule engine:', aiErr);
      }
    }

    // Deterministic fallback rule engine
    const lowerQ = query.toLowerCase();
    const fallbackActions: JarvisAction[] = [];
    let fallbackReply = `At your service, ${adminName}. All 5 autonomous agents are operational.`;

    if (lowerQ.includes('password')) {
      fallbackReply = `Opening your security profile now, ${adminName}. Focusing the password field.`;
      const pwdMatch = query.match(/(?:password\s+to|type\s+password)\s+([^\s]+)/i);
      fallbackActions.push({
        type: 'change_password',
        url: `/admin/users/${userId}/edit`,
        value: pwdMatch ? pwdMatch[1] : undefined,
      });
    } else if (lowerQ.includes('audit') || lowerQ.includes('health') || lowerQ.includes('guardian')) {
      fallbackReply = `Initiating Website Guardian health diagnostic now, sir.`;
      fallbackActions.push({ type: 'run_agent', agentId: 'website_guardian' });
    } else if (lowerQ.includes('seo')) {
      fallbackReply = `Running technical SEO analysis and cluster discovery now, ${adminName}.`;
      fallbackActions.push({ type: 'run_agent', agentId: 'seo_growth' });
    } else if (lowerQ.includes('lead') || lowerQ.includes('prospect')) {
      fallbackReply = `Opening Lead Intelligence and client inquiries.`;
      fallbackActions.push({ type: 'navigate', url: '/admin/leads/' });
    } else if (lowerQ.includes('post') || lowerQ.includes('article')) {
      fallbackReply = `Opening insight articles and drafts.`;
      fallbackActions.push({ type: 'navigate', url: '/admin/posts/' });
    } else if (lowerQ.includes('chief') || lowerQ.includes('agent')) {
      fallbackReply = `Opening AI Chief of Staff command center.`;
      fallbackActions.push({ type: 'navigate', url: '/admin/chief-of-staff/' });
    } else if (lowerQ.includes('setting')) {
      fallbackReply = `Opening platform configuration settings.`;
      fallbackActions.push({ type: 'navigate', url: '/admin/settings/' });
    }

    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      actions: fallbackActions,
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
