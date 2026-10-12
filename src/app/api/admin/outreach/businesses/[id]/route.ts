import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../auth-check';
import {
  getBusinessById,
  getLatestAuditForBusiness,
  getContactsForBusiness,
  getAIAnalysisForBusiness,
} from '@/lib/outreach/db';
import { contactVerifier } from '@/lib/outreach/verifier/contact-verifier';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const business = await getBusinessById(id);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const [audit, contacts, aiAnalysis] = await Promise.all([
      getLatestAuditForBusiness(id),
      getContactsForBusiness(id),
      getAIAnalysisForBusiness(id),
    ]);

    return NextResponse.json({
      success: true,
      business,
      audit,
      contacts,
      aiAnalysis,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const business = await getBusinessById(id);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const body = await request.json();
    const email = body.email?.trim();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email address is required' }, { status: 400 });
    }

    const contact = await contactVerifier.verifyAndSaveContact(id, email, {
      name: body.name || null,
      roleOrTitle: body.roleOrTitle || null,
      provenance: 'admin_manual',
    });

    return NextResponse.json({
      success: true,
      message: `Contact ${contact.email} saved and verified (${contact.verification_status}).`,
      contact,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
