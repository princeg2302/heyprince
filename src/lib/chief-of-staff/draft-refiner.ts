import { sanitizeAiContent, NO_EM_DASH_INSTRUCTION } from '../ai-content-sanitizer';
import { callAIModel } from '../daily-news/ai-provider';
import { getDraftById, updateDraftContent, logChiefActivity } from './db';
import { getDailyRunById, updateDailyRun } from '../daily-news/db';
import { GeneratedContentPayload } from '../daily-news/types';

export function sectionsToMarkdown(sections: any[], excerpt?: string): string {
  const parts: string[] = [];
  if (excerpt) {
    parts.push(`> **Executive Summary:** ${excerpt}\n`);
  }
  for (const s of sections) {
    if (s.heading) parts.push(`### ${s.heading}\n`);
    if (s.quote) parts.push(`> "${s.quote}"\n`);
    if (Array.isArray(s.paragraphs)) {
      for (const p of s.paragraphs) {
        parts.push(`${p}\n`);
      }
    }
    if (Array.isArray(s.bulletPoints) && s.bulletPoints.length > 0) {
      for (const b of s.bulletPoints) {
        parts.push(`- ${b}`);
      }
      parts.push('');
    }
    if (s.proTip) {
      parts.push(`**Pro Tip:** ${s.proTip}\n`);
    }
  }
  return parts.join('\n');
}

export interface RefineDraftParams {
  draftId: string | number;
  sourceType?: 'chief' | 'news';
  instructions: string;
}

export interface RefineDraftResult {
  success: boolean;
  draft?: any;
  summaryOfChanges?: string;
  error?: string;
}

