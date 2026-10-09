import { NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/admin-db';

export async function POST() {
  await logoutAdmin();
  return NextResponse.json({ success: true });
}
