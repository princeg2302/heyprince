import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import { getAllEmployees, createOrUpdateEmployee, updateEmployeeStatus } from '@/lib/company/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const employees = await getAllEmployees();
    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list employees.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (body.action === 'update_status') {
      const { id, status, currentActivity } = body;
      if (!id || !status) {
        return NextResponse.json({ success: false, error: 'Missing employee id or status.' }, { status: 400 });
      }
      await updateEmployeeStatus(id, status, currentActivity);
      return NextResponse.json({ success: true, message: `Status updated for ${id}` });
    }

    if (!body.id || !body.name) {
      return NextResponse.json({ success: false, error: 'Missing id or name.' }, { status: 400 });
    }

    const employee = await createOrUpdateEmployee(body);
    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update employee.' },
      { status: 500 }
    );
  }
}
