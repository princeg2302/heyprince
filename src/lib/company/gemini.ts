import { sanitizeEmDashes, NO_EM_DASH_INSTRUCTION } from '../ai-content-sanitizer';
import { CompanyEmployee } from './types';

export async function generateAgentTurnResponse(params: {
  speaker: CompanyEmployee;
  discussionTitle: string;
  discussionObjective: string;
  recentTranscript: string;
  isModerator: boolean;
  isConcludingTurn: boolean;
}): Promise<{
  content: string;
  messageType: 'statement' | 'proposal' | 'challenge' | 'evidence' | 'consensus' | 'summary';
  evidence: Record<string, any>;
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini key, provide rich contextual dynamic fallback
  if (!apiKey) {
    return generateContextualFallback(params);
  }

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  const systemInstruction = `You are ${params.speaker.name}, ${params.speaker.display_title} at HeyPrince (https://heyprince.in).
DEPARTMENT: ${params.speaker.department}
PERSONALITY ARCHETYPE: ${params.speaker.personality_archetype}
DIRECTIVE: ${params.speaker.system_prompt_overlay}
${NO_EM_DASH_INSTRUCTION}

You are in a formal executive meeting:
TITLE: "${params.discussionTitle}"
OBJECTIVE: "${params.discussionObjective}"

RULES:
1. Speak strictly in-character as ${params.speaker.name}.
2. Keep response to 2 to 3 sharp, impactful, highly technical sentences.
3. Reference concrete engineering trade-offs, measurable metrics, or business impact.
4. STRICT RULE: Never use em-dashes (—). Use hyphens, commas, colons, or parentheses.
5. Return JSON with format:
{
  "content": "Your in-character statement",
  "messageType": "statement | proposal | challenge | evidence | consensus",
  "evidence": { "key": "value" }
}`;

  const userPrompt = `RECENT MEETING DISCOURSE:
${params.recentTranscript || '(Meeting just opened)'}

${
  params.isModerator
    ? params.isConcludingTurn
      ? 'As Alex Vance (Chief of Staff), synthesize the consensus reached, summarize the core agreement, and state the exact action item for Prince (CEO).'
      : 'As Alex Vance (Chief of Staff), analyze the latest points, challenge the specialists with a direct technical question or guide the agenda forward.'
    : `Respond in your professional role as ${params.speaker.name}. Advance the objective, debate the previous points, or present quantifiable evidence.`
}`;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 350,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText.trim());
      const cleanContent = sanitizeEmDashes(parsed.content || '');

      return {
        content: cleanContent,
        messageType: parsed.messageType || (params.isConcludingTurn ? 'consensus' : 'statement'),
        evidence: parsed.evidence || {},
      };
    } catch {
      // Try next model
    }
  }

  // Fallback if all Gemini models fail
  return generateContextualFallback(params);
}

function generateContextualFallback(params: {
  speaker: CompanyEmployee;
  discussionTitle: string;
  discussionObjective: string;
  isModerator: boolean;
  isConcludingTurn: boolean;
}): {
  content: string;
  messageType: 'statement' | 'proposal' | 'challenge' | 'evidence' | 'consensus' | 'summary';
  evidence: Record<string, any>;
} {
  const { speaker, isModerator, isConcludingTurn, discussionTitle, discussionObjective } = params;

  if (isModerator) {
    if (isConcludingTurn) {
      return {
        content: sanitizeEmDashes(
          `We have established clear cross-functional alignment on "${discussionTitle}". I will synthesize our findings into an executive proposal for Prince's immediate sign-off.`
        ),
        messageType: 'consensus',
        evidence: { consensusReached: true, targetDeliverable: discussionObjective },
      };
    }
    return {
      content: sanitizeEmDashes(
        `Let us examine the critical milestones for "${discussionObjective}". What are our immediate technical risks and delivery trade-offs?`
      ),
      messageType: 'statement',
      evidence: { agendaPhase: 'Discovery & Feasibility' },
    };
  }

  // Department-specific contextual fallbacks
  switch (speaker.department) {
    case 'Growth':
      return {
        content: sanitizeEmDashes(
          `From a search visibility standpoint, targeting high-intent long-tail keywords in this cluster allows us to dominate commercial queries without competing against generic aggregators.`
        ),
        messageType: 'evidence',
        evidence: { organicIntent: 'Commercial High-Intent', searchGainTarget: '+28%' },
      };
    case 'Editorial':
      return {
        content: sanitizeEmDashes(
          `I will architect an authoritative, long-form technical teardown illustrating real-world code patterns, zero em-dash prose, and concrete performance benchmarks.`
        ),
        messageType: 'proposal',
        evidence: { wordTarget: 1400, format: 'Architectural Blueprint' },
      };
    case 'Infrastructure':
      return {
        content: sanitizeEmDashes(
          `I have audited our latency baselines. Any new deployment must strictly respect our sub-250ms mobile TTFB threshold and preserve perfect 100% Core Web Vitals pass rates.`
        ),
        messageType: 'challenge',
        evidence: { ttfbMaxMs: 250, cwvScoreTarget: 98 },
      };
    case 'Sales':
      return {
        content: sanitizeEmDashes(
          `Our prospect dataset reveals that companies migrating to modern headless architectures see conversion rate lifts exceeding 30%. This gives us strong commercial leverage.`
        ),
        messageType: 'evidence',
        evidence: { conversionUpside: '32%', targetSegments: ['B2B SaaS', 'eCommerce'] },
      };
    case 'Client Solutions':
      return {
        content: sanitizeEmDashes(
          `I recommend packaging this into a clear 3-week milestone scope with zero downtime cutover guarantees so client stakeholders have absolute confidence in execution.`
        ),
        messageType: 'proposal',
        evidence: { estimatedDeliveryWeeks: 3, riskLevel: 'low' },
      };
    default:
      return {
        content: sanitizeEmDashes(
          `We are aligned on the core architecture and ready to transition this into a verified execution task.`
        ),
        messageType: 'statement',
        evidence: {},
      };
  }
}
