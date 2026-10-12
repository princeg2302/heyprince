import { validateUrlForSsrf } from './ssrf-guard';
import { WebsiteAuditEntity } from '../types';
import { saveWebsiteAudit } from '../db';

export interface AuditResult {
  targetUrl: string;
  finalUrl: string | null;
  httpStatus: number | null;
  isReachable: boolean;
  hasHttps: boolean;
  mobileFriendly: boolean;
  hasContactPage: boolean;
  hasBookingSystem: boolean;
  hasEcommerce: boolean;
  hasNewsletter: boolean;
  hasLiveChat: boolean;
  speedIndexMs: number | null;
  detectedTechnologies: string[];
  signals: Record<string, any>;
  discoveredEmails: string[];
  error: string | null;
}

export class WebsiteAuditor {
  private maxRedirects = 3;
  private maxResponseBytes = 512 * 1024; // 512 KB

  /**
   * Safely audits a website with strict SSRF defenses, redirect validation, and signal extraction
   */
  async auditUrl(targetUrl: string): Promise<AuditResult> {
    const startTime = Date.now();
    let currentUrl = targetUrl;
    let redirectCount = 0;
    let finalUrl = targetUrl;
    let httpStatus: number | null = null;
    let htmlContent = '';

    try {
      // Loop to follow redirects safely with per-hop SSRF validation
      while (redirectCount <= this.maxRedirects) {
        // 1. SSRF check before ANY socket or HTTP request
        const { safeUrl } = await validateUrlForSsrf(currentUrl);

        const response = await fetch(safeUrl.toString(), {
          method: 'GET',
          redirect: 'manual', // Manual redirect control to validate each target IP
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 HeyPrinceAudit/1.0',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(8000),
        });

        httpStatus = response.status;
        finalUrl = safeUrl.toString();

        // Check for redirects (301, 302, 307, 308)
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) break;

          const nextUrl = new URL(location, safeUrl).toString();
          currentUrl = nextUrl;
          redirectCount++;
          continue;
        }

        // Read up to 512 KB of HTML safely
        const reader = response.body?.getReader();
        if (reader) {
          let receivedBytes = 0;
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              receivedBytes += value.length;
              if (receivedBytes >= this.maxResponseBytes) {
                await reader.cancel();
                break;
              }
            }
          }
          const totalBuffer = new Uint8Array(receivedBytes);
          let offset = 0;
          for (const chunk of chunks) {
            totalBuffer.set(chunk.slice(0, Math.min(chunk.length, this.maxResponseBytes - offset)), offset);
            offset += chunk.length;
            if (offset >= this.maxResponseBytes) break;
          }
          htmlContent = new TextDecoder('utf-8').decode(totalBuffer);
        } else {
          htmlContent = await response.text();
        }
        break;
      }

      const durationMs = Date.now() - startTime;
      const parsedSignals = this.extractSignals(htmlContent, finalUrl);

      return {
        targetUrl,
        finalUrl,
        httpStatus,
        isReachable: httpStatus !== null && httpStatus < 400,
        hasHttps: finalUrl.startsWith('https://'),
        mobileFriendly: parsedSignals.mobileFriendly,
        hasContactPage: parsedSignals.hasContactPage,
        hasBookingSystem: parsedSignals.hasBookingSystem,
        hasEcommerce: parsedSignals.hasEcommerce,
        hasNewsletter: parsedSignals.hasNewsletter,
        hasLiveChat: parsedSignals.hasLiveChat,
        speedIndexMs: durationMs,
        detectedTechnologies: parsedSignals.detectedTechnologies,
        signals: parsedSignals.evidence,
        discoveredEmails: parsedSignals.discoveredEmails,
        error: null,
      };
    } catch (err: any) {
      return {
        targetUrl,
        finalUrl: null,
        httpStatus,
        isReachable: false,
        hasHttps: targetUrl.startsWith('https://'),
        mobileFriendly: false,
        hasContactPage: false,
        hasBookingSystem: false,
        hasEcommerce: false,
        hasNewsletter: false,
        hasLiveChat: false,
        speedIndexMs: null,
        detectedTechnologies: [],
        signals: { failureReason: err.message || 'Audit unreachable' },
        discoveredEmails: [],
        error: err.message || 'Website audit failed',
      };
    }
  }

  /**
   * Parses HTML string safely without executing any scripts
   */
  private extractSignals(html: string, url: string): {
    mobileFriendly: boolean;
    hasContactPage: boolean;
    hasBookingSystem: boolean;
    hasEcommerce: boolean;
    hasNewsletter: boolean;
    hasLiveChat: boolean;
    detectedTechnologies: string[];
    evidence: Record<string, any>;
    discoveredEmails: string[];
  } {
    const lower = html.toLowerCase();
    const tech: string[] = [];
    const evidence: Record<string, any> = {};

    // 1. Mobile friendly viewport check
    const mobileFriendly = /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width/i.test(html);
    if (mobileFriendly) {
      evidence.viewport = 'Responsive device-width viewport detected';
    } else {
      evidence.viewport = 'Missing or non-responsive viewport meta tag';
    }

    // 2. Title & Meta Description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      evidence.pageTitle = titleMatch[1].trim();
    }

    // 3. Platform / CMS Detection
    if (lower.includes('wp-content') || lower.includes('wordpress')) tech.push('WordPress');
    if (lower.includes('shopify') || lower.includes('cdn.shopify.com')) tech.push('Shopify');
    if (lower.includes('wix.com') || lower.includes('wixsite')) tech.push('Wix');
    if (lower.includes('squarespace.com')) tech.push('Squarespace');
    if (lower.includes('webflow.com') || lower.includes('w-layout')) tech.push('Webflow');
    if (lower.includes('woocommerce')) tech.push('WooCommerce');
    if (lower.includes('next/head') || lower.includes('_next/static')) tech.push('Next.js');

    // 4. Contact page or contact links
    const hasContactPage =
      /href=["'][^"']*(contact|touch|about|reach)[^"']*["']/i.test(html) ||
      lower.includes('contact us') ||
      lower.includes('get in touch');
    if (hasContactPage) evidence.contactMechanism = 'Dedicated contact page / navigation link visible';

    // 5. Booking / Reservation System
    const hasBookingSystem =
      lower.includes('calendly.com') ||
      lower.includes('opentable.com') ||
      lower.includes('resy.com') ||
      lower.includes('fresha.com') ||
      lower.includes('vagaro.com') ||
      lower.includes('booksy.com') ||
      lower.includes('acuityscheduling.com') ||
      /book\s+(an?\s+)?(appointment|table|room|now)/i.test(html);

    if (hasBookingSystem) {
      evidence.booking = 'Online booking / appointment scheduling identified';
      tech.push('Online Booking');
    }

    // 6. E-Commerce
    const hasEcommerce =
      tech.includes('Shopify') ||
      tech.includes('WooCommerce') ||
      lower.includes('add to cart') ||
      lower.includes('checkout') ||
      lower.includes('stripe.com');

    if (hasEcommerce) {
      evidence.ecommerce = 'E-commerce shopping cart / checkout features identified';
      tech.push('E-Commerce');
    }

    // 7. Newsletter / Email Capture
    const hasNewsletter =
      lower.includes('newsletter') ||
      lower.includes('mailchimp') ||
      lower.includes('klaviyo') ||
      /subscribe\s+to\s+(our\s+)?(newsletter|updates)/i.test(html);

    if (hasNewsletter) {
      evidence.newsletter = 'Email newsletter / subscriber signup form detected';
    }

    // 8. Live Chat / Messaging Widget
    const hasLiveChat =
      lower.includes('intercom') ||
      lower.includes('drift.com') ||
      lower.includes('crisp.chat') ||
      lower.includes('tidio') ||
      lower.includes('wa.me') ||
      lower.includes('api.whatsapp.com');

    if (hasLiveChat) {
      evidence.liveChat = 'Customer live chat or WhatsApp widget integrated';
      tech.push('Live Chat');
    }

    // 9. Discover public business emails from mailto: or regex
    const emailsFound = new Set<string>();
    const mailtoMatches = html.matchAll(/href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/gi);
    for (const m of mailtoMatches) {
      if (m[1]) emailsFound.add(m[1].toLowerCase().trim());
    }

    // General email pattern in text (filtering out image extensions or binary patterns)
    const rawMatches = html.matchAll(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi);
    for (const m of rawMatches) {
      const email = m[1].toLowerCase().trim();
      if (
        !email.endsWith('.png') &&
        !email.endsWith('.jpg') &&
        !email.endsWith('.webp') &&
        !email.endsWith('.svg') &&
        !email.includes('sentry') &&
        !email.includes('example.com') &&
        !email.includes('schema.org')
      ) {
        emailsFound.add(email);
      }
    }

    return {
      mobileFriendly,
      hasContactPage,
      hasBookingSystem,
      hasEcommerce,
      hasNewsletter,
      hasLiveChat,
      detectedTechnologies: Array.from(new Set(tech)),
      evidence,
      discoveredEmails: Array.from(emailsFound).slice(0, 5), // Keep top 5 public contacts
    };
  }

  /**
   * Runs audit for a persisted business record, saves the audit, and discovers contacts
   */
  async auditBusiness(business: { id: string; website_url?: string | null }): Promise<WebsiteAuditEntity | null> {
    if (!business.website_url) return null;

    const result = await this.auditUrl(business.website_url);

    return saveWebsiteAudit({
      business_id: business.id,
      target_url: result.targetUrl,
      final_url: result.finalUrl,
      http_status: result.httpStatus,
      is_reachable: result.isReachable,
      has_https: result.hasHttps,
      mobile_friendly: result.mobileFriendly,
      has_contact_page: result.hasContactPage,
      has_booking_system: result.hasBookingSystem,
      has_ecommerce: result.hasEcommerce,
      has_newsletter: result.hasNewsletter,
      has_live_chat: result.hasLiveChat,
      speed_index_ms: result.speedIndexMs,
      detected_technologies: result.detectedTechnologies,
      signals: result.signals,
      error: result.error,
      audited_at: new Date().toISOString(),
    });
  }
}

export const websiteAuditor = new WebsiteAuditor();
