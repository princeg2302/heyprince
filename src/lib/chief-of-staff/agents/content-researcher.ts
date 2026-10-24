import { executeDailyNewsAutomation } from '../../daily-news/orchestrator';
import { createPost, createService } from '../../admin-db';
import { publishArticleToLinkedIn } from '../../linkedin/client';
import { sendPushToAllAdmins } from '../../push/push-service';
import { servicesList } from '@/data/servicesData';
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
import {
  checkContentDuplicate,
  computeContentHash,
} from '../../deduplication';

export interface ContentResearcherOptions {
  customTopic?: string;
  contentType?: 'blog_article' | 'service_page' | 'website_content' | 'seo_patch';
  targetUrl?: string;
}

export async function runContentResearcherDiscovery(options?: ContentResearcherOptions): Promise<{
  draftId?: string;
  success: boolean;
  title?: string;
  summary: string;
}> {
  const startTime = Date.now();
  const agent = await getAgentById('content_researcher');
  const mode = agent?.mode || 'prepare';
  const contentType = options?.contentType || 'blog_article';

  await logChiefActivity(
    'content_researcher',
    'info',
    `Started autonomous content research for [${contentType}]`,
    { customTopic: options?.customTopic, contentType, mode }
  );

  // ==========================================================================
  // BRANCH 1: SERVICE PAGE OPPORTUNITY RESEARCH & BLUEPRINT
  // ==========================================================================
  if (contentType === 'service_page') {
    try {
      const serviceCandidates = [
        {
          slug: 'wordpress-to-nextjs-migration',
          title: 'WooCommerce & WordPress to Headless Next.js Migration',
          shortTitle: 'Headless Next.js Migration',
          tagline: 'Transform slow, monolithic WordPress and WooCommerce stores into sub-second, headless Next.js frontends without losing existing catalogs.',
          category: 'Web Modernization & Headless Commerce',
          targetUrl: '/services/wordpress-to-nextjs-migration',
          targetAudience: 'High-growth eCommerce businesses and agencies struggling with mobile checkout bounce rates and sluggish WooCommerce admin speeds.',
          evidence: [
            'Monolithic WooCommerce stores average 1,800ms+ TTFB on shared or VPS hosting.',
            'Headless Next.js frontends on Vercel achieve <200ms TTFB worldwide with edge static rendering.',
            'Keeping WooCommerce as the headless backend eliminates inventory disruption and staff retraining.',
          ],
          deliverables: [
            { title: 'Next.js 15 App Router Frontend', desc: 'Sub-second mobile-first storefront utilizing Tailwind CSS and incremental static regeneration.' },
            { title: 'Secure GraphQL / REST Bridge', desc: 'Custom optimized bridge between WooCommerce product API and Next.js with edge caching.' },
            { title: '100% Core Web Vitals Guarantee', desc: 'Perfect performance, accessibility, and SEO audit scores certified on Google Lighthouse.' },
          ],
          processSteps: [
            { step: '01', title: 'Architecture Audit', desc: 'Benchmark existing WooCommerce database, plugins, and identify critical checkout dependencies.' },
            { step: '02', title: 'Headless Architecture Setup', desc: 'Deploy Next.js on edge infrastructure with GraphQL endpoints and ISR caching.' },
            { step: '03', title: 'Component & Checkout Integration', desc: 'Implement seamless cart, checkout, and payment gateways (Stripe, Razorpay, PayPal).' },
            { step: '04', title: 'Zero-Downtime Cutover', desc: 'Route DNS to the new Next.js edge storefront while keeping backend operations untouched.' },
          ],
          faqs: [
            { q: 'Will my staff still use the WordPress admin to manage products?', a: 'Yes. Your team manages products, orders, and coupons exactly as before. Only the customer-facing frontend is accelerated by Next.js.' },
            { q: 'How long does a headless migration take?', a: 'Standard eCommerce stores migrate within 2 to 3 weeks with zero downtime.' },
          ],
        },
        {
          slug: 'web-performance-core-web-vitals',
          title: 'Core Web Vitals & Sub-Second Page Speed Engineering',
          shortTitle: 'Speed & CWV Optimization',
          tagline: 'Achieve sub-500ms load times, 95+ Google Lighthouse scores, and eliminate Core Web Vitals ranking penalties.',
          category: 'Performance Engineering & SEO',
          targetUrl: '/services/web-performance-core-web-vitals',
          targetAudience: 'High-traffic SaaS applications and enterprise websites penalized by Google Search for poor mobile performance and layout shifts.',
          evidence: [
            'Google Search ranking algorithm directly penalizes pages failing INP and LCP thresholds.',
            'Every 100ms decrease in load time improves eCommerce conversion rates by up to 1.1%.',
          ],
          deliverables: [
            { title: 'Full-Stack Performance Profiling', desc: 'Comprehensive bundle analysis, network waterfall profiling, and database query latency audits.' },
            { title: 'Next-Gen Image & Asset Pipeline', desc: 'Automated WebP/AVIF transformations, critical CSS inlining, and lazy-loading hydration.' },
            { title: 'Edge CDN Caching Strategy', desc: 'Global edge cache hit ratios > 92% utilizing Cloudflare or Vercel Edge networks.' },
          ],
          processSteps: [
            { step: '01', title: 'Baseline Diagnostic', desc: 'Measure real-user field data (RUM) and synthetic lab metrics.' },
            { step: '02', title: 'Codebase Remediation', desc: 'Eliminate render-blocking scripts, tree-shake bundles, and optimize database indices.' },
            { step: '03', title: 'Edge Deployment', desc: 'Implement stale-while-revalidate caching and compression headers.' },
            { step: '04', title: 'Continuous Monitoring', desc: 'Configure automated regression alerts to prevent future performance degradation.' },
          ],
          faqs: [
            { q: 'Can you optimize existing React/Next.js codebases without rewriting everything?', a: 'Yes. Most optimizations target bundle size, server-side data waterfalls, and image handling without touching core UI logic.' },
          ],
        },
      ];

      // Check candidate deduplication
      let selectedCandidate = serviceCandidates[0];
      for (const cand of serviceCandidates) {
        const dupCheck = await checkContentDuplicate({
          title: cand.title,
          slug: cand.slug,
          type: 'service_page',
        });
        if (!dupCheck.isDuplicate) {
          selectedCandidate = cand;
          break;
        }
      }

      // Check if selected candidate is duplicate
      const finalDup = await checkContentDuplicate({
        title: selectedCandidate.title,
        slug: selectedCandidate.slug,
        type: 'service_page',
      });

      if (finalDup.isDuplicate) {
        await logChiefActivity(
          'content_researcher',
          'info',
          `Skipped service page research: ${finalDup.reason}`,
          { slug: selectedCandidate.slug }
        );
        return {
          success: true,
          summary: `Skipped duplicate service page: ${finalDup.reason}`,
        };
      }

      // Construct markdown blueprint for review
      let blueprintMarkdown = `## Service Blueprint: ${selectedCandidate.title}\n\n`;
      blueprintMarkdown += `> **Category:** ${selectedCandidate.category} • **Target URL:** \`${selectedCandidate.targetUrl}\`\n\n`;
      blueprintMarkdown += `### Value Proposition\n${selectedCandidate.tagline}\n\n`;
      blueprintMarkdown += `### Target Audience & Search Intent\n${selectedCandidate.targetAudience}\n\n`;
      blueprintMarkdown += `### Market Evidence & Supporting Research\n`;
      for (const ev of selectedCandidate.evidence) {
        blueprintMarkdown += `• ${ev}\n`;
      }
      blueprintMarkdown += `\n### Key Deliverables\n`;
      for (const d of selectedCandidate.deliverables) {
        blueprintMarkdown += `• **${d.title}:** ${d.desc}\n`;
      }
      blueprintMarkdown += `\n### 4-Step Engineering Roadmap\n`;
      for (const p of selectedCandidate.processSteps) {
        blueprintMarkdown += `${p.step}. **${p.title}:** ${p.desc}\n`;
      }
      blueprintMarkdown += `\n### Frequently Asked Questions\n`;
      for (const f of selectedCandidate.faqs) {
        blueprintMarkdown += `**Q: ${f.q}**\n${f.a}\n\n`;
      }

      const contentHash = computeContentHash(blueprintMarkdown);

      const draftId = await createContentDraft({
        agentId: 'content_researcher',
        draftType: 'service_page',
        title: `Service Proposal: ${selectedCandidate.title}`,
        excerpt: selectedCandidate.tagline,
        content: blueprintMarkdown,
        content_hash: contentHash,
        target_url: selectedCandidate.targetUrl,
        metadata: {
          target_page_type: 'service_page',
          slug: selectedCandidate.slug,
          category: selectedCandidate.category,
          targetAudience: selectedCandidate.targetAudience,
          deliverables: selectedCandidate.deliverables,
          processSteps: selectedCandidate.processSteps,
          faqs: selectedCandidate.faqs,
          evidence: selectedCandidate.evidence,
          readMins: '3 min review',
        },
        status: 'pending_approval',
      });

      const duration = Date.now() - startTime;
      await updateAgentExecutionTime('content_researcher', new Date(), new Date(Date.now() + 24 * 3600 * 1000));
      await incrementAgentStats('content_researcher', true, 1, 1800);

      await logChiefActivity(
        'content_researcher',
        'success',
        `Researched and drafted new service page blueprint "${selectedCandidate.title}"`,
        { draftId, slug: selectedCandidate.slug, durationMs: duration }
      );

      return {
        draftId,
        success: true,
        title: selectedCandidate.title,
        summary: `Created service page proposal "${selectedCandidate.title}" awaiting AI approval.`,
      };
    } catch (err: any) {
      console.error('[ContentResearcher] Service page research error:', err);
      return { success: false, summary: `Service research error: ${err?.message}` };
    }
  }

  // ==========================================================================
  // BRANCH 2: WEBSITE CONTENT & MESSAGING AUDIT
  // ==========================================================================
  if (contentType === 'website_content') {
    try {
      const pageTitle = 'Homepage Hero & Technical Positioning Optimization';
      const targetUrl = '/';
      const proposalExcerpt = 'Streamlined high-conviction messaging highlighting Next.js 15, AI automation, and sub-second architecture.';

      const dupCheck = await checkContentDuplicate({ title: pageTitle, type: 'website_content' });
      if (dupCheck.isDuplicate) {
        return { success: true, summary: `Skipped duplicate website content update: ${dupCheck.reason}` };
      }

      let contentBody = `## Website Copy Audit: ${pageTitle}\n\n`;
      contentBody += `> **Target Page:** \`${targetUrl}\` • **Goal:** Increase high-intent project inquiries by 25%\n\n`;
      contentBody += `### Proposed Value Proposition Update\n`;
      contentBody += `"I build sub-second web applications, headless commerce systems, and custom AI automations for ambitious brands and growing businesses."\n\n`;
      contentBody += `### Supporting Evidence & Research\n`;
      contentBody += `• Direct clarity outperforms cleverness in B2B engineering services.\n`;
      contentBody += `• Highlighting quantifiable speed gains (e.g. sub-500ms) establishes instant authority with CTOs and agency owners.\n\n`;
      contentBody += `### Recommended Action\n`;
      contentBody += `Approve this content update to apply refined messaging to the homepage hero section.`;

      const contentHash = computeContentHash(contentBody);

      const draftId = await createContentDraft({
        agentId: 'content_researcher',
        draftType: 'website_content',
        title: pageTitle,
        excerpt: proposalExcerpt,
        content: contentBody,
        content_hash: contentHash,
        target_url: targetUrl,
        metadata: {
          targetUrl,
          category: 'Website Messaging',
          readMins: '2 min review',
        },
        status: 'pending_approval',
      });

      return {
        draftId,
        success: true,
        title: pageTitle,
        summary: `Created website content update proposal "${pageTitle}" awaiting AI approval.`,
      };
    } catch (err: any) {
      return { success: false, summary: `Website content error: ${err?.message}` };
    }
  }

  // ==========================================================================
  // BRANCH 3: BLOG & TECHNICAL INSIGHT ARTICLE (DEFAULT)
  // ==========================================================================
  try {
    // Deduplication pre-check if customTopic provided
    if (options?.customTopic) {
      const dup = await checkContentDuplicate({
        title: options.customTopic,
        type: 'article',
      });
      if (dup.isDuplicate) {
        return {
          success: true,
          summary: `Skipped duplicate article topic: ${dup.reason}`,
        };
      }
    }

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

    // Check duplicate against generated title and slug
    const postDup = await checkContentDuplicate({
      title: draftTitle,
      slug: gen.slug,
      type: 'article',
    });

    if (postDup.isDuplicate) {
      return {
        success: true,
        summary: `Generated article "${draftTitle}" duplicates existing content: ${postDup.reason}`,
      };
    }

    // Convert sections to readable markdown
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

    const contentHash = computeContentHash(markdownBody);

    // Save draft into chief_content_drafts
    const draftId = await createContentDraft({
      agentId: 'content_researcher',
      draftType: 'article',
      title: draftTitle,
      excerpt: draftExcerpt,
      content: markdownBody,
      content_hash: contentHash,
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

  // Branch A: Blog Article -> Publish to CMS posts table & live blog
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

  // Branch B: Service Page Blueprint -> Record into CMS services table & approve
  if (draft.draft_type === 'service_page') {
    const meta = draft.metadata || {};
    try {
      await createService({
        title: draft.title.replace(/^Service Proposal:\s*/, ''),
        slug: meta.slug || `service-${Date.now()}`,
        tagline: draft.excerpt || '',
        category_name: meta.category || 'Engineering',
      });
    } catch (svcErr) {
      console.warn('[approveAndPublishDraft] Service record notice:', svcErr);
    }

    await updateDraftStatus(draftId, 'approved');
    await logChiefActivity(
      'content_researcher',
      'success',
      `Approved service page proposal "${draft.title}"`,
      { draftId, targetUrl: draft.target_url }
    );

    return {
      success: true,
      publishedUrl: draft.target_url || `/services/${meta.slug}`,
    };
  }

  // Branch C: Generic Approval (Website Content, SEO patches)
  await updateDraftStatus(draftId, 'approved');
  await logChiefActivity(
    draft.agent_id,
    'success',
    `Approved draft "${draft.title}"`,
    { draftId, draftType: draft.draft_type }
  );

  return { success: true, publishedUrl: draft.target_url };
}
