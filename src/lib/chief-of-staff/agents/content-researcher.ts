import { executeDailyNewsAutomation } from '../../daily-news/orchestrator';
import { createPost } from '../../admin-db';
import { publishArticleToLinkedIn } from '../../linkedin/client';
import { sendPushToAllAdmins } from '../../push/push-service';
import {
  createContentDraft,
  updateDraftStatus,
  getDrafts,
  logChiefActivity,
  incrementAgentStats,
  updateAgentExecutionTime,
  getAgentById,
} from '../db';
import { ChiefContentDraft } from '../types';

export async function runContentResearcherDiscovery(options?: {
  customTopic?: string;
}): Promise<{
  draftId?: string;
  success: boolean;
  title?: string;
  summary: string;
}> {
  const startTime = Date.now();
  const agent = await getAgentById('content_researcher');
  const mode = agent?.mode || 'prepare';

  await logChiefActivity(
    'content_researcher',
    'info',
    'Started autonomous technology research and article drafting',
    { customTopic: options?.customTopic, mode }
  );

  try {
    // Run automation in preview mode to generate full article without immediately publishing to public blog
    const result = await executeDailyNewsAutomation({
      triggerType: 'preview',
      contentType: options?.customTopic ? 'custom_topic' : 'tech_news',
      customTopic: options?.customTopic,
      forceRunToday: true,
    });

    if (!result.success || !result.generatedContent) {
      throw new Error(result.error || 'Failed to generate content from research sources');
    }

    const gen = result.generatedContent;
    const draftTitle = gen.title;
    const draftExcerpt = gen.excerpt;

    // Convert sections to readable markdown for preview in Chief of Staff dashboard
    let markdownBody = `## ${gen.title}\n\n`;
    if (gen.coverImage) {
      markdownBody += `![Cover Image](${gen.coverImage})\n\n`;
    }
    markdownBody += `> **Category:** ${gen.categoryName} • **Estimated Read:** ${gen.readMins}\n\n`;

    for (const sec of gen.sections) {
      markdownBody += `### ${sec.heading}\n\n`;
      if (sec.quote) {
        markdownBody += `> "${sec.quote}"\n\n`;
      }
      for (const p of sec.paragraphs) {
        markdownBody += `${p}\n\n`;
      }
      if (sec.bulletPoints && sec.bulletPoints.length > 0) {
        for (const b of sec.bulletPoints) {
          markdownBody += `- ${b}\n`;
        }
        markdownBody += '\n';
      }
      if (sec.proTip) {
        markdownBody += `**Pro-Tip:** ${sec.proTip}\n\n`;
      }
    }

    if (gen.linkedinPost) {
      markdownBody += `---\n### LinkedIn Social Post Variation\n\`\`\`text\n${gen.linkedinPost}\n\`\`\`\n`;
    }

    // Save draft into chief_content_drafts
    const draftId = await createContentDraft({
      agentId: 'content_researcher',
      draftType: 'article',
      title: draftTitle,
      excerpt: draftExcerpt,
      content: markdownBody,
      metadata: {
        slug: gen.slug,
        category: gen.categoryName,
        readMins: gen.readMins,
        tags: gen.tags,
        seoTitle: gen.seoTitle,
        seoDescription: gen.seoDescription,
        coverImage: gen.coverImage,
        sectionImages: gen.sectionImages,
        rawSections: gen.sections,
        linkedinPost: gen.linkedinPost,
        sourcesCount: result.sourcesChecked,
      },
      status: 'pending_approval',
    });

    // Notify Admin via iPhone Web Push
    try {
      await sendPushToAllAdmins({
        title: '🤖 JARVIS: New Draft Ready for Review',
        body: `"${draftTitle}" - Tap to review & customize on your phone`,
        url: `/admin/approvals?draftId=${draftId}`,
        draftId,
      });
    } catch (pushErr) {
      console.warn('[content-researcher] Push alert error:', pushErr);
    }

    const duration = Date.now() - startTime;
    await updateAgentExecutionTime('content_researcher', new Date(), new Date(Date.now() + 24 * 3600 * 1000));
    await incrementAgentStats('content_researcher', true, 1, 2400);

    await logChiefActivity(
      'content_researcher',
      'success',
      `Drafted article "${draftTitle}" awaiting approval`,
      { draftId, slug: gen.slug, durationMs: duration }
    );

    return {
      draftId,
      success: true,
      title: draftTitle,
      summary: `Successfully gathered tech developments and drafted "${draftTitle}".`,
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    await incrementAgentStats('content_researcher', false);
    await logChiefActivity(
      'content_researcher',
      'error',
      `Failed content research run: ${err?.message || 'Unknown error'}`,
      { error: err?.message, durationMs: duration }
    );

    return {
      success: false,
      summary: `Content research failed: ${err?.message || 'Unknown error'}`,
    };
  }
}

export async function approveAndPublishDraft(
  draftId: string,
  options?: { publishToLinkedIn?: boolean }
): Promise<{
  success: boolean;
  publishedUrl?: string;
  linkedInUrl?: string;
  error?: string;
}> {
  const drafts = await getDrafts(undefined, 100);
  const draft = drafts.find((d) => d.id === draftId);

  if (!draft) {
    return { success: false, error: 'Draft not found' };
  }

  if (draft.draft_type === 'article') {
    const meta = draft.metadata || {};
    const rawSections = meta.rawSections || [];

    const dbSections = rawSections.map((s: any) => ({
      heading: s.heading,
      quote: s.quote,
      pro_tip: s.proTip,
      paragraphs: (s.paragraphs || []).map((p: string) => ({ text: p })),
      bullet_points: s.bulletPoints ? s.bulletPoints.map((b: string) => ({ point: b })) : undefined,
    }));

    // Create post in published status
    const postRes = await createPost({
      title: draft.title,
      slug: meta.slug || `insight-${Date.now()}`,
      excerpt: draft.excerpt || '',
      read_mins: meta.readMins || '5 min',
      category_name: meta.category || 'Technology & Engineering',
      status: 'published',
      published_at: new Date().toISOString(),
      cover_image: meta.coverImage || '/assets/blog/photo1.webp',
      seo_title: meta.seoTitle || draft.title,
      seo_description: meta.seoDescription || draft.excerpt || '',
      canonical: `https://heyprince.in/insights/${meta.slug}/`,
      tags: (meta.tags || []).map((t: string) => ({ tag: t })),
      sections: dbSections,
    });

    if (!postRes.success || !postRes.post) {
      return { success: false, error: postRes.error || 'Failed to save post to CMS' };
    }

    const postUrl = `https://heyprince.in/insights/${postRes.post.slug}/`;
    let linkedInUrl: string | undefined;

    // Publish to LinkedIn if selected
    if (options?.publishToLinkedIn && (meta.linkedinPost || meta.linkedinCopy)) {
      try {
        const liRes = await publishArticleToLinkedIn({
          postId: postRes.post.id,
          customCommentary: meta.linkedinPost || meta.linkedinCopy,
          imageUrl: meta.coverImage,
        });
        if (liRes.success) {
          linkedInUrl = (liRes as any).postUrn || (liRes as any).postUrl;
        }
      } catch (liErr) {
        console.warn('[approveAndPublishDraft] LinkedIn share error:', liErr);
      }
    }

    await updateDraftStatus(draftId, 'published');
    await logChiefActivity(
      'content_researcher',
      'success',
      `Published approved article "${draft.title}" to live website`,
      { draftId, postUrl, linkedInUrl }
    );

    return {
      success: true,
      publishedUrl: postUrl,
      linkedInUrl,
    };
  }

  // Generic approval for other drafts (e.g. proposals or SEO patches)
  await updateDraftStatus(draftId, 'approved');
  await logChiefActivity(
    draft.agent_id,
    'success',
    `Approved draft "${draft.title}"`,
    { draftId, draftType: draft.draft_type }
  );

  return { success: true };
}
