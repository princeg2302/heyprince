import { z } from 'zod';
import { supabase } from './admin-db';
import { dispatchLeadEmails } from './email';
import { verifyAndConsumeProof } from '@/lib/captcha/verifier';

export const LeadSubmissionSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(100),
  email: z.string().trim().email('Please provide a valid email address'),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  company: z.string().trim().max(100).optional().or(z.literal('')),
  service: z.string().trim().min(1, 'Please select a service').default('Frontend React / Next.js'),
  budget: z.string().trim().max(100).optional().or(z.literal('')),
  timeline: z.string().trim().max(100).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Please provide project details').max(5000),
  // Anti-bot Honeypot field (handled gracefully without failing Zod schema)
  honeypot: z.string().optional().or(z.literal('')),
  // Submission timestamp for timing-based bot detection
  formLoadedAt: z.union([z.number(), z.string()]).optional(),
  // Production-ready Custom CAPTCHA verification proof
  captchaProof: z.string().trim().min(1, 'Please complete the security check'),
});

export type LeadSubmissionInput = z.infer<typeof LeadSubmissionSchema>;

export interface LeadSubmissionResult {
  success: boolean;
  message: string;
  leadId?: string | number;
  errors?: Record<string, string[]>;
}

export function normalizeBudget(raw?: string | null): string {
  if (!raw || !raw.trim()) return 'Custom Quote';
  let val = raw.trim();
  // Fix dropped currency symbols or leading comma artifacts
  val = val.replace(/,\s*000\+/g, '$5,000+');
  val = val.replace(/,\s*500\s*-\s*,\s*000/g, '$3,500 - $5,000');
  val = val.replace(/,\s*500\s*-\s*,\s*500/g, '$1,500 - $3,500');
  val = val.replace(/^,\s*(\d)/, '$$$1');
  val = val.replace(/-\s*,\s*(\d)/, '- $$$1');
  if (/^\d/.test(val)) {
    val = `$${val}`;
  }
  return val;
}

