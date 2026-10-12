import { AIModelProvider, AIAnalysisInput, AIAnalysisResult } from './types';
import { AIAnalysisPayload, AIAnalysisSchema } from '../types';

export class DeterministicRuleEngineAdapter implements AIModelProvider {
  name = 'deterministic';

  isConfigured(): boolean {
    return true; // Always available offline without API keys
  }

  async analyzeBusiness(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    const { businessName, category, city, websiteUrl, auditSignals } = input;
    const loc = city ? ` in ${city}` : '';

    let summary = `${businessName} is a ${category || 'local enterprise'}${loc}.`;
    let opportunity = '';
    let recommendedService: AIAnalysisPayload['recommendedService'] = 'Website Design & Development';
    let evidence = '';
    let confidence = 0.85;

    // Rule 1: No website or unreachable site
    if (!websiteUrl || !auditSignals || !auditSignals.isReachable) {
      opportunity = 'Establishing a high-performance digital presence to capture customer search and inquiries directly.';
      recommendedService = 'Website Design & Development';
      evidence = websiteUrl
        ? `Website at ${websiteUrl} could not be reached during verification.`
        : 'No official website URL identified in verified business records.';
      confidence = 0.95;
    }
    // Rule 2: Missing mobile viewport / responsiveness
    else if (!auditSignals.mobileFriendly) {
      opportunity = 'Upgrading to a responsive mobile-first architecture to improve user retention on mobile devices.';
      recommendedService = 'Website Design & Development';
      evidence = 'Observed missing responsive viewport configuration (<meta name="viewport" content="width=device-width">).';
      confidence = 0.9;
    }
    // Rule 3: Hospitality, dining, or salon without online booking
    else if (
      (category.toLowerCase().includes('restaurant') ||
        category.toLowerCase().includes('cafe') ||
        category.toLowerCase().includes('hotel') ||
        category.toLowerCase().includes('salon') ||
        category.toLowerCase().includes('clinic') ||
        category.toLowerCase().includes('dentist')) &&
      !auditSignals.hasBookingSystem
    ) {
      opportunity = 'Integrating direct online table/appointment booking to eliminate manual phone tag and reduce booking drop-off.';
      recommendedService = 'Booking & Reservation System';
      evidence = 'Audit detected no integrated online scheduling, reservation widget, or direct booking portal on the site.';
      confidence = 0.88;
    }
    // Rule 4: Retail / shop without e-commerce
    else if (
      (category.toLowerCase().includes('retail') ||
        category.toLowerCase().includes('shop') ||
        category.toLowerCase().includes('store') ||
        category.toLowerCase().includes('boutique')) &&
      !auditSignals.hasEcommerce
    ) {
      opportunity = 'Deploying a modern direct-to-consumer digital storefront for catalog browsing and online checkout.';
      recommendedService = 'E-Commerce Storefront';
      evidence = 'Physical goods enterprise without observable digital shopping cart, checkout integration, or digital payments.';
      confidence = 0.86;
    }
    // Rule 5: Missing newsletter / retention capture
    else if (!auditSignals.hasNewsletter) {
      opportunity = 'Implementing automated customer retention and transactional email pipelines to build repeat business.';
      recommendedService = 'Newsletter & Email Systems';
      evidence = 'No subscriber signup, newsletter intake form, or automated email capture mechanism present on the site.';
      confidence = 0.8;
    }
    // Rule 6: Established digital presence -> process automation
    else {
      opportunity = 'Streamlining business workflows and CRM integrations through custom software automation.';
      recommendedService = 'Business Process Automation';
      evidence = `Observed established website with ${auditSignals.detectedTechnologies.join(', ') || 'standard web stack'}. Opportunity lies in backend automation and workflow optimization.`;
      confidence = 0.78;
    }

    const suggestedSubject = `Quick note regarding ${businessName}'s digital architecture`;

    const personalizedDraft = `Hi ${businessName} Team,

I came across ${businessName}${loc} while researching established businesses in your sector.

While reviewing your digital footprint, I noted that your current setup could benefit from ${opportunity.toLowerCase()} Specifically: ${evidence}

At HeyPrince (https://heyprince.in), we specialize in ${recommendedService.toLowerCase()} engineered for modern performance, clean design, and measurable customer conversions.

Would you be open to a brief 10-minute exchange this week to see if modernizing this would bring value to your operations?

Best regards,

Prince
Principal Engineer & Founder, HeyPrince
https://heyprince.in | it@heyprince.in
Kolkata, West Bengal, India

--
If you would prefer not to receive future updates, you may unsubscribe at any time:
{{UNSUBSCRIBE_URL}}`;

    const rawPayload: AIAnalysisPayload = {
      businessSummary: summary,
      observedDigitalOpportunity: opportunity,
      recommendedService,
      evidence,
      confidenceLevel: confidence,
      suggestedSubject,
      personalizedDraft,
      unsupportedClaimWarnings: [],
    };

    // Validate with Zod schema
    const validated = AIAnalysisSchema.parse(rawPayload);

    return {
      provider: 'deterministic',
      modelName: 'rule-engine-v1',
      analysis: validated,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
    };
  }
}
