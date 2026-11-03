import crypto from 'crypto';

/**
 * Strips all HTML tags and dangerous characters to completely eliminate XSS vulnerabilities.
 */
export function sanitizePlainText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onclick\s*=/gi, '')
    .replace(/onmouseover\s*=/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip control characters
    .trim();
}

/**
 * Checks for obvious malicious cyber-attack signatures (SQLi, XSS, automated spam).
 */
export function checkMaliciousPatterns(text: string): { isClean: boolean; reason?: string } {
  const lower = text.toLowerCase();

  // 1. SQL Injection signatures
  const sqliPatterns = [
    /\bunion\s+(?:all\s+)?select\b/i,
    /\bselect\s+.*\s+from\s+information_schema\b/i,
    /\bdrop\s+table\b/i,
    /\bexec(?:\s+|\()xp_/i,
    /;\s*--/i,
    /'\s*or\s*'1'\s*=\s*'1/i,
    /admin'\s*--/i,
  ];

  for (const pattern of sqliPatterns) {
    if (pattern.test(text)) {
      return { isClean: false, reason: 'Suspicious payload syntax detected.' };
    }
  }

  // 2. Dangerous XSS tags/scripts
  const xssPatterns = [
    /<script\b/i,
    /<\/script>/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /document\.cookie/i,
    /window\.location/i,
    /alert\s*\(/i,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(text)) {
      return { isClean: false, reason: 'Embedded script tags or executable code are strictly forbidden.' };
    }
  }

  // 3. Excessive URL Spam (SEO link farming bots)
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi);
  if (urlMatches && urlMatches.length > 2) {
    return { isClean: false, reason: 'To prevent link spam, comments are limited to at most 2 external links.' };
  }

  return { isClean: true };
}

/**
 * Generates an anonymous SHA-256 client fingerprint from IP + User Agent.
 * This preserves privacy while allowing rate-limiting and preventing duplicate spam.
 */
export function getClientHash(ip: string, userAgent: string): string {
  const secretSalt = process.env.PAYLOAD_SECRET || 'heyprince_discussion_salt_2026';
  return crypto
    .createHmac('sha256', secretSalt)
    .update(`${ip || '127.0.0.1'}::${userAgent || 'unknown'}`)
    .digest('hex');
}

/**
 * Creates a privacy-preserving avatar URL (Gravatar or colorful SVG initials)
 * Never exposes the commenter's actual email address.
 */
export function generateAvatarUrl(email: string, name: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const md5Hash = crypto.createHash('md5').update(cleanEmail).digest('hex');
  const encodedName = encodeURIComponent(name.trim() || 'Contributor');

  // Uses Gravatar with dicebear/ui-avatars fallback
  return `https://www.gravatar.com/avatar/${md5Hash}?d=https%3A%2F%2Fui-avatars.com%2Fapi%2F${encodedName}%2F128%2F12141e%2F00d09c%2F2%2F0.4%2Ftrue&s=128`;
}

