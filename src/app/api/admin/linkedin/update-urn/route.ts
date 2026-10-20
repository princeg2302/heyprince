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
  let rawOrgUrn = body.organizationUrn !== undefined ? String(body.organizationUrn).trim() : undefined;
  let orgName = body.organizationName !== undefined ? String(body.organizationName).trim() : undefined;
  let postTarget = body.postTarget?.trim();

  let cleanPersonUrn = connection.person_urn;
  let memberId = connection.member_id;

  if (rawUrn) {
    if (rawUrn.startsWith('urn:li:member:')) {
      rawUrn = rawUrn.replace('urn:li:member:', 'urn:li:person:');
    } else if (!rawUrn.startsWith('urn:li:person:')) {
      rawUrn = `urn:li:person:${rawUrn}`;
    }
    cleanPersonUrn = rawUrn;
    memberId = cleanPersonUrn.replace('urn:li:person:', '');
  }

  let cleanOrgUrn = connection.organization_urn;
  if (rawOrgUrn !== undefined) {
    if (!rawOrgUrn) {
      cleanOrgUrn = null;
    } else if (rawOrgUrn.startsWith('urn:li:organization:')) {
      cleanOrgUrn = rawOrgUrn;
    } else {
      const numericId = rawOrgUrn.replace(/\D/g, '');
      cleanOrgUrn = `urn:li:organization:${numericId || rawOrgUrn}`;
    }
  }

  let cleanPostTarget = postTarget || connection.post_target || 'personal';
  if (!['personal', 'organization', 'both'].includes(cleanPostTarget)) {
    cleanPostTarget = 'personal';
  }

  await query(
    `UPDATE linkedin_connections 
     SET person_urn = $1, 
         member_id = $2, 
         organization_urn = $3, 
         organization_name = $4, 
         post_target = $5, 
         updated_at = NOW() 
     WHERE id = $6;`,
    [
      cleanPersonUrn,
      memberId,
      cleanOrgUrn,
      orgName !== undefined ? orgName : connection.organization_name,
      cleanPostTarget,
      connection.id,
    ]
  );

  return NextResponse.json({
    success: true,
    message: 'LinkedIn destination & author settings updated successfully.',
    personUrn: cleanPersonUrn,
    organizationUrn: cleanOrgUrn,
    organizationName: orgName !== undefined ? orgName : connection.organization_name,
    postTarget: cleanPostTarget,
  });
}

