import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-db';
import { AdminLayout } from '@/components/admin/AdminLayout';
import ChiefOfStaffClient from './ChiefOfStaffClient';

export const dynamic = 'force-dynamic';

export default async function ChiefOfStaffPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login/');
  }

  return (
    <AdminLayout user={admin}>
      <ChiefOfStaffClient />
    </AdminLayout>
  );
}

