import {
  NormalizedNewsItem,
  GeneratedContentPayload,
  GeneratedArticleSection,
} from './types';
import { callAIModel } from './ai-provider';

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
5. Dual Output:
   - Format A (Website Article): Typically 400-650 words (never padded). Well-structured sections with headings, concise paragraphs, actionable takeaways, and a "Sources and Further Reading" section.
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
2. Generate an original, humanized engineering article for the website AND a separate high-engagement LinkedIn post.

Respond ONLY with JSON matching this structure:
{
  "title": "string (Compelling, professional headline without clickbait)",
  "slug": "string (kebab-case SEO slug without punctuation)",
  "excerpt": "string (Crisp 2-sentence executive summary)",
  "categoryName": "Artificial Intelligence" | "Web Development" | "Software Architecture" | "Cybersecurity",
  "tags": ["3 to 5 relevant technical tags"],
  "sections": [
    {
      "heading": "string (Section 1: The Core Development)",
      "paragraphs": ["string (2-3 informative paragraphs explaining what happened)"],
      "quote": "string or null",
      "proTip": "string or null"
    },
    {
      "heading": "string (Section 2: Why This Matters to Engineers & Tech Teams)",
      "paragraphs": ["string (2-3 paragraphs analyzing architecture, performance, or business impact)"],
      "bulletPoints": ["3 to 4 concise bullet points summarizing practical takeaways"]
    },
    {
      "heading": "string (Section 3: What to Watch Next)",
      "paragraphs": ["string (1-2 forward-looking paragraphs on what tech teams should prepare for)"]
    },
    {
      "heading": "Sources & Further Reading",
      "paragraphs": ["string (Attribution note explaining the verified reports reviewed for this analysis)"],
      "bulletPoints": ["List each primary source with title and URL: e.g. 'TechCrunch: Headline — URL'"]
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

  let parsed: any;
  try {
    parsed = JSON.parse(aiRes.text);
  } catch (err: any) {
    // Attempt markdown code block extraction
    const jsonMatch = aiRes.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error(`Failed to parse AI response as JSON: ${err?.message}`);
    }
  }

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

  return {
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
      bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints : undefined,
    })),
    sourcesUsed: Array.isArray(parsed.sourcesUsed) ? parsed.sourcesUsed : [],
    seoTitle: parsed.seoTitle || `${parsed.title} | HeyPrince`,
    seoDescription: parsed.seoDescription || parsed.excerpt || '',
    linkedinPost: linkedinText.trim(),
    rationale: parsed.rationale || 'Top development of the day.',
  };
}

