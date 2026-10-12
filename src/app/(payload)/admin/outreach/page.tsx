import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  getOutreachAnalyticsSummary,
  getOutreachSettings,
  getBusinesses,
  getDiscoveryJobs,
  getAllContacts,
  query,
} from '@/lib/outreach/db';
import OutreachClient from './OutreachClient';
import AdminLayout from '@/components/admin/AdminLayout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Global Lead Intelligence & Outreach — HeyPrince Admin',
  description: 'AI business discovery, SSRF-safe website audit, contact verification, and compliant outreach system.',
};

export default async function OutreachAdminPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  // Fetch persisted data
  const [analytics, settings, businessesRes, jobs, queuedCountRes, contacts] = await Promise.all([
    getOutreachAnalyticsSummary(),
    getOutreachSettings(),
    getBusinesses({ limit: 25 }),
    getDiscoveryJobs(15),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM email_messages WHERE status = 'QUEUED';`),
    getAllContacts(100),
  ]);

  return (
    <AdminLayout user={user}>
      <OutreachClient
        initialAnalytics={analytics}
        initialSettings={settings}
        initialBusinesses={businessesRes.items}
        totalBusinesses={businessesRes.total}
        initialJobs={jobs}
        queuedCount={parseInt(queuedCountRes[0]?.count || '0', 10)}
        initialContacts={contacts}
        adminEmail={user.email}
      />
    </AdminLayout>
  );
}

