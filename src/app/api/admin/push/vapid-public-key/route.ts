import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push/push-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({ success: true, publicKey });
}

