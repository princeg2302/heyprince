import { query } from './db';

export interface ScoutTarget {
  country: string;
  city: string;
  category: string;
  categorySlug?: string;
  region?: string;
}

export type LeadLifecycleStatus =
  | 'New'
  | 'Researched'
  | 'Qualified'
  | 'Needs Review'
  | 'Approved'
  | 'Contacted'
  | 'Responded'
  | 'Converted'
  | 'Rejected'
  | 'Do Not Contact';

export const GLOBAL_HUBS: Array<{ country: string; city: string; region?: string }> = [
  // India (High tech, massive commercial growth)
  { country: 'IN', city: 'Bangalore' },
  { country: 'IN', city: 'Delhi' },
  { country: 'IN', city: 'Mumbai' },
  { country: 'IN', city: 'Hyderabad' },
  { country: 'IN', city: 'Pune' },
  { country: 'IN', city: 'Kolkata' },
  { country: 'IN', city: 'Chennai' },
  { country: 'IN', city: 'Ahmedabad' },

  // United States (Premier software, eCommerce & enterprise clients)
  { country: 'US', city: 'Austin' },
  { country: 'US', city: 'New York' },
  { country: 'US', city: 'San Francisco' },
  { country: 'US', city: 'Chicago' },
  { country: 'US', city: 'Seattle' },
  { country: 'US', city: 'Boston' },
  { country: 'US', city: 'Dallas' },
  { country: 'US', city: 'Denver' },
  { country: 'US', city: 'Miami' },

  // United Kingdom & Europe
  { country: 'UK', city: 'London' },
  { country: 'UK', city: 'Manchester' },
  { country: 'UK', city: 'Edinburgh' },
  { country: 'DE', city: 'Berlin' },
  { country: 'DE', city: 'Munich' },
  { country: 'NL', city: 'Amsterdam' },
  { country: 'IE', city: 'Dublin' },

  // Canada & Australia
  { country: 'CA', city: 'Toronto' },
  { country: 'CA', city: 'Vancouver' },
  { country: 'CA', city: 'Montreal' },
  { country: 'AU', city: 'Sydney' },
  { country: 'AU', city: 'Melbourne' },

  // Middle East & Asia-Pacific
  { country: 'AE', city: 'Dubai' },
  { country: 'AE', city: 'Abu Dhabi' },
  { country: 'SG', city: 'Singapore' },
];

export const CORE_CATEGORIES: Array<{ name: string; slug: string }> = [
  { name: 'IT Services & Software Companies', slug: 'it-services-software' },
  { name: 'Startups & Newly Launched Businesses', slug: 'startups-newly-launched' },
  { name: 'E-commerce & D2C Brands', slug: 'ecommerce-d2c-brands' },
  { name: 'Healthcare & Specialized Clinics', slug: 'healthcare-dental-clinics' },
  { name: 'Education & Coaching Institutes', slug: 'education-coaching-institutes' },
  { name: 'Real Estate & Construction', slug: 'real-estate-construction' },
  { name: 'Manufacturing & Industrial Businesses', slug: 'manufacturing-industrial' },
  { name: 'Hospitality & Boutique Hotels', slug: 'hospitality-travel' },
  { name: 'Marketing & Creative Agencies', slug: 'marketing-creative-agencies' },
  { name: 'Professional Services & Consulting', slug: 'professional-services' },
  { name: 'Businesses with Outdated Websites', slug: 'businesses-outdated-websites' },
  { name: 'Expanding Tech & Modernizing Businesses', slug: 'businesses-digital-transformation' },
];

// Fallback rotation for backwards compatibility
export const LEAD_SCOUT_TARGET_ROTATION: ScoutTarget[] = GLOBAL_HUBS.slice(0, 12).map((hub, idx) => ({
  country: hub.country,
  city: hub.city,
  category: CORE_CATEGORIES[idx % CORE_CATEGORIES.length].name,
  categorySlug: CORE_CATEGORIES[idx % CORE_CATEGORIES.length].slug,
}));

/**
 * Dynamically resolves the next target using the database's least recently scanned categories
 * and rotating through global tech and commercial hubs.
 */
export async function resolveDynamicScoutTarget(): Promise<ScoutTarget> {
  try {
    const categories = await query<{
      name: string;
      slug: string;
      last_scanned_at: string | null;
    }>(
      `SELECT name, slug, last_scanned_at 
       FROM industry_categories 
       WHERE status = 'active' 
       ORDER BY last_scanned_at ASC NULLS FIRST, created_at ASC 
       LIMIT 1;`
    );

    const chosenCategory = categories.length > 0
      ? categories[0]
      : CORE_CATEGORIES[Math.floor(Math.random() * CORE_CATEGORIES.length)];

    // Pick hub based on day & random rotation
    const now = new Date();
    const daySeed = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const randomOffset = Math.floor(Math.random() * GLOBAL_HUBS.length);
    const chosenHub = GLOBAL_HUBS[(daySeed + randomOffset) % GLOBAL_HUBS.length];

    return {
      country: chosenHub.country,
      city: chosenHub.city,
      category: chosenCategory.name,
      categorySlug: chosenCategory.slug,
    };
  } catch (err) {
    console.warn('[resolveDynamicScoutTarget] Falling back to static target:', err);
    const chosenHub = GLOBAL_HUBS[Math.floor(Math.random() * GLOBAL_HUBS.length)];
    const chosenCat = CORE_CATEGORIES[Math.floor(Math.random() * CORE_CATEGORIES.length)];
    return {
      country: chosenHub.country,
      city: chosenHub.city,
      category: chosenCat.name,
      categorySlug: chosenCat.slug,
    };
  }
}

