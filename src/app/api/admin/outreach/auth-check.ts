import { NextResponse } from 'next/server';
import { getCurrentAdmin, AdminUser } from '@/lib/admin-db';

export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Administrative authentication required.' },
      { status: 401 }
    );
  }
  return admin;
}

