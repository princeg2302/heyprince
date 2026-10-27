import {
  DailyNewsRunRecord,
  OrchestrationResult,
  RunStatus,
  WebsiteStatus,
  LinkedInStatus,
  GeneratedContentPayload,
} from './types';
import {
  getDailyNewsSettings,
  getDailyRunByDate,
  getDailyRunById,
  createDailyRun,
  updateDailyRun,
  markNewsItemsUsed,
} from './db';
import { collectDailyNews } from './rss-collector';
import { generateDailyPost, generateCustomTopicPost } from './content-generator';
import { generateDailyBlogImages, generateDynamicEditorialImageFallback } from './image-generator';
import { generateOfficeHumourMeme } from './meme-generator';
import { createPost } from '../admin-db';
import { publishArticleToLinkedIn } from '../linkedin/client';

export async function executeDailyNewsAutomation(params?: {
  triggerType?: 'scheduled' | 'manual_run' | 'preview';
  forceRunToday?: boolean;
  contentType?: 'tech_news' | 'office_humour_meme' | 'custom_topic';
  customTopic?: string;
}): Promise<OrchestrationResult> {
  const triggerType = params?.triggerType || 'scheduled';
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Fetch current settings
  const settings = await getDailyNewsSettings();

  // If automation paused and scheduled trigger, skip
  if (!settings.isEnabled && triggerType === 'scheduled') {
    return {
      success: true,
      runDate: todayStr,
      status: 'skipped',
      websiteStatus: 'skipped',
      linkedinStatus: 'skipped',
      sourcesChecked: 0,
      itemsDiscovered: 0,
      duplicatesSkipped: 0,
      warnings: ['Daily news automation is currently paused in settings.'],
    };
  }

  // 2. Enforce strict idempotency: check if today's run already exists
  if (triggerType === 'scheduled' && !params?.forceRunToday) {
    const existingRun = await getDailyRunByDate(todayStr);
    if (existingRun && (existingRun.status === 'success' || existingRun.status === 'running')) {
      return {
        success: true,
        runId: existingRun.id,
        runDate: todayStr,
        status: 'skipped',
        websiteStatus: existingRun.websiteStatus,
        linkedinStatus: existingRun.linkedinStatus,
        postId: existingRun.postId,
        sourcesChecked: existingRun.sourcesChecked,
        itemsDiscovered: existingRun.itemsDiscovered,
        duplicatesSkipped: existingRun.duplicatesSkipped,
        warnings: [`Run for ${todayStr} has already executed with status '${existingRun.status}'.`],
      };
    }
  }

  // 3. Initialize run record in database
  let run: DailyNewsRunRecord;
  try {
    run = await createDailyRun({
      runDate: todayStr,
      triggerType,
    });
  } catch (err: any) {
    // If unique constraint caught another concurrent execution
    return {
      success: false,
      runDate: todayStr,
      status: 'failed',
      websiteStatus: 'failed',
      linkedinStatus: 'failed',
      sourcesChecked: 0,
      itemsDiscovered: 0,
      duplicatesSkipped: 0,
      error: `Could not initialize daily run: ${err?.message || 'Database lock'}`,
    };
  }

  try {
    const activeContentType =
      params?.contentType ||
      settings.currentContentType ||
      (new Date().getDay() === 5 || new Date().getDay() === 6 ? 'office_humour_meme' : 'tech_news');

    // Branch A: Original Indian Office-Humour Meme
    if (activeContentType === 'office_humour_meme') {
      const meme = await generateOfficeHumourMeme();

      await updateDailyRun(run.id, {
        articleTitle: meme.title,
        articleSlug: meme.slug,
        articleExcerpt: meme.excerpt,
        articleContent: {
          title: meme.title,
          slug: meme.slug,
          excerpt: meme.excerpt,
          readMins: meme.readMins,
          categoryName: meme.categoryName,
          tags: meme.tags,
          sections: meme.sections,
          sourcesUsed: [],
          seoTitle: meme.seoTitle,
          seoDescription: meme.seoDescription,
          linkedinPost: meme.linkedinPost,
          rationale: 'Original Indian workplace humour concept with custom SVG card',
          coverImage: meme.imageUrl,
        },
        linkedinCommentary: meme.linkedinPost,
      });

      // Meme card image is already set as cover_image; keep section paragraphs clean to prevent duplicate display
      const previewSections = meme.sections;

      const dbSections = previewSections.map((s) => ({
        heading: s.heading,
        quote: s.quote,
        pro_tip: s.proTip,
        paragraphs: s.paragraphs.map((p) => ({ text: p })),
        bullet_points: s.bulletPoints ? s.bulletPoints.map((b) => ({ point: b })) : undefined,
      }));

      if (triggerType === 'preview') {
        await updateDailyRun(run.id, {
          status: 'success',
          websiteStatus: 'draft_saved',
          linkedinStatus: 'skipped',
          completedAt: new Date().toISOString(),
        });

        return {
          success: true,
          runId: run.id,
          runDate: todayStr,
          status: 'success',
          websiteStatus: 'draft_saved',
          linkedinStatus: 'skipped',
          sourcesChecked: 0,
          itemsDiscovered: 0,
          duplicatesSkipped: 0,
          generatedContent: {
            title: meme.title,
            slug: meme.slug,
            excerpt: meme.excerpt,
            readMins: meme.readMins,
            categoryName: meme.categoryName,
            tags: meme.tags,
            sections: previewSections,
            sourcesUsed: [],
            seoTitle: meme.seoTitle,
            seoDescription: meme.seoDescription,
            linkedinPost: meme.linkedinPost,
            rationale: 'Original Indian workplace humour concept with custom SVG card',
            coverImage: meme.imageUrl,
          },
        };
      }

      // Persist to CMS
      const isWebsitePublished = settings.autoPublishWebsite;
      const postStatus = isWebsitePublished ? 'published' : 'draft';

      const postCreateResult = await createPost({
        title: meme.title,
        slug: meme.slug,
        excerpt: meme.excerpt,
        read_mins: meme.readMins,
        category_name: meme.categoryName,
        status: postStatus,
        published_at: isWebsitePublished ? new Date().toISOString() : null,
        cover_image: meme.imageUrl,
        seo_title: meme.seoTitle,
        seo_description: meme.seoDescription,
        canonical: `https://heyprince.in/insights/${meme.slug}/`,
        tags: meme.tags.map((t) => ({ tag: t })),
        sections: dbSections,
      });

      if (!postCreateResult.success || !postCreateResult.post) {
        throw new Error(`Failed to create meme post in CMS: ${postCreateResult.error || 'Unknown error'}`);
      }

      const createdPost = postCreateResult.post;
      const postUrl = `https://heyprince.in/insights/${createdPost.slug}/`;

      const websiteStatus: WebsiteStatus = isWebsitePublished ? 'published' : 'draft_saved';

      await updateDailyRun(run.id, {
        postId: createdPost.id,
        websiteStatus,
      });

      // Stage 4: Publish to LinkedIn
      let linkedinStatus: LinkedInStatus = 'skipped';
      let linkedinPostUrn: string | null = null;
      let linkedinShareUrl: string | null = null;
      let linkedinError: string | null = null;

      if (settings.autoPublishLinkedIn) {
        if (postStatus !== 'published') {
          linkedinStatus = 'pending';
        } else {
          try {
            const liRes = await publishArticleToLinkedIn({
              postId: createdPost.id,
              customCommentary: meme.linkedinPost,
              imageUrl: meme.imageUrl,
            });

            if (liRes.success) {
              linkedinStatus = 'published';
              linkedinPostUrn = liRes.postUrn || null;
              linkedinShareUrl = liRes.postUrl || null;
            } else {
              linkedinStatus = liRes.error?.includes('connect') ? 'needs_reconnect' : 'failed';
              linkedinError = liRes.error || 'LinkedIn API returned failure';
            }
          } catch (liErr: any) {
            linkedinStatus = 'failed';
            linkedinError = liErr?.message || 'LinkedIn publish exception';
          }
        }
      }

      let finalRunStatus: RunStatus = 'success';
      if (linkedinError) {
        finalRunStatus = 'partial_success';
      }

      await updateDailyRun(run.id, {
        status: finalRunStatus,
        websiteStatus,
        linkedinStatus,
        linkedinPostUrn,
        linkedinShareUrl,
        errorDetails: linkedinError
          ? { stage: 'linkedin', message: linkedinError, timestamp: new Date().toISOString() }
          : null,
        completedAt: new Date().toISOString(),
      });

      return {
        success: true,
        runId: run.id,
        runDate: todayStr,
        status: finalRunStatus,
        websiteStatus,
        linkedinStatus,
        postId: createdPost.id,
        postSlug: createdPost.slug,
        postUrl,
        linkedinPostUrn,
        linkedinShareUrl,
        sourcesChecked: 0,
        itemsDiscovered: 0,
        duplicatesSkipped: 0,
        generatedContent: {
          title: meme.title,
          slug: meme.slug,
          excerpt: meme.excerpt,
          readMins: meme.readMins,
          categoryName: meme.categoryName,
          tags: meme.tags,
          sections: previewSections,
          sourcesUsed: [],
          seoTitle: meme.seoTitle,
          seoDescription: meme.seoDescription,
          linkedinPost: meme.linkedinPost,
          rationale: 'Original Indian workplace humour concept with custom SVG card',
          coverImage: meme.imageUrl,
        },
        warnings: linkedinError ? [`LinkedIn publishing notice: ${linkedinError}`] : undefined,
      };
    }

    // Branch B or C: Daily Technology News OR Custom Topic / Festival Generation
    let generated: GeneratedContentPayload;
    let collection = {
      sourcesChecked: 0,
      itemsDiscovered: 0,
      duplicatesSkipped: 0,
      availableItems: [] as any[],
    };

    if (activeContentType === 'custom_topic' || Boolean(params?.customTopic)) {
      const topicPrompt = params?.customTopic?.trim() || 'Software Architecture, System Design, and Modern Engineering Strategy';
      generated = await generateCustomTopicPost(topicPrompt, settings.aiModel);

      await updateDailyRun(run.id, {
        sourcesChecked: 0,
        itemsDiscovered: 0,
        duplicatesSkipped: 0,
        selectedItems: [
          {
            headline: `Custom Prompt: ${topicPrompt}`,
            url: 'https://heyprince.in',
            sourceName: 'Admin Custom Topic',
            publishedAt: new Date().toISOString(),
          },
        ],
        articleTitle: generated.title,
        articleSlug: generated.slug,
        articleExcerpt: generated.excerpt,
        articleContent: generated,
        linkedinCommentary: generated.linkedinPost,
      });
    } else {
      // 4. Stage 1: Collect & Deduplicate News from RSS Feeds
      collection = await collectDailyNews(settings.lookbackHours);

      await updateDailyRun(run.id, {
        sourcesChecked: collection.sourcesChecked,
        itemsDiscovered: collection.itemsDiscovered,
        duplicatesSkipped: collection.duplicatesSkipped,
      });

      if (collection.availableItems.length === 0) {
        const emptyErr = 'No verified tech stories found within the configured lookback window.';
        await updateDailyRun(run.id, {
          status: 'failed',
          websiteStatus: 'failed',
          linkedinStatus: 'failed',
          errorDetails: { stage: 'collection', message: emptyErr, timestamp: new Date().toISOString() },
          completedAt: new Date().toISOString(),
        });

        return {
          success: false,
          runId: run.id,
          runDate: todayStr,
          status: 'failed',
          websiteStatus: 'failed',
          linkedinStatus: 'failed',
          sourcesChecked: collection.sourcesChecked,
          itemsDiscovered: collection.itemsDiscovered,
          duplicatesSkipped: collection.duplicatesSkipped,
          error: emptyErr,
        };
      }

      // 5. Stage 2: AI Generation of Humanized Post
      generated = await generateDailyPost(collection.availableItems, settings.aiModel);

      // Save selected items for transparency
      const selectedSummary = collection.availableItems.slice(0, 5).map((i) => ({
        headline: i.headline,
        url: i.url,
        sourceName: i.sourceName,
        publishedAt: i.publishedAt,
      }));

      await updateDailyRun(run.id, {
        selectedItems: selectedSummary,
        articleTitle: generated.title,
        articleSlug: generated.slug,
        articleExcerpt: generated.excerpt,
        articleContent: generated,
        linkedinCommentary: generated.linkedinPost,
      });
    }

    // 5.5 Stage 2.5: Generate 3 Visual Assets (1 Cover + 2 Section Illustrations) & Catalog in Media Vault
    let coverImageUrl = '';
    let generatedSectionImages: any[] = [];
    try {
      const blogImages = await generateDailyBlogImages(
        generated.title,
        generated.categoryName,
        generated.sections
      );
      if (blogImages?.coverImage?.url) {
        coverImageUrl = blogImages.coverImage.url;
      }
      generatedSectionImages = blogImages?.sectionImages || [];
    } catch (imgErr) {
      console.warn('[orchestrator] Blog image generation warning:', imgErr);
    }

    // Zero-Duplicate Guarantee: If coverImageUrl is empty or placeholder, generate dynamic editorial SVG
    if (!coverImageUrl || coverImageUrl === '/assets/blog/photo1.webp') {
      try {
        const fallbackCard = await generateDynamicEditorialImageFallback(
          generated.title,
          generated.categoryName,
          'cover'
        );
        coverImageUrl = fallbackCard.url;
      } catch (fbErr) {
        console.warn('[orchestrator] Fallback editorial card generation notice:', fbErr);
      }
    }

    // Format section paragraphs to include section illustrations
    const previewSections = generated.sections.map((s, idx) => {
      const paragraphs = [...s.paragraphs];

      // Attach Section Image 1 to Section 1 (idx 0)
      if (idx === 0 && generatedSectionImages[0]?.url) {
        paragraphs.push(
          `![${generatedSectionImages[0].alt}](${generatedSectionImages[0].url} "${generatedSectionImages[0].caption}")`
        );
      }
      // Attach Section Image 2 to Section 2 (idx 1)
      else if (idx === 1 && generatedSectionImages[1]?.url) {
        paragraphs.push(
          `![${generatedSectionImages[1].alt}](${generatedSectionImages[1].url} "${generatedSectionImages[1].caption}")`
        );
      }

      return {
        ...s,
        paragraphs,
      };
    });

    const dbSections = previewSections.map((s) => ({
      heading: s.heading,
      quote: s.quote,
      pro_tip: s.proTip,
      paragraphs: s.paragraphs.map((p) => ({ text: p })),
      bullet_points: s.bulletPoints ? s.bulletPoints.map((b) => ({ point: b })) : undefined,
    }));

    // If preview mode, return without persisting to public posts table or LinkedIn
    if (triggerType === 'preview') {
      await updateDailyRun(run.id, {
        status: 'success',
        websiteStatus: 'draft_saved',
        linkedinStatus: 'skipped',
        completedAt: new Date().toISOString(),
      });

      return {
        success: true,
        runId: run.id,
        runDate: todayStr,
        status: 'success',
        websiteStatus: 'draft_saved',
        linkedinStatus: 'skipped',
        sourcesChecked: collection.sourcesChecked,
        itemsDiscovered: collection.itemsDiscovered,
        duplicatesSkipped: collection.duplicatesSkipped,
        generatedContent: {
          ...generated,
          coverImage: coverImageUrl,
          sectionImages: generatedSectionImages,
          sections: previewSections,
        },
      };
    }

    // 6. Stage 3: Save to Existing Posts Table (Admin CMS & Frontend)
    const isWebsitePublished = settings.autoPublishWebsite;
    const postStatus = isWebsitePublished ? 'published' : 'draft';

    const postCreateResult = await createPost({
      title: generated.title,
      slug: generated.slug,
      excerpt: generated.excerpt,
      read_mins: generated.readMins,
      category_name: generated.categoryName,
      status: postStatus,
      published_at: isWebsitePublished ? new Date().toISOString() : null,
      cover_image: coverImageUrl,
      seo_title: generated.seoTitle,
      seo_description: generated.seoDescription,
      canonical: `https://heyprince.in/insights/${generated.slug}/`,
      tags: generated.tags.map((t) => ({ tag: t })),
      sections: dbSections,
    });

    if (!postCreateResult.success || !postCreateResult.post) {
      throw new Error(`Failed to create post record in CMS: ${postCreateResult.error || 'Unknown error'}`);
    }

    const createdPost = postCreateResult.post;
    const postUrl = `https://heyprince.in/insights/${createdPost.slug}/`;

    // Mark used news items in database to prevent reuse (if from RSS collection)
    if (collection.availableItems && collection.availableItems.length > 0) {
      const usedIds = collection.availableItems
        .slice(0, 5)
        .map((i) => i.id)
        .filter((id): id is number => typeof id === 'number');
      if (usedIds.length > 0) {
        await markNewsItemsUsed(usedIds, run.id);
      }
    }

    const websiteStatus: WebsiteStatus = isWebsitePublished ? 'published' : 'draft_saved';

    await updateDailyRun(run.id, {
      postId: createdPost.id,
      websiteStatus,
    });

    // 7. Stage 4: Publish to LinkedIn (if enabled & website post published)
    let linkedinStatus: LinkedInStatus = 'skipped';
    let linkedinPostUrn: string | null = null;
    let linkedinShareUrl: string | null = null;
    let linkedinError: string | null = null;

    if (settings.autoPublishLinkedIn) {
      if (postStatus !== 'published') {
        linkedinStatus = 'pending'; // Waiting for manual approval / publish of the draft
      } else {
        try {
          const liRes = await publishArticleToLinkedIn({
            postId: createdPost.id,
            customCommentary: generated.linkedinPost,
            imageUrl: coverImageUrl,
          });

          if (liRes.success) {
            linkedinStatus = 'published';
            linkedinPostUrn = liRes.postUrn || null;
            linkedinShareUrl = liRes.postUrl || null;
          } else {
            linkedinStatus = liRes.error?.includes('connect') ? 'needs_reconnect' : 'failed';
            linkedinError = liRes.error || 'LinkedIn API returned failure';
          }
        } catch (liErr: any) {
          linkedinStatus = 'failed';
          linkedinError = liErr?.message || 'LinkedIn publish exception';
        }
      }
    }

    // Determine overall run status
    let finalRunStatus: RunStatus = 'success';
    if (linkedinError) {
      finalRunStatus = 'partial_success'; // Article is on website, but LinkedIn needs retry
    }

    await updateDailyRun(run.id, {
      status: finalRunStatus,
      websiteStatus,
      linkedinStatus,
      linkedinPostUrn,
      linkedinShareUrl,
      errorDetails: linkedinError
        ? { stage: 'linkedin', message: linkedinError, timestamp: new Date().toISOString() }
        : null,
      completedAt: new Date().toISOString(),
    });

    return {
      success: true,
      runId: run.id,
      runDate: todayStr,
      status: finalRunStatus,
      websiteStatus,
      linkedinStatus,
      postId: createdPost.id,
      postSlug: createdPost.slug,
      postUrl,
      linkedinPostUrn,
      linkedinShareUrl,
      sourcesChecked: collection.sourcesChecked,
      itemsDiscovered: collection.itemsDiscovered,
      duplicatesSkipped: collection.duplicatesSkipped,
      generatedContent: generated,
      warnings: linkedinError ? [`LinkedIn publishing notice: ${linkedinError}`] : undefined,
    };
  } catch (error: any) {
    const errorMsg = error?.message || 'Unhandled error during daily news automation';
    console.error('[DailyNewsOrchestrator] Execution failed:', error);

    await updateDailyRun(run.id, {
      status: 'failed',
      websiteStatus: 'failed',
      linkedinStatus: 'failed',
      errorDetails: {
        stage: 'orchestration',
        message: errorMsg,
        timestamp: new Date().toISOString(),
      },
      completedAt: new Date().toISOString(),
    });

    return {
      success: false,
      runId: run.id,
      runDate: todayStr,
      status: 'failed',
      websiteStatus: 'failed',
      linkedinStatus: 'failed',
      sourcesChecked: run.sourcesChecked || 0,
      itemsDiscovered: run.itemsDiscovered || 0,
      duplicatesSkipped: run.duplicatesSkipped || 0,
      error: errorMsg,
    };
  }
}

