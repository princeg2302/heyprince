import {
  NormalizedNewsItem,
  GeneratedContentPayload,
  GeneratedArticleSection,
} from './types';
import { callAIModel } from './ai-provider';
import { sanitizeAiContent, NO_EM_DASH_INSTRUCTION } from '../ai-content-sanitizer';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .slice(0, 75)
    .replace(/^-+|-+$/g, '');
}

function countWords(sections: GeneratedArticleSection[]): number {
  let count = 0;
  for (const s of sections) {
    count += s.heading.split(/\s+/).length;
    for (const p of s.paragraphs) {
      count += p.split(/\s+/).length;
    }
    if (s.bulletPoints) {
      for (const b of s.bulletPoints) {
        count += b.split(/\s+/).length;
      }
    }
    if (s.quote) count += s.quote.split(/\s+/).length;
    if (s.proTip) count += s.proTip.split(/\s+/).length;
  }
  return count;
}

function parseAIJsonResponse(rawText: string): any {
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (err: any) {
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through
      }
    }
    if (!parsed) {
      const startIdx = rawText.indexOf('{');
      const endIdx = rawText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          parsed = JSON.parse(rawText.substring(startIdx, endIdx + 1));
        } catch {
          throw new Error(`Failed to parse AI response as JSON: ${err?.message}`);
        }
      } else {
        throw new Error(`Failed to parse AI response as JSON: ${err?.message}`);
      }
    }
  }
  return parsed;
}

