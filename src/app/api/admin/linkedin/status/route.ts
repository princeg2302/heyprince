import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getLinkedInConfig, getActiveLinkedInConnection } from '@/lib/linkedin/client';
import { query } from '@/lib/outreach/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const config = getLinkedInConfig();
  const connection = await getActiveLinkedInConnection();

  let recentShares: any[] = [];
  try {
    recentShares = await query(
      `
      SELECT s.*, p.title as post_title, p.slug as post_slug 
      FROM linkedin_post_shares s
      LEFT JOIN posts p ON s.post_id = p.id
      ORDER BY s.id DESC 
      LIMIT 10;
      `
    );
  } catch (err) {
    console.warn('[LinkedIn Status] Could not fetch recent shares:', err);
  }

  return NextResponse.json({
    success: true,
    isConfigured: config.isConfigured,
    redirectUri: config.redirectUri,
    hasClientId: Boolean(config.clientId),
    hasClientSecret: Boolean(config.clientSecret),
    isConnected: Boolean(connection),
    connection: connection
      ? {
          id: connection.id,
          personUrn: connection.person_urn,
          memberId: connection.member_id,
          name: connection.name,
          avatarUrl: connection.avatar_url,
          expiresAt: connection.expires_at,
          lastPublishedAt: connection.last_published_at,
          organizationUrn: connection.organization_urn || null,
          organizationName: connection.organization_name || null,
          postTarget: connection.post_target || 'personal',
          scope: connection.scope,
          needsPersonUrn: connection.person_urn === 'urn:li:person:UNKNOWN',
        }
      : null,
    recentShares,
  });
}