// ============================================================================
// Safe LinkedIn Retry (Guaranteed Idempotent & Duplicate-Safe)
// ============================================================================

export async function retryLinkedInPublishForRun(runId: number): Promise<{
  success: boolean;
  postUrn?: string;
  feedUrl?: string;
  error?: string;
}> {
  const runs = await (await import('./db')).getRecentDailyRuns(50);
  const run = runs.find((r) => r.id === runId);

  if (!run) {
    return { success: false, error: `Run #${runId} not found.` };
  }

  // Idempotency: prevent double-posting to LinkedIn
  if (run.linkedinStatus === 'published' && run.linkedinPostUrn) {
    return {
      success: false,
      error: `Article was already published to LinkedIn (URN: ${run.linkedinPostUrn}). Duplicate publishing is prevented.`,
    };
  }

  if (!run.postId) {
    return {
      success: false,
      error: 'Run does not have an associated website article post ID.',
    };
  }

  try {
    const result = await publishArticleToLinkedIn({
      postId: run.postId,
      customCommentary: run.linkedinCommentary,
    });

    if (result.success) {
      await updateDailyRun(run.id, {
        linkedinStatus: 'published',
        linkedinPostUrn: result.postUrn || null,
        linkedinShareUrl: result.postUrl || null,
        status: 'success',
      });

      return {
        success: true,
        postUrn: result.postUrn,
        feedUrl: result.postUrl,
      };
    } else {
      await updateDailyRun(run.id, {
        linkedinStatus: result.error?.includes('connect') ? 'needs_reconnect' : 'failed',
        errorDetails: {
          stage: 'linkedin_retry',
          message: result.error || 'Retry failed',
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: false,
        error: result.error || 'LinkedIn API publish failed',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'LinkedIn publish exception during retry',
    };
  }
}

export async function publishDraftRun(runId: number): Promise<{
  success: boolean;
  postId?: number;
  postSlug?: string;
  postUrl?: string;
  linkedinStatus?: LinkedInStatus;
  linkedinShareUrl?: string;
  error?: string;
}> {
  const run = await getDailyRunById(runId);
  if (!run) {
    return { success: false, error: `Run #${runId} not found.` };
  }

  if (run.postId) {
    return {
      success: true,
      postId: run.postId,
      postSlug: run.articleSlug,
      postUrl: `https://heyprince.in/insights/${run.articleSlug}/`,
      linkedinStatus: run.linkedinStatus,
      linkedinShareUrl: run.linkedinShareUrl || undefined,
    };
  }

  const content = run.articleContent;
  if (!content || !content.title || !content.slug) {
    return { success: false, error: 'Run does not have valid generated article content to publish.' };
  }

  const settings = await getDailyNewsSettings();

  const previewSections = content.sections || [];
  const dbSections = previewSections.map((s) => ({
    heading: s.heading,
    quote: s.quote,
    pro_tip: s.proTip,
    paragraphs: s.paragraphs.map((p) => ({ text: p })),
    bullet_points: s.bulletPoints ? s.bulletPoints.map((b) => ({ point: b })) : undefined,
  }));

  let directCoverImage = (content as any).coverImage;
  if (!directCoverImage || directCoverImage === '/assets/blog/photo1.webp') {
    try {
      const fallbackCard = await generateDynamicEditorialImageFallback(
        content.title,
        content.categoryName || 'Artificial Intelligence',
        'cover'
      );
      directCoverImage = fallbackCard.url;
    } catch {
      directCoverImage = undefined;
    }
  }

  const postCreateResult = await createPost({
    title: content.title,
    slug: content.slug,
    excerpt: content.excerpt,
    read_mins: content.readMins || '5 min',
    category_name: content.categoryName || 'Artificial Intelligence',
    status: 'published',
    published_at: new Date().toISOString(),
    cover_image: directCoverImage,
    seo_title: content.seoTitle || content.title,
    seo_description: content.seoDescription || content.excerpt,
    canonical: `https://heyprince.in/insights/${content.slug}/`,
    tags: (content.tags || []).map((t: string) => ({ tag: t })),
    sections: dbSections,
  });

  if (!postCreateResult.success || !postCreateResult.post) {
    return { success: false, error: postCreateResult.error || 'Failed to create post record in CMS' };
  }

  const createdPost = postCreateResult.post;
  const postUrl = `https://heyprince.in/insights/${createdPost.slug}/`;

  let linkedinStatus: LinkedInStatus = 'skipped';
  let linkedinPostUrn: string | null = null;
  let linkedinShareUrl: string | null = null;
  let linkedinError: string | null = null;

  if (settings.autoPublishLinkedIn) {
    try {
      const liRes = await publishArticleToLinkedIn({
        postId: createdPost.id,
        customCommentary: content.linkedinPost || run.linkedinCommentary,
      });

      if (liRes.success) {
        linkedinStatus = 'published';
        linkedinPostUrn = liRes.postUrn || null;
        linkedinShareUrl = liRes.postUrl || null;
      } else {
        linkedinStatus = liRes.error?.includes('connect') ? 'needs_reconnect' : 'failed';
        linkedinError = liRes.error || 'LinkedIn API returned failure';
      }
    } catch (liErr: any) {
      linkedinStatus = 'failed';
      linkedinError = liErr?.message || 'LinkedIn publish exception';
    }
  }

  await updateDailyRun(run.id, {
    postId: createdPost.id,
    websiteStatus: 'published',
    status: 'success',
    linkedinStatus,
    linkedinPostUrn,
    linkedinShareUrl,
  });

  return {
    success: true,
    postId: createdPost.id,
    postSlug: createdPost.slug,
    postUrl,
    linkedinStatus,
    linkedinShareUrl: linkedinShareUrl || undefined,
    error: linkedinError || undefined,
  };
}