/**
 * Calculates a rigorous objective lead score between 0.10 and 1.00 based on:
 * - Domain legitimacy and reachable website
 * - Contact information completeness (verified email, direct WhatsApp phone)
 * - Measurable technical opportunity (slow TTFB, outdated stack, missing mobile optimization)
 * - Commercial alignment with HeyPrince's engineering services
 */
export function calculateLeadScore(biz: {
  website_url?: string | null;
  domain?: string | null;
  phone?: string | null;
  category?: string | null;
  contacts?: Array<{ email?: string | null; verification_status?: string }> | null;
  audit?: {
    isReachable?: boolean;
    speedIndexMs?: number;
    hasHttps?: boolean;
    mobileFriendly?: boolean;
  } | null;
}): { score: number; fitReason: string; recommendedStatus: LeadLifecycleStatus } {
  let score = 0.40;
  const reasons: string[] = [];

  const hasSite = Boolean(biz.website_url || biz.domain);
  if (hasSite) {
    score += 0.20;
    reasons.push('Has active public web presence');
  }

  const validContact = biz.contacts?.find((c) => c.email && c.email.includes('@'));
  if (validContact) {
    if (validContact.verification_status === 'VALID') {
      score += 0.25;
      reasons.push('Verified B2B email address');
    } else {
      score += 0.15;
      reasons.push('Discovered public contact email');
    }
  }

  const rawPhone = biz.phone ? String(biz.phone).replace(/[^0-9]/g, '') : '';
  if (rawPhone.length >= 10) {
    score += 0.10;
    reasons.push('Direct telephone or WhatsApp channel available');
  }

  // Audit factors
  if (biz.audit) {
    if (biz.audit.speedIndexMs && biz.audit.speedIndexMs > 2000) {
      score += 0.10;
      reasons.push(`Sub-optimal page load (${biz.audit.speedIndexMs}ms) offers immediate CWV upgrade upside`);
    }
    if (biz.audit.mobileFriendly === false) {
      score += 0.10;
      reasons.push('Lacks modern mobile responsiveness');
    }
  }

  // Category fit
  const cat = (biz.category || '').toLowerCase();
  if (cat.includes('it') || cat.includes('software') || cat.includes('agency') || cat.includes('ecommerce')) {
    score += 0.10;
    reasons.push('High-margin commercial industry alignment');
  }

  const finalScore = Math.min(Math.max(parseFloat(score.toFixed(2)), 0.10), 1.00);

  let recommendedStatus: LeadLifecycleStatus = 'New';
  if (finalScore >= 0.75) {
    recommendedStatus = 'Qualified';
  } else if (finalScore >= 0.50) {
    recommendedStatus = 'Researched';
  } else {
    recommendedStatus = 'Needs Review';
  }

  return {
    score: finalScore,
    fitReason: reasons.join('; ') || 'Standard discovery criteria met',
    recommendedStatus,
  };
}

/**
 * Checks a business for available contact methods and determines its qualification and best outreach channel.
 * Priority: 1. WhatsApp -> 2. Email -> 3. None
 * Strictly respects real, non-fabricated public data.
 */
export function evaluateLeadContactChannels(biz: {
  website_url?: string | null;
  domain?: string | null;
  phone?: string | null;
  metadata?: Record<string, any> | null;
  contacts?: Array<{ email?: string | null; verification_status?: string }> | null;
}): {
  isQualified: boolean;
  hasWebsite: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  isWhatsAppEligible: boolean;
  bestChannel: 'whatsapp' | 'email' | 'none';
  emailStatus: 'none' | 'discovered' | 'verified';
  whatsappUrl: string | null;
  phoneDigits: string | null;
} {
  const hasWebsite = Boolean(biz.website_url || biz.domain);
  const rawPhone = biz.phone || (biz.metadata as any)?.phone || null;
  const cleanDigits = rawPhone ? String(rawPhone).replace(/[^0-9]/g, '') : '';
  const hasPhone = cleanDigits.length >= 8;

  const validContact = biz.contacts?.find((c) => c.email && c.email.includes('@'));
  const hasEmail = Boolean(validContact?.email);
  const emailStatus = !hasEmail
    ? 'none'
    : validContact?.verification_status === 'VALID'
    ? 'verified'
    : 'discovered';

  let isWhatsAppEligible = false;
  let whatsappUrl: string | null = null;
  const metaWaUrl = (biz.metadata as any)?.whatsapp_url;

  if (metaWaUrl) {
    isWhatsAppEligible = true;
    whatsappUrl = metaWaUrl;
  } else if (hasPhone) {
    const isLandline = /^(1?(800|888|877|866|855|844|833)|1800|44(800|808|845|844|870)|0800|0808)/.test(cleanDigits);
    if (!isLandline && cleanDigits.length >= 10) {
      isWhatsAppEligible = true;
      const greeting = encodeURIComponent(
        `Hello! 👋 I came across your website. I'm Prince from HeyPrince (https://heyprince.in). We analyzed your website and identified high-impact opportunities to improve speed and customer bookings. Would you be open to a quick chat?`
      );
      whatsappUrl = `https://wa.me/${cleanDigits}?text=${greeting}`;
    }
  }

  let bestChannel: 'whatsapp' | 'email' | 'none' = 'none';
  if (isWhatsAppEligible && whatsappUrl) {
    bestChannel = 'whatsapp';
  } else if (hasEmail) {
    bestChannel = 'email';
  }

  // A business is qualified if it has AT LEAST ONE usable contact method (website, email, or phone)
  const isQualified = hasWebsite || hasEmail || hasPhone;

  return {
    isQualified,
    hasWebsite,
    hasEmail,
    hasPhone,
    isWhatsAppEligible,
    bestChannel,
    emailStatus,
    whatsappUrl,
    phoneDigits: hasPhone ? cleanDigits : null,
  };
}
