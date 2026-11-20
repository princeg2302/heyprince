import {
  NormalizedNewsItem,
  GeneratedContentPayload,
  GeneratedArticleSection,
} from './types';
import { callAIModel } from './ai-provider';
import { sanitizeAiContent, NO_EM_DASH_INSTRUCTION } from '../ai-content-sanitizer';
import { checkContentDuplicate, normalizeContentTitle } from '../deduplication';
import { registerBlogTopic } from '../company/db';

export const DYNAMIC_BLOG_CATEGORIES = [
  'Artificial Intelligence',
  'Generative AI',
  'AI Agents and Automation',
  'Software Development',
  'Web Development',
  'Next.js and React',
  'Python and Backend Engineering',
  'Cybersecurity',
  'Cloud Computing',
  'Startups and Entrepreneurship',
  'Business Technology',
  'Digital Marketing',
  'SEO and Search Updates',
  'Productivity',
  'Emerging Technology',
  'Developer Tools',
  'Technology Careers',
  'Global Technology News',
  'Indian Technology Ecosystem',
  'Interesting Science and Innovation',
] as const;

export type DynamicBlogCategory = (typeof DYNAMIC_BLOG_CATEGORIES)[number];

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

  // Filter out items that are already duplicates of published articles
  const vettedCandidates: NormalizedNewsItem[] = [];
  for (const item of newsItems) {
    const dupCheck = await checkContentDuplicate({ title: item.headline, type: 'article' });
    if (!dupCheck.isDuplicate) {
      vettedCandidates.push(item);
    }
    if (vettedCandidates.length >= 6) break;
  }

  const poolToUse = vettedCandidates.length > 0 ? vettedCandidates : newsItems.slice(0, 5);

  const systemPrompt = `You are Prince, founder and Principal Systems Architect at HeyPrince (https://heyprince.in).
You are writing an authoritative, research-driven engineering guide for an audience of CTOs, software developers, engineering leads, founders, and tech professionals.

EDITORIAL PRINCIPLES & ORIGINALITY RULES:
1. Dynamic Subject Matter: Base your article on current empirical evidence from verified news reports, official releases, or engineering developments.
2. Tone & Voice: Conversational, grounded, deeply analytical, and authoritatively practical. Write like an experienced practitioner who builds production systems daily.
3. STRICT ORIGINALITY & NO CLICHE TEMPLATES:
   - NEVER use generic openings ("In today's fast-paced digital world", "Exciting news in tech", "Let's dive in", "Game changer", "Revolutionize", "In this article we will explore").
   - NEVER reuse rigid, formulaic section templates (e.g. "Section 1: Core Development", "Deep Dive: Technical Mechanics", "Production Impact", "Strategic Outlook").
   - Every article MUST feature completely original, substantive section headings directly describing the actual system, problem, architecture, or benchmark.
   - Ensure a unique angle and clear thesis.
4. Factual Integrity & News Accuracy:
   - Accurately state dates and source publishers.
   - Distinguish the publication date of the report from the actual event date.
   - Do NOT invent quotes, benchmark numbers, or lab tests you did not perform.
   - Paraphrase verified facts accurately and provide original architectural commentary.
5. Dual Output & Length Requirements:
   - Website Article: MINIMUM 1,200 to 1,800+ words across 5 to 6 comprehensive sections with technical trade-offs, actionable bullet points, real-world examples, and verified sources.
   - LinkedIn Post: 140-230 words. High-signal opening hook, core engineering takeaway, {{ARTICLE_URL}} placeholder, and 3-4 professional hashtags.
6. FORMATTING: ${NO_EM_DASH_INSTRUCTION}

You MUST respond strictly with valid JSON conforming to the schema.`;

  const candidatesSummary = poolToUse
    .map(
      (item, idx) =>
        `Story #${idx + 1}:
Source: ${item.sourceName}
Headline: ${item.headline}
URL: ${item.url}
Published: ${item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : 'Current'}
Summary: ${item.summary || 'Verified industry development.'}`
    )
    .join('\n\n');

  const userPrompt = `Here are today's verified technology news stories collected from trustworthy RSS feeds:

${candidatesSummary}

TASK:
1. Select the single most impactful, technically significant story or synthesize closely related shifts.
2. Formulate a distinct, original angle that has practical value for engineering teams and technical leaders.
3. Craft an exhaustive, publication-grade article (1,200 to 1,800+ words) with original section headings specific to this topic.
4. Produce a high-engagement LinkedIn post.

JSON SCHEMA REQUIRED:
{
  "title": "string (Compelling, professional, non-clickbait headline, 50-75 chars, NO em dashes)",
  "slug": "string (kebab-case SEO slug without punctuation)",
  "categoryName": "Artificial Intelligence" | "Generative AI" | "AI Agents and Automation" | "Software Development" | "Web Development" | "Next.js and React" | "Python and Backend Engineering" | "Cybersecurity" | "Cloud Computing" | "Startups and Entrepreneurship" | "Developer Tools",
  "excerpt": "string (Crisp 2-sentence executive summary emphasizing practical software architecture and business ROI)",
  "tags": ["3 to 5 relevant technical tags"],
  "centralThesis": "string (1 sentence stating the distinct core idea of this piece)",
  "targetAudience": "string (Specific engineering audience, e.g. Senior Frontend Architects, Security Leads)",
  "sections": [
    {
      "heading": "string (Original descriptive heading specifically named after the topic)",
      "paragraphs": [
        "string (Detailed technical paragraph exploring context, problem, or architectural shift)",
        "string (In-depth analysis of trade-offs, mechanics, or code patterns)",
        "string (Production realities, latency numbers, benchmarks, or systemic impact)"
      ],
      "quote": "string or null",
      "proTip": "string or null",
      "bulletPoints": ["string (Actionable technical insight #1)", "string (Actionable technical insight #2)"]
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
  "linkedinPost": "string (140-230 words, with {{ARTICLE_URL}} placeholder, and 3-4 professional hashtags)",
  "rationale": "string (Brief explanation of why this story and angle were chosen)"
}`;

  const aiRes = await callAIModel(systemPrompt, userPrompt, preferredModel);
  const parsed = parseAIJsonResponse(aiRes.text);

  if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('AI generation did not return a valid article with title and sections.');
  }

  // Ensure unique slug with date suffix
  const cleanSlug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
  const dateSuffix = new Date().toISOString().split('T')[0];
  const uniqueSlug = `${cleanSlug}-${dateSuffix}`;

  const wordCount = countWords(parsed.sections);
  const readMins = `${Math.max(4, Math.ceil(wordCount / 180))} min`;

  const articleUrl = `https://heyprince.in/insights/${uniqueSlug}/`;
  let linkedinText = parsed.linkedinPost || '';
  if (linkedinText.includes('{{ARTICLE_URL}}')) {
    linkedinText = linkedinText.replace(/{{ARTICLE_URL}}/g, articleUrl);
  } else if (!linkedinText.includes('heyprince.in')) {
    linkedinText = `${linkedinText.trim()}\n\nRead the full architectural breakdown on HeyPrince:\n${articleUrl}`;
  }

  // Register topic in editorial registry
  try {
    await registerBlogTopic({
      topic: parsed.title,
      normalized_topic: normalizeContentTitle(parsed.title),
      category: parsed.categoryName || 'Artificial Intelligence',
      angle: parsed.centralThesis || parsed.rationale || 'Architectural breakdown',
      target_audience: parsed.targetAudience || 'CTOs & Software Engineers',
      sources: parsed.sourcesUsed || [],
      semantic_keywords: Array.isArray(parsed.tags) ? parsed.tags : [],
      status: 'drafted',
      proposed_by: 'marcus_sterling',
    });
  } catch (regErr) {
    console.warn('[generateDailyPost] Topic registry notice:', regErr);
  }

  return sanitizeAiContent({
    title: parsed.title.trim(),
    slug: uniqueSlug,
    excerpt: parsed.excerpt?.trim() || `${parsed.title}. Read the full analysis on HeyPrince.`,
    readMins,
    categoryName: parsed.categoryName || 'Artificial Intelligence',
    tags: Array.isArray(parsed.tags) ? parsed.tags : ['Software Architecture', 'Engineering', 'Tech'],
    sections: parsed.sections.map((s: any) => ({
      heading: s.heading || 'Architecture Breakdown',
      quote: s.quote || undefined,
      proTip: s.proTip || undefined,
      paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs : [s.text || ''],
      bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints.map((bp: any) => String(bp)) : undefined,
    })),
    sourcesUsed: Array.isArray(parsed.sourcesUsed) ? parsed.sourcesUsed : [],
    seoTitle: parsed.seoTitle || `${parsed.title} | HeyPrince`,
    seoDescription: parsed.seoDescription || parsed.excerpt || '',
    linkedinPost: linkedinText.trim(),
    rationale: parsed.rationale || 'Curated high-signal engineering development.',
  });
}

