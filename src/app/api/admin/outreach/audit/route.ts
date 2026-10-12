import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { getBusinessById } from '@/lib/outreach/db';
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

    const auditResult = await websiteAuditor.auditUrl(business.website_url);

    // Save audit record
    const audit = await websiteAuditor.auditBusiness(business);

    // If new public contact emails were discovered during the audit, verify & save them
    const verifiedContacts = [];
    if (auditResult.discoveredEmails && auditResult.discoveredEmails.length > 0) {
      for (const email of auditResult.discoveredEmails) {
        const contact = await contactVerifier.verifyAndSaveContact(business.id, email, {
          sourceUrl: auditResult.finalUrl || business.website_url,
          provenance: 'website_audit_scraper',
        });
        verifiedContacts.push(contact);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Website audit completed successfully.',
      audit,
      discoveredContacts: verifiedContacts,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
