import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { callAIModel, isAIConfigured } from '@/lib/daily-news/ai-provider';
import { getChiefDashboardSummary } from '@/lib/chief-of-staff/db';

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
    | 'toast';
  url?: string;
  targetText?: string;
  fieldName?: string;
  value?: string;
  agentId?: string;
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

    // Gather live dashboard context
    let dashboardContext = '';
    try {
      const summary = await getChiefDashboardSummary();
      dashboardContext = `
LIVE CHIEF OF STAFF TELEMETRY:
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
Prince is speaking to you live from his HeyPrince.in Admin Dashboard.

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

YOUR BEHAVIOR & STYLE:
- Dignified, calm, subtly witty British cadence (like classic JARVIS).
- Address him naturally as "${adminName}" or "sir".
- Keep spoken replies concise: 1 to 2 crisp sentences for audio readout.
- Learn and understand what he wants on the dashboard and translate it into actionable UI steps.
- If he asks to change password, return action to navigate to /admin/users/${userId}/edit and focus/type into password.
- If he asks to click a button visible on screen, return "click_button" with targetText.
- If he asks to run an audit or check health, return "run_agent" with agentId: "website_guardian".
- If he asks to check SEO, return "run_agent" with agentId: "seo_growth".
- If he asks to scout leads, return "run_agent" with agentId: "lead_scout".
- If he asks to create a post on a topic, return "run_agent" with agentId: "content_researcher" and value: topic.

RESPOND IN STRICT JSON ONLY:
{
  "reply": "Spoken text response (1-2 sentences)",
  "actions": [
    {
      "type": "navigate" | "click_button" | "focus_and_type" | "run_agent" | "change_password" | "scroll" | "select_tab",
      "url": "/admin/...",
      "targetText": "Text of button or tab to click",
      "fieldName": "Input placeholder or name",
      "value": "Text to type into input",
      "agentId": "website_guardian | content_researcher | lead_scout | seo_growth | news_synthesizer",
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