export async function generateCustomTopicPost(
  customPrompt: string,
  preferredModel?: string
): Promise<GeneratedContentPayload> {
  if (!customPrompt || !customPrompt.trim()) {
    throw new Error('Please provide your thoughts or a topic for article generation.');
  }

  const systemPrompt = `You are Prince, founder and Principal Systems Architect at HeyPrince (https://heyprince.in).
You are writing an authoritative, research-driven engineering guide based on user/admin direction.

EDITORIAL PRINCIPLES & ORIGINALITY RULES:
1. Deep Understanding: Analyze the thesis, core arguments, and industry implications of the requested topic.
2. Tone & Voice: Conversational, grounded, deeply analytical, and authoritatively practical.
3. STRICT ORIGINALITY & NO CLICHE TEMPLATES:
   - NEVER use generic openings ("In today's fast-paced digital world", "Exciting news in tech", "Let's dive in", "Game changer").
   - NEVER reuse rigid, formulaic section templates. Create completely original, substantive section headings directly describing the actual system, problem, or architectural pattern.
4. Dual Output & Length Requirements:
   - Website Article: MINIMUM 1,200 to 1,800+ words across 4 to 6 structured sections with technical trade-offs, actionable bullet points, real-world examples, and pro-tips.
   - LinkedIn Post: 140-230 words. Engaging opening hook, key engineering takeaway, {{ARTICLE_URL}} placeholder, and 4-5 relevant hashtags.
5. FORMATTING: ${NO_EM_DASH_INSTRUCTION}

You MUST respond strictly with valid JSON conforming to the schema.`;

  const userPrompt = `TOPIC & CONCEPT INSTRUCTIONS:
"${customPrompt.trim()}"

TASK:
1. Formulate a distinct, original angle that delivers concrete, high-signal value for engineering teams and technical leaders.
2. Craft an exhaustive, publication-grade article (1,200 to 1,800+ words) with original section headings specific to this topic.
3. Produce a high-engagement LinkedIn post.

JSON SCHEMA REQUIRED:
{
  "title": "string (Compelling, professional, non-clickbait headline, 50-75 chars, NO em dashes)",
  "slug": "string (kebab-case SEO slug without punctuation)",
  "categoryName": "string (One of: Artificial Intelligence | Generative AI | AI Agents and Automation | Software Development | Web Development | Next.js and React | Python and Backend Engineering | Cybersecurity | Cloud Computing | Startups and Entrepreneurship | Developer Tools)",
  "excerpt": "string (Crisp 2-sentence executive summary emphasizing practical software architecture and business ROI)",
  "tags": ["3 to 5 relevant technical tags"],
  "centralThesis": "string (1 sentence stating the distinct core idea of this piece)",
  "targetAudience": "string (Specific engineering audience)",
  "sections": [
    {
      "heading": "string (Original descriptive heading specifically named after the topic)",
      "paragraphs": [
        "string (Detailed technical paragraph exploring context, problem, or architectural shift)",
        "string (In-depth analysis of trade-offs, mechanics, or code patterns)",
        "string (Production realities, latency numbers, benchmarks, or systemic impact)"
      ],
      "quote": "string or null",
      "proTip": "string or null",
      "bulletPoints": ["string (Actionable takeaway #1)", "string (Actionable takeaway #2)"]
    }
  ],
  "sourcesUsed": [],
  "seoTitle": "string (Under 60 chars)",
  "seoDescription": "string (140-160 chars)",
  "linkedinPost": "string (140-230 words, with {{ARTICLE_URL}} placeholder, and 4-5 professional hashtags)",
  "rationale": "string (Brief explanation of the editorial angle taken)"
}`;

  const aiRes = await callAIModel(systemPrompt, userPrompt, preferredModel);
  const parsed = parseAIJsonResponse(aiRes.text);

  if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('AI output missing required title or sections array.');
  }

  const cleanSlug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
  const dateSuffix = new Date().toISOString().split('T')[0];
  const uniqueSlug = `${cleanSlug}-${dateSuffix}`;

  const wordCount = countWords(parsed.sections);
  const readMins = `${Math.max(4, Math.ceil(wordCount / 180))} min`;

  const articleUrl = `https://heyprince.in/insights/${uniqueSlug}/`;
  let linkedinText = parsed.linkedinPost || '';
  if (linkedinText.includes('{{ARTICLE_URL}}')) {
    linkedinText = linkedinText.replace(/{{ARTICLE_URL}}/g, articleUrl);
  } else if (!linkedinText.includes('heyprince.in')) {
    linkedinText = `${linkedinText.trim()}\n\nRead the full engineering breakdown on HeyPrince:\n${articleUrl}`;
  }

  // Register topic in editorial registry
  try {
    await registerBlogTopic({
      topic: parsed.title,
      normalized_topic: normalizeContentTitle(parsed.title),
      category: parsed.categoryName || 'Software Architecture',
      angle: parsed.centralThesis || parsed.rationale || 'Custom architectural analysis',
      target_audience: parsed.targetAudience || 'CTOs & Technical Leaders',
      sources: [],
      semantic_keywords: Array.isArray(parsed.tags) ? parsed.tags : [],
      status: 'drafted',
      proposed_by: 'marcus_sterling',
    });
  } catch (regErr) {
    console.warn('[generateCustomTopicPost] Topic registry notice:', regErr);
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