export async function refineDraftWithAI(params: {
  draftId: string | number;
  sourceType?: 'chief' | 'news';
  instructions: string;
  userEmail?: string;
}): Promise<RefineDraftResult> {
  const { draftId, instructions, userEmail } = params;

  if (!instructions || !instructions.trim()) {
    return { success: false, error: 'Please provide customization instructions.' };
  }

  // Detect whether it is a Chief draft or News Run
  const isNewsRun =
    params.sourceType === 'news' ||
    (typeof draftId === 'number' && !isNaN(draftId)) ||
    (!String(draftId).startsWith('draft_') && !isNaN(Number(draftId)));

  let currentTitle = '';
  let currentExcerpt = '';
  let currentSections: any[] = [];
  let currentLinkedinPost = '';
  let currentTags: string[] = [];

  let chiefDraft: any = null;
  let newsRun: any = null;

  if (isNewsRun) {
    const runId = typeof draftId === 'number' ? draftId : parseInt(String(draftId), 10);
    newsRun = await getDailyRunById(runId);
    if (!newsRun) {
      return { success: false, error: `Scheduled news run #${runId} not found.` };
    }
    const content: GeneratedContentPayload = newsRun.articleContent || {};
    currentTitle = content.title || newsRun.articleTitle || '';
    currentExcerpt = content.excerpt || newsRun.articleExcerpt || '';
    currentSections = content.sections || [];
    currentLinkedinPost = content.linkedinPost || newsRun.linkedinCommentary || '';
    currentTags = content.tags || [];
  } else {
    chiefDraft = await getDraftById(String(draftId));
    if (!chiefDraft) {
      return { success: false, error: `Chief draft "${draftId}" not found.` };
    }
    const meta = chiefDraft.metadata || {};
    currentTitle = chiefDraft.title || '';
    currentExcerpt = chiefDraft.excerpt || '';
    currentSections = meta.rawSections || [];
    currentLinkedinPost = meta.linkedinPost || meta.linkedinCopy || '';
    currentTags = meta.tags || [];

    // Fallback if rawSections is empty: parse paragraphs from content
    if (currentSections.length === 0 && chiefDraft.content) {
      currentSections = [
        {
          heading: 'Overview & Analysis',
          paragraphs: chiefDraft.content.split('\n\n').filter(Boolean),
        },
      ];
    }
  }

  const systemPrompt = `You are JARVIS, the autonomous AI Chief of Staff and Lead Content Strategist for Prince (Founder of HeyPrince.in - Modern Web, AI Agents, Next.js, and Full-Stack Engineering).
The user is reviewing a scheduled or drafted blog article on their smartphone and has submitted specific refinement instructions.
Your job is to rewrite and refine the article to precisely follow the user's customization instructions while maintaining:
1. Deep technical precision, actionable engineering insights, and zero cliché fluff.
2. Modern web context (Next.js, React, Node.js, TypeScript, Cloud, AI swarms, high performance).
3. Clear structural hierarchy (engaging headings, quotes, actionable pro-tips, bullet points).
4. High-conversion LinkedIn social companion post with a killer hook and hashtags (#HeyPrince #Nextjs #AI #Tech #WebDev).

Respond ONLY with a valid JSON object matching this schema:
{
  "title": "Refined article title",
  "excerpt": "Refined executive summary (1-2 sentences)",
  "sections": [
    {
      "heading": "Section heading",
      "quote": "Optional bold insight or pullquote",
      "proTip": "Optional actionable pro tip",
      "paragraphs": ["Paragraph 1 text...", "Paragraph 2 text..."],
      "bulletPoints": ["Optional key point 1", "Optional key point 2"]
    }
  ],
  "linkedinPost": "Refined viral LinkedIn companion post",
  "tags": ["tag1", "tag2", "tag3"],
  "summaryOfChanges": "Brief 1-sentence note of what was changed according to user instructions"
}`;

  const userPrompt = `Current Article Draft:
Title: ${currentTitle}
Excerpt: ${currentExcerpt}
Sections:
${JSON.stringify(currentSections, null, 2)}
LinkedIn Post:
${currentLinkedinPost}

User's Customization Instructions:
"${instructions.trim()}"

Refine the draft now. Output valid JSON only.`;

  try {
    const aiRes = await callAIModel(systemPrompt, userPrompt, 'gemini-3.5-flash');
    let parsed: any;
    try {
      // Clean possible markdown code fences
      const cleanJson = aiRes.text.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = sanitizeAiContent(JSON.parse(cleanJson));
    } catch (parseErr) {
      console.error('[refineDraftWithAI] JSON parse failed, text:', aiRes.text);
      throw new Error('AI produced invalid JSON output. Please retry.');
    }

    const newTitle = parsed.title || currentTitle;
    const newExcerpt = parsed.excerpt || currentExcerpt;
    const newSections = Array.isArray(parsed.sections) && parsed.sections.length > 0 ? parsed.sections : currentSections;
    const newLinkedinPost = parsed.linkedinPost || currentLinkedinPost;
    const newTags = Array.isArray(parsed.tags) ? parsed.tags : currentTags;
    const summaryOfChanges = parsed.summaryOfChanges || 'Refined article content according to instructions.';

    if (isNewsRun && newsRun) {
      const updatedArticleContent: GeneratedContentPayload = {
        ...(newsRun.articleContent || {}),
        title: newTitle,
        excerpt: newExcerpt,
        sections: newSections,
        linkedinPost: newLinkedinPost,
        tags: newTags,
      };

      await updateDailyRun(newsRun.id, {
        articleTitle: newTitle,
        articleExcerpt: newExcerpt,
        articleContent: updatedArticleContent,
        linkedinCommentary: newLinkedinPost,
      });

      await logChiefActivity(
        'content_researcher',
        'info',
        `Refined scheduled blog run #${newsRun.id} via mobile approval screen: "${newTitle}"`,
        { runId: newsRun.id, userEmail, summaryOfChanges }
      );

      const refreshedRun = await getDailyRunById(newsRun.id);
      return {
        success: true,
        summaryOfChanges,
        draft: {
          id: newsRun.id,
          sourceType: 'news',
          title: newTitle,
          excerpt: newExcerpt,
          sections: newSections,
          linkedinPost: newLinkedinPost,
          tags: newTags,
          coverImage: updatedArticleContent.coverImage,
          slug: updatedArticleContent.slug,
          readMins: updatedArticleContent.readMins || '5 min',
          categoryName: updatedArticleContent.categoryName || 'Technology',
          raw: refreshedRun,
        },
      };
    } else if (chiefDraft) {
      const meta = chiefDraft.metadata || {};
      const updatedMeta = {
        ...meta,
        rawSections: newSections,
        linkedinPost: newLinkedinPost,
        linkedinCopy: newLinkedinPost,
        tags: newTags,
        lastRefinement: summaryOfChanges,
        refinedAt: new Date().toISOString(),
        refinedBy: userEmail || 'admin',
      };

      const newContent = sectionsToMarkdown(newSections, newExcerpt);

      await updateDraftContent(chiefDraft.id, {
        title: newTitle,
        excerpt: newExcerpt,
        content: newContent,
        metadata: updatedMeta,
      });

      await logChiefActivity(
        'content_researcher',
        'info',
        `Refined draft #${chiefDraft.id} via mobile approval screen: "${newTitle}"`,
        { draftId: chiefDraft.id, userEmail, summaryOfChanges }
      );

      const refreshedDraft = await getDraftById(chiefDraft.id);
      return {
        success: true,
        summaryOfChanges,
        draft: {
          id: chiefDraft.id,
          sourceType: 'chief',
          title: newTitle,
          excerpt: newExcerpt,
          sections: newSections,
          linkedinPost: newLinkedinPost,
          tags: newTags,
          coverImage: updatedMeta.coverImage || updatedMeta.featured_image_url || '/assets/blog/photo1.webp',
          slug: updatedMeta.slug || '',
          readMins: updatedMeta.readMins || '5 min',
          categoryName: updatedMeta.category || 'Technology',
          raw: refreshedDraft,
        },
      };
    }

    return { success: false, error: 'Draft record could not be updated.' };
  } catch (err: any) {
    console.error('[refineDraftWithAI] Error:', err);
    return { success: false, error: err?.message || 'Failed to refine draft with AI.' };
  }
}

