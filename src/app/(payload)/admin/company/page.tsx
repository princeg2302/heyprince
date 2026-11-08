import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-db';
import { AdminLayout } from '@/components/admin/AdminLayout';
import CompanyOfficeClient from './CompanyOfficeClient';

export const dynamic = 'force-dynamic';

export default async function CompanyOfficePage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login/');
  }

  return (
    <AdminLayout user={admin}>
      <CompanyOfficeClient />
    </AdminLayout>
  );
}