export async function generateDailyPost(
  newsItems: NormalizedNewsItem[],
  preferredModel?: string
): Promise<GeneratedContentPayload> {
  if (!newsItems || newsItems.length === 0) {
    throw new Error('No candidate news items provided for daily post generation.');
  }

  // Pick top 1-5 candidate stories for analysis
  const topCandidates = newsItems.slice(0, 8);

  const systemPrompt = `You are a distinguished senior technology strategist, software architect, and IT consultant writing for HeyPrince (https://heyprince.in) — an engineering studio.
Your audience consists of CTOs, software developers, engineering leads, founders, and tech professionals.

EDITORIAL PRINCIPLES & VOICE:
1. Tone: Conversational, grounded, authoritative, and analytical. Write like a real practitioner explaining an important tech shift.
2. Natural Variation: Avoid generic AI openings ("In today's fast-paced digital world", "Exciting news in tech", "Let's dive in", "Game changer", "Revolutionize"). Jump straight into the substance.
3. The "Why It Matters" Angle: Never just repeat what happened. Analyze the practical consequences, technical trade-offs, and engineering reality.
4. Factual Integrity:
   - Do NOT invent personal claims or pretend you tested something in a lab if you didn't.
   - Do NOT fabricate benchmark numbers or quotes not present in the reported facts.
   - Do NOT copy verbatim paragraphs from the sources. Paraphrase accurately and provide original analysis.
5. Dual Output & SEO Minimum Word Rule:
   - Format A (Website Article): Strictly adhere to the Google SEO minimum word rule for authoritative technical publications: MINIMUM 1,200 to 1,800+ words. Never generate thin content (<1,000 words). Structure into 5-6 comprehensive sections with detailed technical breakdowns, architectural trade-offs, actionable bullet points, pro-tips, and verified sources.
   - Format B (LinkedIn Post): 140-230 words. Engaging opening hook, the core development, why it matters, an engineer's takeaway, a link placeholder "{{ARTICLE_URL}}", and 3-4 tasteful hashtags.

You MUST respond strictly with valid JSON conforming to the schema.`;

  const candidatesSummary = topCandidates
    .map(
      (item, idx) =>
        `Story #${idx + 1}:
Source: ${item.sourceName}
Headline: ${item.headline}
URL: ${item.url}
Published: ${item.publishedAt}
Summary: ${item.summary || 'No additional summary available.'}`
    )
    .join('\n\n');

  const userPrompt = `Here are today's verified technology news stories collected from trustworthy RSS feeds:

${candidatesSummary}

TASK:
1. Identify the single most significant and impactful development among these stories (or a synthesis of closely related developments).
2. Generate an in-depth, authoritative, humanized engineering article for the website meeting the SEO minimum word count rule (1,200 to 1,800+ words) across 5 to 6 structured sections.
3. Generate a separate high-engagement LinkedIn post.

Respond ONLY with JSON matching this structure:
{
  "title": "string (Compelling, professional headline without clickbait)",
  "slug": "string (kebab-case SEO slug without punctuation)",
  "excerpt": "string (Crisp 2-sentence executive summary)",
  "categoryName": "Artificial Intelligence" | "Web Development" | "Software Architecture" | "Cybersecurity",
  "tags": ["3 to 5 relevant technical tags"],
  "sections": [
    {
      "heading": "string (Section 1: The Core Development & Architectural Context)",
      "paragraphs": [
        "string (Paragraph 1: Detailed background, what shifted in the industry, and the core news)",
        "string (Paragraph 2: Contextual technical analysis and historical precursor)",
        "string (Paragraph 3: Key technical entities, systems, or architectures involved)",
        "string (Paragraph 4: Initial scope of impact across software organizations)"
      ],
      "quote": "string or null",
      "proTip": "string or null"
    },
    {
      "heading": "string (Section 2: Deep Dive: Technical Mechanics & System Vulnerabilities)",
      "paragraphs": [
        "string (Paragraph 1: In-depth technical breakdown of how this functions under the hood)",
        "string (Paragraph 2: Architectural failure modes, systemic bottlenecks, or trade-offs)",
        "string (Paragraph 3: Comparative analysis between legacy vs modern approaches)",
        "string (Paragraph 4: Practical system telemetry, edge cases, and runtime realities)"
      ],
      "proTip": "string or null"
    },
    {
      "heading": "string (Section 3: Production Impact & Engineering Realities)",
      "paragraphs": [
        "string (Paragraph 1: Immediate fallout and operational challenges tech teams face)",
        "string (Paragraph 2: Infrastructure cost, cloud spend, and resource allocation impact)",
        "string (Paragraph 3: Security, governance, or compliance implications in production)"
      ],
      "bulletPoints": [
        "string (Actionable technical insight #1)",
        "string (Actionable technical insight #2)",
        "string (Actionable technical insight #3)",
        "string (Actionable technical insight #4)",
        "string (Actionable technical insight #5)"
      ]
    },
    {
      "heading": "string (Section 4: Implementation Blueprint & Engineering Strategies)",
      "paragraphs": [
        "string (Paragraph 1: Concrete, step-by-step mitigation and implementation roadmap)",
        "string (Paragraph 2: Architecture best practices, CI/CD validation loops, and tooling)",
        "string (Paragraph 3: Concrete code patterns, observability strategies, and safeguards)"
      ],
      "quote": "string or null",
      "proTip": "string (Actionable, high-value pro-tip for senior engineers and architects)"
    },
    {
      "heading": "string (Section 5: Strategic Industry Outlook & The Path Forward)",
      "paragraphs": [
        "string (Paragraph 1: 12-24 month industry trajectory and where the ecosystem is heading)",
        "string (Paragraph 2: Final strategic verdict on how tech leaders should position their stacks)"
      ]
    },
    {
      "heading": "Sources & Further Reading",
      "paragraphs": ["string (Attribution note explaining the verified reports reviewed for this analysis)"],
      "bulletPoints": ["List each primary source as clean markdown link: e.g. '[TechCrunch: Headline](https://url)'"]
    }
  ],
  "sourcesUsed": [
    {
      "title": "Source headline",
      "url": "https://source.url",
      "sourceName": "Publisher Name"
    }
  ],
  "seoTitle": "string (Under 60 chars)",
  "seoDescription": "string (140-160 chars)",
  "linkedinPost": "string (140-230 words, with {{ARTICLE_URL}} placeholder for the article link, and 3-4 hashtags)",
  "rationale": "string (Brief explanation of why this story was selected as today's top tech insight)"
}`;

  const aiRes = await callAIModel(systemPrompt, userPrompt, preferredModel);
  const parsed = parseAIJsonResponse(aiRes.text);

  // Validate required fields
  if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('AI output missing required title or sections array.');
  }

  // Ensure slug
  const cleanSlug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
  const dateSuffix = new Date().toISOString().split('T')[0];
  const uniqueSlug = `${cleanSlug}-${dateSuffix}`;

  // Calculate read time
  const wordCount = countWords(parsed.sections);
  const readMins = `${Math.max(3, Math.ceil(wordCount / 180))} min`;

  // Format canonical article URL into LinkedIn post
  const articleUrl = `https://heyprince.in/insights/${uniqueSlug}/`;
  let linkedinText = parsed.linkedinPost || '';
  if (linkedinText.includes('{{ARTICLE_URL}}')) {
    linkedinText = linkedinText.replace(/{{ARTICLE_URL}}/g, articleUrl);
  } else if (!linkedinText.includes('heyprince.in')) {
    linkedinText = `${linkedinText.trim()}\n\nRead the full engineering breakdown on HeyPrince:\n${articleUrl}`;
  }

  return sanitizeAiContent({
    title: parsed.title.trim(),
    slug: uniqueSlug,
    excerpt: parsed.excerpt?.trim() || `${parsed.title}. Read the full analysis on HeyPrince.`,
    readMins,
    categoryName: parsed.categoryName || 'Artificial Intelligence',
    tags: Array.isArray(parsed.tags) ? parsed.tags : ['Artificial Intelligence', 'Engineering', 'Tech News'],
    sections: parsed.sections.map((s: any) => ({
      heading: s.heading || 'Analysis',
      quote: s.quote || undefined,
      proTip: s.proTip || undefined,
      paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs : [s.text || ''],
      bulletPoints: Array.isArray(s.bulletPoints)
        ? s.bulletPoints.map((bp: string) => {
            const m = String(bp).match(/^(.*?)\s*(?:—|--|-)\s*(https?:\/\/[^\s]+)$/);
            if (m) {
              const label = m[1].trim();
              const url = m[2].trim();
              return `[${label}](${url})`;
            }
            return String(bp);
          })
        : undefined,
    })),
    sourcesUsed: Array.isArray(parsed.sourcesUsed) ? parsed.sourcesUsed : [],
    seoTitle: parsed.seoTitle || `${parsed.title} | HeyPrince`,
    seoDescription: parsed.seoDescription || parsed.excerpt || '',
    linkedinPost: linkedinText.trim(),
    rationale: parsed.rationale || 'Top development of the day.',
  });
}

