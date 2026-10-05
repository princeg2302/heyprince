import { NextRequest, NextResponse } from 'next/server';
import { processLeadSubmission } from '@/lib/leads';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await processLeadSubmission(body, 'website_contact_page');

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/leads] Unhandled submission error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while processing your request.',
      },
      { status: 500 }
    );
  }
}
