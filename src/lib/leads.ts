import config from '@payload-config';
import { getPayload } from 'payload';
import { z } from 'zod';
import { sendLeadNotificationEmail } from './email';

export const LeadSubmissionSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters').max(100),
  email: z.string().trim().email('Please provide a valid email address'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  company: z.string().trim().max(100).optional().or(z.literal('')),
  service: z.string().trim().min(2, 'Please select a service'),
  budget: z.string().trim().max(50).optional().or(z.literal('')),
  timeline: z.string().trim().max(50).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Please describe your project in at least 10 characters').max(3000),
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
    // Silently return fake success so bots do not retry with different vectors
    return {
      success: true,
      message: 'Thank you for your message! We will get back to you shortly.',
    };
  }

  // 3. Anti-Spam Check: Minimum human interaction time (1.2 seconds)
  if (data.formLoadedAt && Date.now() - data.formLoadedAt < 1200) {
    console.warn('[Spam Guard] Rapid submission flagged (< 1.2s)');
    return {
      success: true,
      message: 'Thank you for your message! We will get back to you shortly.',
    };
  }

  let createdLeadId: string | number | undefined;

  // 4. Database Persistence via Payload CMS Local API
  try {
    if (process.env.DATABASE_URI || process.env.POSTGRES_URL) {
      const payload = await getPayload({ config });
      const leadDoc = await payload.create({
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
      createdLeadId = leadDoc?.id;
    } else {
      console.info('[Leads] No DATABASE_URI configured; lead received for email notification:', {
        name: data.name,
        email: data.email,
        service: data.service,
      });
    }
  } catch (dbError) {
    // Database insertion issue should be logged, but we still attempt email dispatch
    console.error('[Leads] Database insertion error:', dbError);
  }

  // 5. Send Transactional Notification Email via Resend
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
    // Email failure MUST NOT corrupt the lead or cause user failure
    console.error('[Leads] Non-fatal email notification failure:', emailError);
  }

  return {
    success: true,
    message: 'Your inquiry has been successfully dispatched! Expect a response within 2 to 4 hours.',
    leadId: createdLeadId,
  };
}