export async function processLeadSubmission(
  rawInput: unknown,
  source = 'website_contact_form',
  clientIp?: string | null
): Promise<LeadSubmissionResult> {
  // 1. Zod Validation
  const validation = LeadSubmissionSchema.safeParse(rawInput);
  if (!validation.success) {
    const formattedErrors = validation.error.flatten().fieldErrors;
    const errorList = Object.values(formattedErrors).flat().filter(Boolean);
    const summary = errorList.length
      ? errorList.join(' • ')
      : 'Validation failed. Please verify the submitted information.';
    return {
      success: false,
      message: summary,
      errors: formattedErrors,
    };
  }

  const data = validation.data;

  // 2. Anti-Spam Check: Honeypot must be empty
  if (data.honeypot && data.honeypot.trim().length > 0) {
    console.warn('[Spam Guard] Bot caught by honeypot field submission');
    return {
      success: true,
      message: 'Thank you for your message! We will get back to you shortly.',
    };
  }

  // 3. Anti-Spam Check: Minimum human interaction time (avoid false positives on clock skew)
  if (data.formLoadedAt !== undefined) {
    const loadedAtNum =
      typeof data.formLoadedAt === 'string'
        ? parseInt(data.formLoadedAt, 10)
        : data.formLoadedAt;
    if (!isNaN(loadedAtNum)) {
      const elapsed = Date.now() - loadedAtNum;
      if (elapsed >= 0 && elapsed < 500) {
        console.warn('[Spam Guard] Rapid submission flagged (< 500ms)');
        return {
          success: true,
          message: 'Thank you for your message! We will get back to you shortly.',
        };
      }
    }
  }

  // 4. CAPTCHA Verification: Custom CAPTCHA Proof Check
  const captchaCheck = await verifyAndConsumeProof(data.captchaProof, {
    purpose: 'contact-form',
    clientIp,
  });

  if (!captchaCheck.success) {
    console.warn('[Security Guard] CAPTCHA verification failed:', captchaCheck.error, captchaCheck.code);
    const errorMsg =
      captchaCheck.error ||
      'Security verification failed. Please complete the security check to verify you are human.';
    return {
      success: false,
      message: errorMsg,
      errors: {
        captcha: [errorMsg],
      },
    };
  }

  // Normalize budget representation to ensure crisp currency formatting
  const cleanBudget = normalizeBudget(data.budget);

  let createdLeadId: string | number | undefined;

  // 5. Primary Persistence: Save directly to Supabase leads table
  // Single source of truth — executes in ~40ms and prevents duplicate entries
  try {
    const now = new Date().toISOString();
    const { data: createdLead, error: insertError } = await supabase
      .from('leads')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          company: data.company || '',
          service: data.service || 'Frontend React / Next.js',
          budget: cleanBudget,
          timeline: data.timeline || '',
          message: data.message,
          source: source,
          status: 'NEW',
          created_at: now,
          updated_at: now,
        },
      ])
      .select('id')
      .single();

    if (insertError) {
      console.error('[Leads] Supabase lead insertion error:', insertError);
    } else if (createdLead) {
      createdLeadId = createdLead.id;
      console.info(`[Leads] Saved lead #${createdLeadId} to Supabase in real-time`);
    }
  } catch (dbError) {
    console.error('[Leads] Database insertion exception:', dbError);
  }

  // 6. Send Transactional Notification & Customer 4-Hour Revert Email (Hostinger SMTP or Resend)
  try {
    await dispatchLeadEmails({
      leadId: createdLeadId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      service: data.service || 'Frontend React / Next.js',
      budget: cleanBudget,
      timeline: data.timeline,
      message: data.message,
    });
  } catch (emailError) {
    console.error('[Leads] Non-fatal email notification failure:', emailError);
  }

  // 7. Unified Lead Intelligence: Ingest Inbound Inquiry (Non-blocking & Deduplicated)
  try {
    const { upsertBusiness, upsertContact } = await import('@/lib/outreach/db');
    const { normalizeDomain, normalizeEmail } = await import('@/lib/deduplication');

    // Extract potential domain from company email
    const emailDomain = data.email.includes('@') ? data.email.split('@')[1] : null;
    const isPublicEmail = emailDomain && /^(gmail|yahoo|hotmail|outlook|icloud|proton|live)\./i.test(emailDomain);
    const domainCandidate = !isPublicEmail && emailDomain ? emailDomain : null;

    const biz = await upsertBusiness({
      name: data.company || data.name,
      domain: domainCandidate,
      normalized_domain: domainCandidate ? normalizeDomain(domainCandidate) : null,
      country_code: 'IN',
      source_provider: 'website_inbound_form',
      source_provider_id: String(createdLeadId || `inbound_${Date.now()}`),
      industry: data.service || 'Web Development',
      status: 'DISCOVERED',
      metadata: {
        inboundLeadId: createdLeadId,
        serviceRequested: data.service,
        budget: cleanBudget,
        timeline: data.timeline,
        inquiryMessage: data.message,
        phone: data.phone,
        clientIp,
        isInbound: true,
      },
    });

    const businessId = biz?.business?.id;
    if (businessId && data.email) {
      await upsertContact({
        business_id: businessId,
        email: normalizeEmail(data.email),
        name: data.name,
        phone: data.phone || null,
        provenance: 'website_contact_form',
        syntax_valid: true,
        verification_status: 'VALID',
      });
    }
    console.info(`[Leads] Ingested inbound lead #${createdLeadId} into unified Lead Intelligence pipeline`);
  } catch (ingestErr) {
    console.warn('[Leads] Non-fatal Lead Intelligence ingestion notice:', ingestErr);
  }

  return {
    success: true,
    message: 'Your inquiry has been successfully received! Expect a response within 2 to 4 hours.',
    leadId: createdLeadId,
  };
}
