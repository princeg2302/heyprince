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
  const [analytics, settings, businessesRes, jobs, queuedCountRes, contacts, messages] = await Promise.all([
    getOutreachAnalyticsSummary(),
    getOutreachSettings(),
    getBusinesses({ limit: 100 }),
    getDiscoveryJobs(15),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM email_messages WHERE status = 'QUEUED';`),
    getAllContacts(100),
    query(`SELECT m.*, b.name as business_name, b.domain as business_domain, (b.metadata->>'phone') as business_phone, b.country_code as business_country, b.city as business_city, b.metadata as business_metadata FROM email_messages m LEFT JOIN businesses b ON m.business_id = b.id ORDER BY m.created_at DESC LIMIT 50;`),
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
        initialMessages={messages}
        adminEmail={user.email}
      />
    </AdminLayout>
  );
}

