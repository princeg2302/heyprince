import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../auth-check';
import { getBusinessById, getLatestAuditForBusiness } from '@/lib/outreach/db';
import { aiEngineService } from '@/lib/outreach/ai/service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { businessId, preferredProvider } = await request.json();
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const audit = await getLatestAuditForBusiness(businessId);

    const aiRecord = await aiEngineService.analyzeAndSave(
      business.id,
      {
        businessName: business.name,
        category: business.category || 'Business',
        city: business.city,
        countryCode: business.country_code,
        websiteUrl: business.website_url,
        auditSignals: audit
          ? {
              isReachable: audit.is_reachable,
              hasHttps: audit.has_https,
              mobileFriendly: audit.mobile_friendly,
              hasContactPage: audit.has_contact_page,
              hasBookingSystem: audit.has_booking_system,
              hasEcommerce: audit.has_ecommerce,
              hasNewsletter: audit.has_newsletter,
              hasLiveChat: audit.has_live_chat,
              speedIndexMs: audit.speed_index_ms,
              detectedTechnologies: audit.detected_technologies,
              signals: audit.signals,
            }
          : null,
      },
      preferredProvider
    );

    return NextResponse.json({
      success: true,
      message: 'AI business analysis & personalization draft generated.',
      analysis: aiRecord,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
