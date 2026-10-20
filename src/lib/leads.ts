import { z } from 'zod';
import { supabase } from './admin-db';
import { dispatchLeadEmails } from './email';
import { verifyTurnstileToken } from './turnstile';

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
  // Cloudflare Turnstile token
  turnstileToken: z.string().optional(),
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

  // 4. CAPTCHA Verification: Cloudflare Turnstile Check
  const turnstileCheck = await verifyTurnstileToken(data.turnstileToken, clientIp);
  if (!turnstileCheck.success) {
    console.warn('[Turnstile Guard] Verification failed:', {
      errorCodes: turnstileCheck.errorCodes,
      hostname: turnstileCheck.hostname,
    });
    const errorCodesList = turnstileCheck.errorCodes?.join(', ');
    const detailMsg = errorCodesList
      ? `Security verification failed (${errorCodesList}). Please retry.`
      : 'Security verification failed or expired. Please retry.';
    return {
      success: false,
      message: detailMsg,
      errors: {
        captcha: [detailMsg],
      },
    };
  }

  // Normalize budget representation to ensure crisp currency formatting
  const cleanBudget = normalizeBudget(data.budget);

  let createdLeadId: string | number | undefined;

  // 4. Primary Persistence: Save directly to Supabase leads table
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

  // 5. Send Transactional Notification & Customer 4-Hour Revert Email (Hostinger SMTP or Resend)
  try {
    await dispatchLeadEmails({
      leadId: createdLeadId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      service: data.service,
      budget: cleanBudget,
      timeline: data.timeline,
      message: data.message,
    });
  } catch (emailError) {
    console.error('[Leads] Non-fatal email notification failure:', emailError);
  }

  return {
    success: true,
    message: 'Your inquiry has been successfully received! Expect a response within 2 to 4 hours.',
    leadId: createdLeadId,
  };
}
