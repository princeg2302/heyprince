import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { getBusinessById, query } from '@/lib/outreach/db';
import { websiteAuditor } from '@/lib/outreach/auditor/website-auditor';
import { contactVerifier } from '@/lib/outreach/verifier/contact-verifier';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { businessId } = await request.json();
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    if (!business.website_url) {
      return NextResponse.json({ success: false, error: 'Business has no website URL to audit' }, { status: 400 });
    }

    // 1. Run deep multi-page audit (homepage + contact/about subpages)
    const auditResult = await websiteAuditor.auditUrl(business.website_url);

    // 2. Persist audit record
    const audit = await websiteAuditor.auditBusiness(business);

    const primaryPhone = auditResult.discoveredPhones[0] || null;
    const primaryWhatsApp = auditResult.discoveredWhatsAppUrls[0] || null;

    // 3. Persist & verify all discovered public emails
    const verifiedContacts = [];
    if (auditResult.discoveredEmails && auditResult.discoveredEmails.length > 0) {
      for (const email of auditResult.discoveredEmails) {
        const contact = await contactVerifier.verifyAndSaveContact(business.id, email, {
          phone: primaryPhone,
          sourceUrl: auditResult.finalUrl || business.website_url,
          provenance: 'deep_website_audit',
        });
        verifiedContacts.push(contact);
      }
    }

    // 4. Update business metadata with phone numbers, WhatsApp link, and crawled pages
    let updatedBusiness = business;
    if (primaryPhone || auditResult.discoveredPhones.length > 0 || primaryWhatsApp) {
      const updatedRows = await query(
        `UPDATE businesses SET 
          metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'phone', COALESCE($1, metadata->>'phone'),
            'phones', $2::jsonb,
            'whatsapp_url', COALESCE($3, metadata->>'whatsapp_url'),
            'crawled_pages', $4::jsonb
          ),
          updated_at = NOW()
         WHERE id = $5 RETURNING *;`,
        [
          primaryPhone,
          JSON.stringify(auditResult.discoveredPhones),
          primaryWhatsApp,
          JSON.stringify(auditResult.crawledPages),
          business.id,
        ]
      );
      if (updatedRows && updatedRows[0]) {
        updatedBusiness = updatedRows[0];
      }

      // If contacts exist for this business without a phone, attach the primary discovered phone
      if (primaryPhone) {
        await query(
          `UPDATE contacts SET phone = $1, updated_at = NOW() WHERE business_id = $2 AND phone IS NULL;`,
          [primaryPhone, business.id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deep audit completed. Discovered ${auditResult.discoveredEmails.length} email(s) and ${auditResult.discoveredPhones.length} phone(s) across ${auditResult.crawledPages.length} page(s).`,
      audit,
      business: updatedBusiness,
      discoveredContacts: verifiedContacts,
      discoveredPhones: auditResult.discoveredPhones,
      discoveredWhatsAppUrls: auditResult.discoveredWhatsAppUrls,
      crawledPages: auditResult.crawledPages,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

