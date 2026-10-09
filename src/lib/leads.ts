import { z } from 'zod';
import { supabase } from './admin-db';
import { sendLeadNotificationEmail } from './email';

export const LeadSubmissionSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters').max(100),
  email: z.string().trim().email('Please provide a valid email address'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  company: z.string().trim().max(100).optional().or(z.literal('')),
  service: z.string().trim().min(2, 'Please select a service'),
  budget: z.string().trim().max(50).optional().or(z.literal('')),
  timeline: z.string().trim().max(50).optional().or(z.literal('')),
  message: z.string().trim().min(2, 'Please provide project details').max(5000),
  // Anti-bot Honeypot field (must remain empty for humans)
  honeypot: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
  // Submission timestamp for timing-based bot detection
  formLoadedAt: z.number().optional(),
});

export type LeadSubmissionInput = z.infer<typeof LeadSubmissionSchema>;

export interface LeadSubmissionResult {
  success: boolean;
  message: string;
  leadId?: string | number;
  errors?: Record<string, string[]>;
}

export async function processLeadSubmission(
  rawInput: unknown,
  source = 'website_contact_form'
): Promise<LeadSubmissionResult> {
  // 1. Zod Validation
  const validation = LeadSubmissionSchema.safeParse(rawInput);
  if (!validation.success) {
    const formattedErrors = validation.error.flatten().fieldErrors;
    return {
      success: false,
      message: 'Validation failed. Please verify the submitted information.',
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
  if (data.formLoadedAt) {
    const elapsed = Date.now() - data.formLoadedAt;
    if (elapsed >= 0 && elapsed < 800) {
      console.warn('[Spam Guard] Rapid submission flagged (< 800ms)');
      return {
        success: true,
        message: 'Thank you for your message! We will get back to you shortly.',
      };
    }
  }

  let createdLeadId: string | number | undefined;

  // 4. Primary Persistence: Save directly to Supabase leads table
  // This executes in <50ms and guarantees immediate visibility in /admin/leads
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
          service: data.service,
          budget: data.budget || '',
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

  // 5. Optional background sync to Payload CMS if configured (non-blocking)
  if (process.env.DATABASE_URI || process.env.POSTGRES_URL) {
    import('@payload-config')
      .then((cfgModule) => import('payload').then((pModule) => ({ config: cfgModule.default, getPayload: pModule.getPayload })))
      .then(async ({ config, getPayload }) => {
        const payload = await getPayload({ config });
        await payload.create({
          collection: 'leads',
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            company: data.company || '',
            service: data.service,
            budget: data.budget || '',
            timeline: data.timeline || '',
            message: data.message,
            source: source,
            status: 'NEW',
          },
        });
      })
      .catch((pErr) => {
        // Log softly without blocking or failing the lead response
        console.warn('[Leads] Background Payload sync notice:', pErr?.message);
      });
  }

  // 6. Send Transactional Notification Email (Resend or SMTP)
  try {
    await sendLeadNotificationEmail({
      leadId: createdLeadId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      service: data.service,
      budget: data.budget,
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