export async function generateCustomTopicPost(
  customPrompt: string,
  preferredModel?: string
): Promise<GeneratedContentPayload> {
  if (!customPrompt || !customPrompt.trim()) {
    throw new Error('Please provide your thoughts or a topic for article generation.');
  }

  const systemPrompt = `You are a distinguished senior technology strategist, software architect, and IT consultant writing for HeyPrince (https://heyprince.in) — a premier engineering studio founded by Prince.
Your audience consists of CTOs, software developers, engineering leads, founders, and tech professionals across India and globally.

EDITORIAL PRINCIPLES & VOICE:
1. Tone: Thoughtful, grounded, authoritative, articulate, and inspiring. Write like an experienced practitioner sharing genuine, high-signal insights.
2. Natural Flow: Avoid generic AI openings ("In today's fast-paced digital world", "Exciting news in tech", "Let's dive in", "Game changer"). Jump straight into the core substance.
3. Thought Expansion & Versatility:
   - The admin provides their raw thoughts, notes, opinion, or topic instructions.
   - Your primary responsibility is to understand their core thesis and expand it into a comprehensive, publication-ready article that directly reflects and respects their perspective.
   - If the thoughts relate to technical architecture, system design, or engineering practices: provide hands-on depth, trade-off analysis, and concrete architectural patterns.
   - If the thoughts relate to culture, philosophy, or events: weave those themes seamlessly with software engineering realities, technical craftsmanship, and human leadership.
   - If the thoughts relate to engineering culture, team dynamics, or career growth: offer actionable frameworks, practical lessons, and clear takeaways.
4. Dual Output & SEO Minimum Word Rule:
   - Format A (Website Article): Strictly adhere to the Google SEO minimum word rule for high-ranking technical guides: MINIMUM 1,200 to 1,800+ words. Structure into 4-5 deep, comprehensive sections with detailed technical breakdowns, architectural patterns, actionable bullet points, pro-tips, and concrete implementation advice.
   - Format B (LinkedIn Post): 140-230 words. Engaging opening hook, key insights, practical engineer's takeaway, {{ARTICLE_URL}} placeholder, and 4-5 relevant hashtags (e.g. #SoftwareEngineering #Architecture #TechLeadership #HeyPrince).

You MUST respond strictly with valid JSON conforming to the schema.`;

  const userPrompt = `ADMIN THOUGHTS / TOPIC INSTRUCTIONS:
"${customPrompt.trim()}"

TASK:
1. Transform and expand the admin's thoughts into an in-depth, authoritative, high-value technical article for the website meeting the SEO minimum word count rule (1,200 to 1,800+ words) across 4 to 5 structured sections.
2. Generate a separate high-engagement LinkedIn post tailored for tech professionals.

Respond ONLY with JSON matching this structure:
{
  "title": "string (Compelling, professional headline reflecting the topic without clickbait)",
  "slug": "string (kebab-case SEO slug without punctuation)",
  "excerpt": "string (Crisp 2-sentence executive summary)",
  "categoryName": "Software Architecture" | "Engineering Leadership" | "Artificial Intelligence" | "Web Development" | "Tech Culture",
  "tags": ["3 to 5 relevant technical or conceptual tags"],
  "sections": [
    {
      "heading": "string (Section 1: The Core Thesis & Foundations)",
      "paragraphs": [
        "string (Paragraph 1: Background, motivation, and industry context)",
        "string (Paragraph 2: Detailed explanation of the underlying problem)",
        "string (Paragraph 3: Key concepts and foundational principles)"
      ],
      "quote": "string or null",
      "proTip": "string or null"
    },
    {
      "heading": "string (Section 2: Deep Dive: Architectural Mechanics & Trade-offs)",
      "paragraphs": [
        "string (Paragraph 1: In-depth technical breakdown and design patterns)",
        "string (Paragraph 2: Critical trade-offs, pitfalls, and failure modes)",
        "string (Paragraph 3: Practical edge cases and scalability considerations)"
      ],
      "proTip": "string or null"
    },
    {
      "heading": "string (Section 3: Practical Implementation & Production Lessons)",
      "paragraphs": [
        "string (Paragraph 1: Concrete implementation framework and steps)",
        "string (Paragraph 2: Developer workflow and operational safeguards)"
      ],
      "bulletPoints": [
        "string (Actionable takeaway #1)",
        "string (Actionable takeaway #2)",
        "string (Actionable takeaway #3)",
        "string (Actionable takeaway #4)",
        "string (Actionable takeaway #5)"
      ]
    },
    {
      "heading": "string (Section 4: Strategic Outlook & The Path Forward)",
      "paragraphs": [
        "string (Paragraph 1: Long-term implications for engineering teams)",
        "string (Paragraph 2: Final actionable summary for technical leaders)"
      ],
      "quote": "string or null",
      "proTip": "string or null"
    }
  ],
  "sourcesUsed": [],
  "seoTitle": "string (Under 60 chars)",
  "seoDescription": "string (140-160 chars)",
  "linkedinPost": "string (140-230 words, with {{ARTICLE_URL}} placeholder for the article link, and 4-5 hashtags)",
  "rationale": "string (Brief explanation of the editorial angle taken)"
}`;

  const aiRes = await callAIModel(systemPrompt, userPrompt, preferredModel);
  const parsed = parseAIJsonResponse(aiRes.text);

  // Validate required fields
  if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('AI output missing required title or sections array.');
  }

  // Ensure unique slug
  const cleanSlug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
  const dateSuffix = new Date().toISOString().split('T')[0];
  const uniqueSlug = `${cleanSlug}-${dateSuffix}`;

  // Calculate read time
  const wordCount = countWords(parsed.sections);
  const readMins = `${Math.max(3, Math.ceil(wordCount / 180))} min`;

  // Format canonical article URL into LinkedIn post
  const articleUrl = `https://heyprince.in/insights/${uniqueSlug}/`;
  let linkedinText = parsed.linkedinPost || '';
  if (linkedinText.includes('{{ARTICLE_URL}}')) {
    linkedinText = linkedinText.replace(/{{ARTICLE_URL}}/g, articleUrl);
  } else if (!linkedinText.includes('heyprince.in')) {
    linkedinText = `${linkedinText.trim()}\n\nRead the full engineering breakdown on HeyPrince:\n${articleUrl}`;
  }

  return sanitizeAiContent({
    title: parsed.title.trim(),
    slug: uniqueSlug,
    excerpt: parsed.excerpt?.trim() || `${parsed.title}. Read the full analysis on HeyPrince.`,
    readMins,
    categoryName: parsed.categoryName || 'Software Architecture',
    tags: Array.isArray(parsed.tags) ? parsed.tags : ['Engineering', 'Software Architecture', 'Tech Insights'],
    sections: parsed.sections.map((s: any) => ({
      heading: s.heading || 'Analysis',
      quote: s.quote || undefined,
      proTip: s.proTip || undefined,
      paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs : [s.text || ''],
      bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints.map((bp: any) => String(bp)) : undefined,
    })),
    sourcesUsed: [],
    seoTitle: parsed.seoTitle || `${parsed.title} | HeyPrince`,
    seoDescription: parsed.seoDescription || parsed.excerpt || '',
    linkedinPost: linkedinText.trim(),
    rationale: parsed.rationale || `Custom prompt: ${customPrompt.slice(0, 80)}`,
  });
}

