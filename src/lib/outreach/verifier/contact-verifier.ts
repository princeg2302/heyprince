import dns from 'dns/promises';
import { z } from 'zod';
import { VerificationStatus, ContactEntity } from '../types';
import { upsertContact } from '../db';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getairmail.com',
  'throwawaymail.com',
]);

const ROLE_PREFIXES = new Set([
  'info',
  'support',
  'sales',
  'contact',
  'hello',
  'office',
  'admin',
  'team',
  'help',
  'billing',
  'inquiry',
  'inquiries',
  'marketing',
  'press',
  'jobs',
  'careers',
  'general',
]);

export interface EmailVerificationResult {
  email: string;
  syntaxValid: boolean;
  mxValid: boolean;
  isRoleAccount: boolean;
  isDisposable: boolean;
  status: VerificationStatus;
  confidence: number;
  details: {
    mxHosts: string[];
    rolePrefix: string | null;
    diagnosticNotes: string[];
  };
}

export class ContactVerifier {
  /**
   * Normalizes an email address
   */
  normalizeEmail(raw: string): string {
    let clean = raw.trim().toLowerCase();
    if (clean.startsWith('mailto:')) {
      clean = clean.replace(/^mailto:/, '');
    }
    // Remove query params if mailto included subject/body
    if (clean.includes('?')) {
      clean = clean.split('?')[0];
    }
    return clean.replace(/[<>]/g, '').trim();
  }

  /**
   * Checks if an address uses a standard organizational role prefix (e.g. info@, sales@)
   */
  isRoleAccount(email: string): { isRole: boolean; prefix: string | null } {
    const localPart = email.split('@')[0] || '';
    const cleanLocal = localPart.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const prefix of ROLE_PREFIXES) {
      if (cleanLocal === prefix || cleanLocal.startsWith(prefix)) {
        return { isRole: true, prefix };
      }
    }
    return { isRole: false, prefix: null };
  }

  /**
   * Verifies an email's syntax, domain DNS, and mail exchanger (MX) records
   */
  async verifyEmail(rawEmail: string): Promise<EmailVerificationResult> {
    const email = this.normalizeEmail(rawEmail);
    const diagnosticNotes: string[] = [];

    // 1. Syntax check
    const emailSchema = z.string().email();
    const syntaxCheck = emailSchema.safeParse(email);
    const syntaxValid = syntaxCheck.success;

    if (!syntaxValid) {
      return {
        email,
        syntaxValid: false,
        mxValid: false,
        isRoleAccount: false,
        isDisposable: false,
        status: 'INVALID',
        confidence: 0.0,
        details: {
          mxHosts: [],
          rolePrefix: null,
          diagnosticNotes: ['Failed RFC 5322 syntax validation'],
        },
      };
    }

    const domain = email.split('@')[1];
    const isDisposable = DISPOSABLE_DOMAINS.has(domain);
    if (isDisposable) {
      return {
        email,
        syntaxValid: true,
        mxValid: false,
        isRoleAccount: false,
        isDisposable: true,
        status: 'INVALID',
        confidence: 0.0,
        details: {
          mxHosts: [],
          rolePrefix: null,
          diagnosticNotes: ['Domain identified as disposable / temporary inbox'],
        },
      };
    }

    const roleInfo = this.isRoleAccount(email);
    if (roleInfo.isRole) {
      diagnosticNotes.push(`Organizational role prefix detected ('${roleInfo.prefix}@')`);
    }

    // 2. DNS / MX Records Check
    let mxHosts: string[] = [];
    let mxValid = false;

    try {
      const records = await dns.resolveMx(domain);
      if (records && records.length > 0) {
        records.sort((a, b) => a.priority - b.priority);
        mxHosts = records.map((r) => r.exchange);
        mxValid = true;
        diagnosticNotes.push(`Verified ${records.length} active MX host(s) for ${domain}`);
      } else {
        diagnosticNotes.push(`No MX records configured for ${domain}`);
      }
    } catch (dnsErr: any) {
      // Fallback check for A record per RFC 5321 (mail routing fallback)
      try {
        const aRecords = await dns.resolve4(domain);
        if (aRecords && aRecords.length > 0) {
          mxHosts = aRecords;
          mxValid = true;
          diagnosticNotes.push(`No MX record; fallback A record resolved for ${domain}`);
        } else {
          diagnosticNotes.push(`DNS MX resolution error: ${dnsErr.code || dnsErr.message}`);
        }
      } catch {
        diagnosticNotes.push(`Domain has neither MX nor A mail records: ${dnsErr.code || dnsErr.message}`);
      }
    }

    // 3. Determine Final Status and Confidence
    let status: VerificationStatus = 'UNKNOWN';
    let confidence = 0.5;

    if (!mxValid) {
      status = 'INVALID';
      confidence = 0.05;
      diagnosticNotes.push('Domain does not accept inbound mail (no active mail exchanger)');
    } else if (roleInfo.isRole) {
      status = 'RISKY';
      confidence = 0.65;
      diagnosticNotes.push('Domain has active mail server, but role account mailbox may be shared or filtered');
    } else {
      status = 'VALID';
      confidence = 0.9;
      diagnosticNotes.push('Syntax valid, domain has configured MX exchangers, personal/named recipient mailbox');
    }

    return {
      email,
      syntaxValid,
      mxValid,
      isRoleAccount: roleInfo.isRole,
      isDisposable,
      status,
      confidence,
      details: {
        mxHosts,
        rolePrefix: roleInfo.prefix,
        diagnosticNotes,
      },
    };
  }

  /**
   * Verifies an email and persists the outcome to the contacts table
   */
  async verifyAndSaveContact(
    businessId: string,
    rawEmail: string,
    meta: {
      name?: string | null;
      roleOrTitle?: string | null;
      phone?: string | null;
      sourceUrl?: string | null;
      provenance?: string | null;
    } = {}
  ): Promise<ContactEntity> {
    const outcome = await this.verifyEmail(rawEmail);

    return upsertContact({
      business_id: businessId,
      email: outcome.email,
      raw_email: rawEmail,
      name: meta.name || null,
      role_or_title: meta.roleOrTitle || null,
      phone: meta.phone || null,
      source_url: meta.sourceUrl || null,
      provenance: meta.provenance || 'public_website',
      syntax_valid: outcome.syntaxValid,
      mx_valid: outcome.mxValid,
      verification_status: outcome.status,
      verification_confidence: outcome.confidence,
      verification_details: outcome.details,
      is_role_account: outcome.isRoleAccount,
      is_disposable: outcome.isDisposable,
    });
  }

  async verifyAndStoreContact(
    businessId: string,
    rawEmail: string,
    meta: {
      name?: string | null;
      roleOrTitle?: string | null;
      phone?: string | null;
      sourceUrl?: string | null;
      provenance?: string | null;
    } = {}
  ): Promise<ContactEntity> {
    return this.verifyAndSaveContact(businessId, rawEmail, meta);
  }
}

export const contactVerifier = new ContactVerifier();

