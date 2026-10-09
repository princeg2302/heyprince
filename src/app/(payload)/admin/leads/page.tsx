import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, getLeadsList } from '@/lib/admin-db';
import { isEmailConfigured } from '@/lib/email';
import AdminLayout from '@/components/admin/AdminLayout';
import LeadsClient from './LeadsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Client Leads — HeyPrince Admin',
  description: 'Inbound project inquiries and client contact management.',
};

export default async function LeadsPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  const { leads } = await getLeadsList({ limit: 100 });
  const emailReady = isEmailConfigured();

  return (
    <AdminLayout user={user}>
      <LeadsClient initialLeads={leads} isEmailConfigured={emailReady} />
    </AdminLayout>
  );
}
