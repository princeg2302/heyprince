export interface ScoutTarget {
  country: string;
  city: string;
  category: string;
  region?: string;
}

export const LEAD_SCOUT_TARGET_ROTATION: ScoutTarget[] = [
  { country: 'US', city: 'Austin', category: 'WordPress & Web Development' },
  { country: 'US', city: 'New York', category: 'E-commerce & Retail Storefront' },
  { country: 'UK', city: 'London', category: 'Tech & Marketing Agencies' },
  { country: 'CA', city: 'Toronto', category: 'Healthcare & Dental Clinics' },
  { country: 'AU', city: 'Sydney', category: 'Architecture & Design Studios' },
  { country: 'IN', city: 'Delhi', category: 'Healthcare & Dental' },
  { country: 'IN', city: 'Bangalore', category: 'B2B Tech Consulting' },
  { country: 'AE', city: 'Dubai', category: 'Real Estate & Luxury Retail' },
  { country: 'US', city: 'Chicago', category: 'Law & Professional Services' },
  { country: 'UK', city: 'Manchester', category: 'Restaurants & Hospitality' },
  { country: 'DE', city: 'Berlin', category: 'SaaS & Digital Startups' },
  { country: 'US', city: 'Dallas', category: 'Financial & Wealth Advisors' },
];

/**
 * Checks a business for available contact methods and determines its qualification and best outreach channel.
 * Priority: 1. WhatsApp -> 2. Email -> 3. None
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

  // WhatsApp eligibility: true if explicit WhatsApp URL exists, or valid non-landline phone >= 10 digits
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

