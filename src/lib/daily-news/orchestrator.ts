import {
  DailyNewsRunRecord,
  OrchestrationResult,
  RunStatus,
  WebsiteStatus,
  LinkedInStatus,
} from './types';
import {
  getDailyNewsSettings,
  getDailyRunByDate,
  createDailyRun,
  updateDailyRun,
  markNewsItemsUsed,
} from './db';
import { collectDailyNews } from './rss-collector';
import { generateDailyPost } from './content-generator';
import { generateDailyBlogImages } from './image-generator';
import { createPost } from '../admin-db';
import { publishArticleToLinkedIn } from '../linkedin/client';

export async function executeDailyNewsAutomation(params?: {
  triggerType?: 'scheduled' | 'manual_run' | 'preview';
  forceRunToday?: boolean;
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
    // 4. Stage 1: Collect & Deduplicate News from RSS Feeds
    const collection = await collectDailyNews(settings.lookbackHours);

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
    const generated = await generateDailyPost(collection.availableItems, settings.aiModel);

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

    // 5.5 Stage 2.5: Generate 3 Visual Assets (1 Cover + 2 Section Illustrations) & Catalog in Media Vault
    let coverImageUrl = '/assets/blog/photo1.webp';
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

    // Mark used news items in database to prevent reuse
    const usedIds = collection.availableItems
      .slice(0, 5)
      .map((i) => i.id)
      .filter((id): id is number => typeof id === 'number');
    await markNewsItemsUsed(usedIds, run.id);

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

