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
  discoveredPhones: string[];
  discoveredWhatsAppUrls: string[];
  crawledPages: string[];
  error: string | null;
}

export class WebsiteAuditor {
  private maxRedirects = 3;
  private maxResponseBytes = 512 * 1024; // 512 KB

  /**
   * Safely fetches a URL's HTML content with strict per-hop SSRF validation
   */
  async fetchHtmlSafely(
    targetUrl: string,
    timeoutMs = 8000
  ): Promise<{ html: string; finalUrl: string; httpStatus: number; durationMs: number } | null> {
    const startTime = Date.now();
    let currentUrl = targetUrl;
    let redirectCount = 0;
    let finalUrl = targetUrl;
    let httpStatus: number | null = null;
    let htmlContent = '';

    try {
      while (redirectCount <= this.maxRedirects) {
        // SSRF check before ANY socket or HTTP request
        const { safeUrl } = await validateUrlForSsrf(currentUrl);

        const response = await fetch(safeUrl.toString(), {
          method: 'GET',
          redirect: 'manual', // Manual redirect control to validate each target IP
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 HeyPrinceAudit/1.0',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(timeoutMs),
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

        // Read up to maxResponseBytes safely
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
          htmlContent = new TextDecoder('utf-8', { fatal: false }).decode(totalBuffer);
        } else {
          htmlContent = await response.text();
        }
        break;
      }

      if (httpStatus === null) return null;

      return {
        html: htmlContent,
        finalUrl,
        httpStatus,
        durationMs: Date.now() - startTime,
      };
    } catch {
      return null;
    }
  }

  /**
   * Normalizes an email address string
   */
  private normalizeEmail(raw: string): string {
    let clean = raw.trim().toLowerCase();
    if (clean.startsWith('mailto:')) {
      clean = clean.replace(/^mailto:/i, '');
    }
    if (clean.includes('?')) {
      clean = clean.split('?')[0];
    }
    return clean.replace(/[<>]/g, '').trim();
  }

  /**
   * Validates whether an email looks like a genuine business contact
   */
  private isValidContactEmail(email: string): boolean {
    if (!email || !email.includes('@')) return false;
    if (email.length < 6 || email.length > 100) return false;

    // Filter file extensions
    const invalidExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp', '.js', '.css', '.woff', '.woff2'];
    if (invalidExts.some((ext) => email.endsWith(ext))) return false;

    // Filter common bogus or vendor addresses
    const invalidPatterns = [
      'sentry.io',
      'example.com',
      'domain.com',
      'schema.org',
      'w3.org',
      'github.com',
      'wordpress',
      'cloudflare',
      'bootstrap',
      'googleapis',
      'gstatic',
      'wixpress',
      'wix.com',
      'squarespace.com',
    ];
    if (invalidPatterns.some((pat) => email.includes(pat))) return false;

    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  /**
   * Cleans and normalizes phone numbers into formatted display and WhatsApp digits
   */
  cleanPhone(raw: string): { formatted: string; digits: string; isValid: boolean } {
    let clean = raw.trim();
    if (clean.toLowerCase().startsWith('tel:')) {
      clean = clean.replace(/^tel:/i, '');
    }
    if (clean.includes('?')) {
      clean = clean.split('?')[0];
    }

    const digits = clean.replace(/[^0-9]/g, '');

    // Must be between 7 and 15 digits (standard E.164 limits)
    if (digits.length < 7 || digits.length > 15) {
      return { formatted: clean, digits, isValid: false };
    }

    // Exclude repetitive dummy numbers (e.g., 000000000, 111111111)
    if (/^(\d)\1+$/.test(digits)) {
      return { formatted: clean, digits, isValid: false };
    }
    if (digits === '1234567890' || digits === '123456789' || digits === '0123456789') {
      return { formatted: clean, digits, isValid: false };
    }

    // Filter out common screen dimensions or dates
    if (digits.startsWith('19201080') || digits.startsWith('10801920')) {
      return { formatted: clean, digits, isValid: false };
    }

    return {
      formatted: clean,
      digits,
      isValid: true,
    };
  }

  /**
   * Extracts Schema.org JSON-LD microdata from HTML (telephone, email, contactPoint)
   */
  private extractContactsFromJsonLd(html: string): { emails: string[]; phones: string[] } {
    const emails: string[] = [];
    const phones: string[] = [];

    const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        const findInObj = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;
          if (obj.telephone && typeof obj.telephone === 'string') phones.push(obj.telephone);
          if (obj.phone && typeof obj.phone === 'string') phones.push(obj.phone);
          if (obj.email && typeof obj.email === 'string') emails.push(obj.email);

          if (obj.contactPoint) {
            const cpList = Array.isArray(obj.contactPoint) ? obj.contactPoint : [obj.contactPoint];
            for (const cp of cpList) {
              if (cp?.telephone && typeof cp.telephone === 'string') phones.push(cp.telephone);
              if (cp?.email && typeof cp.email === 'string') emails.push(cp.email);
            }
          }

          for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object') {
              findInObj(obj[key]);
            }
          }
        };

