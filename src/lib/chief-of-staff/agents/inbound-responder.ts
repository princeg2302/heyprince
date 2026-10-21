import { callAIModel, isAIConfigured } from '../../daily-news/ai-provider';
import {
  createContentDraft,
  logChiefActivity,
  incrementAgentStats,
  updateAgentExecutionTime,
  getAgentById,
} from '../db';

export interface InboundLeadData {
  leadId?: string | number;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  message: string;
}

export interface InboundAnalysisResult {
  draftId: string;
  clientSummary: string;
  technicalAssessment: string;
  estimatedTimeline: string;
  draftEmailReply: string;
}

export async function processInboundLead(
  lead: InboundLeadData
): Promise<InboundAnalysisResult | null> {
  const startTime = Date.now();
  const agent = await getAgentById('inbound_responder');
  if (agent && agent.status === 'paused') {
    console.info('[InboundResponderAgent] Agent is paused; skipping automatic proposal drafting.');
    return null;
  }

  await logChiefActivity(
    'inbound_responder',
    'info',
    `Received inbound lead inquiry from ${lead.name} (${lead.email})`,
    { leadId: lead.leadId, service: lead.service, budget: lead.budget }
  );

  let clientSummary = `Inquiry from ${lead.name} regarding ${lead.service || 'web development services'}.`;
  let technicalAssessment = 'Standard full-stack React/Next.js and cloud backend evaluation recommended.';
  let estimatedTimeline = lead.timeline || '2 - 4 weeks';
  let draftEmailReply = `Hi ${lead.name},\n\nThank you for reaching out regarding your project. I've reviewed your requirements and would love to discuss how we can build this efficiently.\n\nBest regards,\nPrince`;

  if (isAIConfigured()) {
    try {
      const systemPrompt = `You are the AI Chief of Staff and Senior Technical Solutions Architect for HeyPrince.in (Prince - Senior Full Stack Engineer & IT Consultant).
Analyze the incoming client lead inquiry and generate a professional, highly credible technical response proposal outline.
Your output must be strict JSON matching this structure:
{
  "clientSummary": "Brief 1-2 sentence distillation of what the client wants and their business goal",
  "technicalAssessment": "Architectural recommendation including tech stack (e.g. Next.js 15, React 19, Supabase, Tailwind, Vercel, Stripe)",
  "estimatedTimeline": "Suggested realistic delivery timeline (e.g. 2 to 3 weeks for MVP)",
  "draftEmailReply": "A warm, high-conviction email from Prince replying to the client directly. Acknowledge their specific message details, address technical viability, outline the immediate next step (a 20-min strategy call), and provide a calendar/meeting link placeholder."
}`;

      const userPrompt = `CLIENT INQUIRY DETAILS:
Name: ${lead.name}
Email: ${lead.email}
Company: ${lead.company || 'Not specified'}
Service Requested: ${lead.service || 'Web Development'}
Budget Range: ${lead.budget || 'Custom Quote'}
Desired Timeline: ${lead.timeline || 'Flexible'}
Project Message:
"""
${lead.message}
"""`;

      const aiResponse = await callAIModel(systemPrompt, userPrompt);
      const cleaned = aiResponse.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.clientSummary) clientSummary = parsed.clientSummary;
      if (parsed.technicalAssessment) technicalAssessment = parsed.technicalAssessment;
      if (parsed.estimatedTimeline) estimatedTimeline = parsed.estimatedTimeline;
      if (parsed.draftEmailReply) draftEmailReply = parsed.draftEmailReply;
    } catch (aiErr) {
      console.warn('[InboundResponderAgent] AI proposal generation error, using structured template fallback:', aiErr);
      draftEmailReply = `Hi ${lead.name},

Thank you for reaching out to HeyPrince.in! I reviewed your project details for ${lead.service || 'your application'}.

Based on your message: "${lead.message.slice(0, 150)}..."

I specialize in building high-performance Next.js and full-stack web applications. I would be happy to review your architecture and discuss how we can bring this to life within your ${lead.budget || 'target budget'}.

Would you be open to a quick 15-minute introductory call this week to align on the scope and technical roadmap?

Best regards,
Prince
Senior Full Stack Engineer & IT Consultant
https://heyprince.in`;
    }
  }

  // Create proposal draft awaiting admin review
  const draftTitle = `Client Proposal: ${lead.name} (${lead.company || lead.service || 'Web Project'})`;
  const draftExcerpt = clientSummary;
  const draftContent = `### Executive Summary\n${clientSummary}\n\n### Technical Assessment & Recommended Stack\n${technicalAssessment}\n\n### Estimated Timeline\n${estimatedTimeline}\n\n---\n\n### Proposed Email Response (Prince to Client)\n\`\`\`text\n${draftEmailReply}\n\`\`\``;

  const draftId = await createContentDraft({
    agentId: 'inbound_responder',
    draftType: 'client_proposal',
    title: draftTitle,
    excerpt: draftExcerpt,
    content: draftContent,
    metadata: {
      leadId: lead.leadId,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      phone: lead.phone,
      service: lead.service,
      budget: lead.budget,
      timeline: lead.timeline,
      draftEmailReply,
      technicalAssessment,
    },
    status: 'pending_approval',
  });

  const duration = Date.now() - startTime;
  await updateAgentExecutionTime('inbound_responder', new Date(), null);
  await incrementAgentStats('inbound_responder', true, 1, 650);

  await logChiefActivity(
    'inbound_responder',
    'success',
    `Prepared custom client proposal draft for ${lead.name}`,
    { draftId, leadId: lead.leadId, durationMs: duration }
  );

  return {
    draftId,
    clientSummary,
    technicalAssessment,
    estimatedTimeline,
    draftEmailReply,
  };
}
