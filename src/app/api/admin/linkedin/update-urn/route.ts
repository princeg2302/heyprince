import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { query } from '@/lib/outreach/db';
import { getActiveLinkedInConnection } from '@/lib/linkedin/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const connection = await getActiveLinkedInConnection();
  if (!connection) {
    return NextResponse.json(
      { success: false, error: 'No active LinkedIn connection found.' },
      { status: 404 }
    );
  }

  const body = await request.json();
  let rawUrn = body.personUrn?.trim();
  if (!rawUrn) {
    return NextResponse.json(
      { success: false, error: 'personUrn is required.' },
      { status: 400 }
    );
  }

  // Normalize URN format
  if (rawUrn.startsWith('urn:li:member:')) {
    rawUrn = rawUrn.replace('urn:li:member:', 'urn:li:person:');
  } else if (!rawUrn.startsWith('urn:li:person:')) {
    rawUrn = `urn:li:person:${rawUrn}`;
  }

  const cleanUrn = rawUrn;
  const memberId = cleanUrn.replace('urn:li:person:', '');

  await query(
    `UPDATE linkedin_connections SET person_urn = $1, member_id = $2, updated_at = NOW() WHERE id = $3;`,
    [cleanUrn, memberId, connection.id]
  );

  return NextResponse.json({
    success: true,
    message: 'LinkedIn Person URN updated successfully.',
    personUrn: cleanUrn,
  });
}

