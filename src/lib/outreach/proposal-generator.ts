import { getBusinessById, getContactsForBusiness, getLatestAuditForBusiness, query } from './db';
import { aiEngineService } from './ai/service';
import { evaluateLeadContactChannels } from './qualification';
import { generateOutreachIdempotencyKey } from '../deduplication';
import { createContentDraft, updateDraftContent } from '../chief-of-staff/db';
import { ChiefContentDraft } from '../chief-of-staff/types';
import { normalizeDomain } from '../deduplication';

export interface GenerateProposalResult {
  success: boolean;
  draftId?: string;
  draft?: ChiefContentDraft | null;
  analysis?: any;
  bestChannel?: 'whatsapp' | 'email' | 'none';
  error?: string;
}

/**
 * Generates an AI-tailored outreach proposal for a business,
 * stores the AI analysis, and submits the review proposal directly to
 * chief_content_drafts so it appears in the AI Approvals hub.
 */
export async function generateLeadProposal(
  businessId: string,
  preferredProvider?: string
): Promise<GenerateProposalResult> {
  try {
    const business = await getBusinessById(businessId);
    if (!business) {
      return { success: false, error: 'Business not found' };
    }

    const rawDomain = business.domain || business.website_url || 'their-website.com';
    const canonical = normalizeDomain(rawDomain);
    const meta = business.metadata || {};

    // 1. Fetch contacts and latest audit
    const [contacts, audit] = await Promise.all([
      getContactsForBusiness(business.id).catch(() => []),
      getLatestAuditForBusiness(business.id).catch(() => null),
    ]);

    // 2. Run AI Engine Analysis & Personalization
    const aiRecord = await aiEngineService.analyzeAndSave(
      business.id,
      {
        businessName: business.name,
        category: business.category || 'Business',
        city: business.city,
        countryCode: business.country_code,
        websiteUrl: business.website_url,
        auditSignals: audit
          ? {
              isReachable: audit.is_reachable,
              hasHttps: audit.has_https,
              mobileFriendly: audit.mobile_friendly,
              hasContactPage: audit.has_contact_page,
              hasBookingSystem: audit.has_booking_system,
              hasEcommerce: audit.has_ecommerce,
              hasNewsletter: audit.has_newsletter,
              hasLiveChat: audit.has_live_chat,
              speedIndexMs: audit.speed_index_ms,
              detectedTechnologies: audit.detected_technologies,
              signals: audit.signals,
            }
          : null,
      },
      preferredProvider
    );

    // 3. Evaluate Channels & Qualification
    const channelEval = evaluateLeadContactChannels({
      website_url: business.website_url,
      domain: canonical,
      metadata: meta,
      contacts,
    });

    // 4. Resolve Target Recipient & Contact Details
    const primaryContact = contacts[0];
    const primaryContactEmail = primaryContact?.email || (meta.has_email ? meta.email : undefined);
    const primaryContactName = primaryContact?.name || undefined;
    const primaryPhone = meta.phone || primaryContact?.phone || undefined;
    const targetRecipient = primaryContactName || business.name;

    // 5. Build Evidence and Recommendations
    const evidenceList: string[] = [];
    if (aiRecord.evidence) {
      evidenceList.push(aiRecord.evidence);
    }
    if (aiRecord.observed_digital_opportunity) {
      evidenceList.push(aiRecord.observed_digital_opportunity);
    }

    const ttfb = meta.ttfb ? Number(meta.ttfb) : null;
    if (ttfb && ttfb > 700) {
      evidenceList.push(`High Server TTFB latency (${ttfb}ms) causing page lag and cart abandonment`);
    }

    if (audit?.signals && typeof audit.signals === 'object') {
      if (audit.signals.wordpressDetected) {
        evidenceList.push('Monolithic WordPress detected with potential plugin latency');
      }
      if (audit.signals.shopifyDetected) {
        evidenceList.push('Shopify Liquid theme with third-party app overhead impacting Core Web Vitals');
      }
    }

    if (evidenceList.length === 0) {
      evidenceList.push('Legacy web architecture with modernization opportunities for speed, SEO, and bookings');
    }

    const calculatedScore = Math.min(
      Math.max(Math.round((aiRecord.confidence_level || 0.8) * 100), 65),
      98
    );
    const confidenceLevel = Math.round(calculatedScore * 0.95);
    const recommendedService = aiRecord.recommended_service || 'Next.js Architecture & Speed Optimization';
    const likelyNeeds = aiRecord.observed_digital_opportunity || 'Frontend modernization and performance optimization';

    // 6. Channel-Specific Pitch Copy
    const emailSubject =
      aiRecord.suggested_subject ||
      `Quick technical optimization idea for ${business.name} (${canonical || 'your website'})`;

    let emailBody = aiRecord.personalized_draft;
    if (!emailBody || emailBody.length < 50) {
      emailBody = `Hi ${targetRecipient} Team,\n\nI was analyzing web platforms in the ${business.industry || business.category || 'digital business'} space and spent some time reviewing ${canonical || 'your website'}.\n\nYour business has strong momentum, but I noticed a couple of technical bottlenecks that might be impacting customer conversion and Google rankings:\n`;
      for (const ev of evidenceList) {
        emailBody += `• ${ev}\n`;
      }
      emailBody += `\nI specialize in sub-second Next.js web applications, full-stack cloud engineering, and WordPress/WooCommerce speed optimization.\n\nWould you be open to a 2-minute video breakdown showing exactly where the performance gains are?\n\nBest regards,\nPrince\nSenior Full Stack Engineer & IT Consultant\nhttps://heyprince.in`;
    }

    const whatsappPitch = `Hello ${targetRecipient} Team! 👋 I analyzed ${canonical || 'your website'} and found high-impact speed & booking improvements that could boost your conversions. Would you be open to a quick 2-min breakdown? — Prince (https://heyprince.in)`;

    // 7. Generate Idempotency Key
    const idempotencyKey = generateOutreachIdempotencyKey(
      business.id,
      `outreach_${business.id}`,
      primaryContactEmail || channelEval.whatsappUrl || business.name
    );

    const opportunityTitle = `Outreach Proposal: ${business.name} (${canonical || 'Website'})`;
    const opportunityExcerpt = `${recommendedService} • Recommended Channel: ${channelEval.bestChannel.toUpperCase()} (Score: ${calculatedScore}/100)`;

    const metadataPayload = {
      businessId: business.id,
      companyName: business.name,
      domain: canonical,
      websiteUrl: business.website_url || (canonical ? `https://${canonical}` : undefined),
      contactEmail: primaryContactEmail,
      contactName: primaryContactName,
      phone: primaryPhone,
      whatsappUrl: channelEval.whatsappUrl,
      recommendedChannel: channelEval.bestChannel,
      isQualified: channelEval.isQualified,
      contactChannels: {
        website: channelEval.hasWebsite,
        email: channelEval.hasEmail,
        phone: channelEval.hasPhone,
        whatsapp: channelEval.isWhatsAppEligible,
      },
      leadScore: calculatedScore,
      confidenceLevel,
      evidence: evidenceList,
      likelyNeeds,
      recommendedService,
      proposedNextAction:
        channelEval.bestChannel === 'whatsapp'
          ? 'Send 1-on-1 Strategy Pitch via WhatsApp'
          : 'Send 1-on-1 Strategy Pitch via Email',
      personalizedEmailSubject: emailSubject,
      personalizedEmailBody: emailBody,
      whatsappPitch,
      sendStatus: 'pending',
      aiAnalysisId: aiRecord.id,
    };

    // 8. Check if a proposal draft already exists for this business
    const existingDraftRows = await query<ChiefContentDraft>(
      `SELECT * FROM chief_content_drafts 
       WHERE draft_type IN ('outreach_draft', 'outreach_proposal') 
         AND (
           metadata->>'businessId' = $1::text 
           OR ($2::text IS NOT NULL AND $2::text != '' AND metadata->>'domain' = $2::text)
         )
       LIMIT 1;`,
      [business.id, canonical || '']
    );

    let draftId: string;
    let finalDraft: ChiefContentDraft | null = null;

    if (existingDraftRows.length > 0) {
      draftId = existingDraftRows[0].id;
      await query(
        `UPDATE chief_content_drafts 
         SET title = $1,
             excerpt = $2,
             content = $3,
             target_url = $4,
             status = 'pending_approval',
             metadata = $5,
             updated_at = NOW()
         WHERE id = $6;`,
        [
          opportunityTitle,
          opportunityExcerpt,
          channelEval.bestChannel === 'whatsapp' ? whatsappPitch : emailBody,
          business.website_url || `https://${canonical}`,
          JSON.stringify(metadataPayload),
          draftId,
        ]
      );
      const updatedRows = await query<ChiefContentDraft>(
        `SELECT * FROM chief_content_drafts WHERE id = $1 LIMIT 1;`,
        [draftId]
      );
      finalDraft = updatedRows[0] || null;
    } else {
      draftId = await createContentDraft({
        agentId: 'lead_scout',
        draftType: 'outreach_proposal',
        title: opportunityTitle,
        excerpt: opportunityExcerpt,
        content: channelEval.bestChannel === 'whatsapp' ? whatsappPitch : emailBody,
        idempotency_key: idempotencyKey,
        target_url: business.website_url || `https://${canonical}`,
        metadata: metadataPayload,
      });
      const createdRows = await query<ChiefContentDraft>(
        `SELECT * FROM chief_content_drafts WHERE id = $1 LIMIT 1;`,
        [draftId]
      );
      finalDraft = createdRows[0] || null;
    }

    // 9. Update business status in database
    await query(
      `UPDATE businesses 
       SET status = CASE WHEN status = 'DISCOVERED' THEN 'ENRICHED' ELSE status END,
           metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{outreach_status}', '"pending_approval"'::jsonb),
           updated_at = NOW()
       WHERE id = $1;`,
      [business.id]
    );

    return {
      success: true,
      draftId,
      draft: finalDraft,
      analysis: aiRecord,
      bestChannel: channelEval.bestChannel,
    };
  } catch (err: any) {
    console.error(`[generateLeadProposal] Error generating proposal for business #${businessId}:`, err);
    return {
      success: false,
      error: err.message || 'Failed to generate proposal draft',
    };
  }
}