        for (const item of items) {
          findInObj(item);
        }
      } catch {
        // Ignore unparseable JSON-LD blocks
      }
    }

    return { emails, phones };
  }

  /**
   * Extracts emails, phone numbers, and WhatsApp links from an HTML document
   */
  extractContactsFromHtml(
    html: string,
    pageUrl: string
  ): {
    emails: string[];
    phones: string[];
    whatsAppUrls: string[];
  } {
    const emailsFound = new Set<string>();
    const phonesFound = new Set<string>();
    const whatsAppUrls = new Set<string>();

    // 1. JSON-LD Schema.org extraction
    const jsonLdData = this.extractContactsFromJsonLd(html);
    for (const em of jsonLdData.emails) {
      const norm = this.normalizeEmail(em);
      if (this.isValidContactEmail(norm)) emailsFound.add(norm);
    }
    for (const ph of jsonLdData.phones) {
      const cleaned = this.cleanPhone(ph);
      if (cleaned.isValid) {
        phonesFound.add(cleaned.formatted);
        whatsAppUrls.add(`https://wa.me/${cleaned.digits}`);
      }
    }

    // 2. Mailto matches (handles query strings like mailto:info@domain.com?subject=Inquiry)
    const mailtoMatches = html.matchAll(/href=["']mailto:([^"'>?]+)/gi);
    for (const m of mailtoMatches) {
      const email = this.normalizeEmail(m[1]);
      if (this.isValidContactEmail(email)) {
        emailsFound.add(email);
      }
    }

    // 3. Tel matches (e.g. href="tel:+15124745911")
    const telMatches = html.matchAll(/href=["']tel:([^"'>?]+)/gi);
    for (const m of telMatches) {
      const cleaned = this.cleanPhone(m[1]);
      if (cleaned.isValid) {
        phonesFound.add(cleaned.formatted);
        whatsAppUrls.add(`https://wa.me/${cleaned.digits}`);
      }
    }

    // 4. WhatsApp direct links (e.g. wa.me/15124745911 or api.whatsapp.com/send?phone=...)
    const waMatches = html.matchAll(
      /href=["'](?:https?:\/\/)?(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)([0-9+]+)/gi
    );
    for (const m of waMatches) {
      const cleaned = this.cleanPhone(m[1]);
      if (cleaned.isValid) {
        phonesFound.add(cleaned.formatted);
        whatsAppUrls.add(`https://wa.me/${cleaned.digits}`);
      }
    }

    // 5. Raw Email regex matches in HTML text
    const rawMatches = html.matchAll(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi);
    for (const m of rawMatches) {
      const email = this.normalizeEmail(m[1]);
      if (this.isValidContactEmail(email)) {
        emailsFound.add(email);
      }
    }

    // 6. Obfuscated email patterns: name [at] domain.com or name(at)domain.com
    const obfuscatedMatches = html.matchAll(
      /([a-zA-Z0-9._%+-]+)\s*(?:\[at\]|\(at\)|\s+at\s+)\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    );
    for (const m of obfuscatedMatches) {
      const reconstructed = `${m[1]}@${m[2]}`;
      const email = this.normalizeEmail(reconstructed);
      if (this.isValidContactEmail(email)) {
        emailsFound.add(email);
      }
    }

    // 7. Text-based Phone numbers
    const textPhoneMatches = html.matchAll(
      /(?:tel|phone|call|contact|mobile|cell|whatsapp|ph)?[:\s]*(\+?[0-9]{1,4}[-.\s]?(?:\(?[0-9]{2,4}\)?[-.\s]?)?[0-9]{3,4}[-.\s]?[0-9]{3,4})/gi
    );
    for (const m of textPhoneMatches) {
      if (m[1]) {
        const cleaned = this.cleanPhone(m[1]);
        if (cleaned.isValid) {
          phonesFound.add(cleaned.formatted);
          whatsAppUrls.add(`https://wa.me/${cleaned.digits}`);
        }
      }
    }

    return {
      emails: Array.from(emailsFound),
      phones: Array.from(phonesFound),
      whatsAppUrls: Array.from(whatsAppUrls),
    };
  }

  /**
   * Scans HTML anchor tags to find high-probability contact subpages (/contact, /about, /reach-us)
   */
  discoverSubpageLinks(html: string, baseUrl: string): string[] {
    let parsedBase: URL;
    try {
      parsedBase = new URL(baseUrl);
    } catch {
      return [];
    }

    const host = parsedBase.hostname.toLowerCase();
    const candidateUrls = new Map<string, number>();

    const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = anchorRegex.exec(html)) !== null) {
      const rawHref = match[1].trim();
      const text = match[2].toLowerCase();

      // Skip non-navigational links
      if (
        !rawHref ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('javascript:') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:')
      ) {
        continue;
      }

      // Ignore media/document files
      if (/\.(pdf|zip|jpg|jpeg|png|webp|gif|mp4|svg|doc|docx)$/i.test(rawHref)) {
        continue;
      }

      let resolved: URL;
      try {
        resolved = new URL(rawHref, parsedBase);
      } catch {
        continue;
      }

      // Must belong to the exact same host
      if (resolved.hostname.toLowerCase() !== host) {
        continue;
      }

      // Skip root homepage
      if (resolved.pathname === '/' || resolved.pathname === '') {
        continue;
      }

      const pathLower = resolved.pathname.toLowerCase();

      let priority = 0;
      if (pathLower.includes('contact')) priority = 100;
      else if (pathLower.includes('reach') || pathLower.includes('touch')) priority = 90;
      else if (pathLower.includes('about')) priority = 70;
      else if (pathLower.includes('location') || pathLower.includes('find-us')) priority = 60;
      else if (text.includes('contact')) priority = 80;
      else if (text.includes('about us') || text.includes('about')) priority = 50;

      if (priority > 0) {
        const cleanUrl = `${resolved.origin}${resolved.pathname}`;
        const existingScore = candidateUrls.get(cleanUrl) || 0;
        if (priority > existingScore) {
          candidateUrls.set(cleanUrl, priority);
        }
      }
    }

    // Sort by priority descending
    const sorted = Array.from(candidateUrls.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([url]) => url);

    // If no explicit links were found in the HTML, provide standard fallback paths
    if (sorted.length === 0) {
      sorted.push(`${parsedBase.origin}/contact`);
      sorted.push(`${parsedBase.origin}/contact-us`);
      sorted.push(`${parsedBase.origin}/about`);
    }

    // Return the top 2 candidate subpages
    return sorted.slice(0, 2);
  }

  /**
   * Deep audits a website with SSRF protection and multi-page contact crawling
   */
  async auditUrl(targetUrl: string): Promise<AuditResult> {
    const startTime = Date.now();
    const homepageRes = await this.fetchHtmlSafely(targetUrl, 8000);

    if (!homepageRes || homepageRes.httpStatus >= 400) {
      return {
        targetUrl,
        finalUrl: homepageRes?.finalUrl || null,
        httpStatus: homepageRes?.httpStatus || null,
        isReachable: false,
        hasHttps: targetUrl.startsWith('https://'),
        mobileFriendly: false,
        hasContactPage: false,
        hasBookingSystem: false,
        hasEcommerce: false,
        hasNewsletter: false,
        hasLiveChat: false,
        speedIndexMs: homepageRes?.durationMs || null,
        detectedTechnologies: [],
        signals: { failureReason: 'Homepage unreachable or returned HTTP error status' },
        discoveredEmails: [],
        discoveredPhones: [],
        discoveredWhatsAppUrls: [],
        crawledPages: [],
        error: 'Website is unreachable or returned HTTP error status',
      };
    }

    const htmlContent = homepageRes.html;
    const finalUrl = homepageRes.finalUrl;
    const durationMs = Date.now() - startTime;

    // 1. Extract signals from homepage
    const parsedSignals = this.extractSignals(htmlContent, finalUrl);

    // 2. Extract contacts from homepage
    const homepageContacts = this.extractContactsFromHtml(htmlContent, finalUrl);
    const allEmails = new Set<string>(homepageContacts.emails);
    const allPhones = new Set<string>(homepageContacts.phones);
    const allWhatsApp = new Set<string>(homepageContacts.whatsAppUrls);
    const crawledPages: string[] = [finalUrl];

    // 3. Deep multi-page crawl: Discover contact subpages
    const subpagesToCrawl = this.discoverSubpageLinks(htmlContent, finalUrl);

    for (const subpageUrl of subpagesToCrawl) {
      try {
        const subRes = await this.fetchHtmlSafely(subpageUrl, 6000);
        if (subRes && subRes.httpStatus < 400 && subRes.html) {
          crawledPages.push(subRes.finalUrl);
          const subContacts = this.extractContactsFromHtml(subRes.html, subRes.finalUrl);

          for (const em of subContacts.emails) allEmails.add(em);
          for (const ph of subContacts.phones) allPhones.add(ph);
          for (const wa of subContacts.whatsAppUrls) allWhatsApp.add(wa);
        }
      } catch {
        // Skip subpage fetch error gracefully
      }
    }

    const discoveredEmails = Array.from(allEmails).slice(0, 10);
    const discoveredPhones = Array.from(allPhones).slice(0, 8);
    const discoveredWhatsAppUrls = Array.from(allWhatsApp).slice(0, 8);

    return {
      targetUrl,
      finalUrl,
      httpStatus: homepageRes.httpStatus,
      isReachable: true,
      hasHttps: finalUrl.startsWith('https://'),
      mobileFriendly: parsedSignals.mobileFriendly,
      hasContactPage: parsedSignals.hasContactPage || subpagesToCrawl.length > 0,
      hasBookingSystem: parsedSignals.hasBookingSystem,
      hasEcommerce: parsedSignals.hasEcommerce,
      hasNewsletter: parsedSignals.hasNewsletter,
      hasLiveChat: parsedSignals.hasLiveChat || discoveredWhatsAppUrls.length > 0,
      speedIndexMs: durationMs,
      detectedTechnologies: parsedSignals.detectedTechnologies,
      signals: {
        ...parsedSignals.evidence,
        discovered_phones: discoveredPhones,
        discovered_whatsapp: discoveredWhatsAppUrls,
        crawled_pages: crawledPages,
      },
      discoveredEmails,
      discoveredPhones,
      discoveredWhatsAppUrls,
      crawledPages,
      error: null,
    };
  }

  /**
   * Parses HTML string safely without executing any scripts
   */
  private extractSignals(
    html: string,
    url: string
  ): {
    mobileFriendly: boolean;
    hasContactPage: boolean;
    hasBookingSystem: boolean;
    hasEcommerce: boolean;
    hasNewsletter: boolean;
    hasLiveChat: boolean;
    detectedTechnologies: string[];
    evidence: Record<string, any>;
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

    return {
      mobileFriendly,
      hasContactPage,
      hasBookingSystem,
      hasEcommerce,
      hasNewsletter,
      hasLiveChat,
      detectedTechnologies: Array.from(new Set(tech)),
      evidence,
    };
  }

  /**
   * Runs deep multi-page audit for a persisted business record, saves the audit, and records signals
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
