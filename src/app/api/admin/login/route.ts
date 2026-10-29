import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const result = await authenticateAdmin(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // If Multi-Factor Authentication is enabled, require the 2FA challenge step
    if (result.requireMfa) {
      return NextResponse.json({
        success: true,
        requireMfa: true,
        mfaPendingToken: result.mfaPendingToken,
      });
    }

    return NextResponse.json({
      success: true,
      requireMfa: false,
      user: result.user,
    });
  } catch (error: any) {
    console.error('[API /api/admin/login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
