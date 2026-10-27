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
import { OutreachSettingsEntity } from '@/lib/outreach/types';
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

  // Default fallback states in case of cold-start DB latency or transient connection issues
  const fallbackAnalytics = {
    totalBusinesses: 0,
    totalAudited: 0,
    totalContacts: 0,
    validContacts: 0,
    queuedEmails: 0,
    sentEmails: 0,
    deliveredEmails: 0,
    bouncedEmails: 0,
    suppressedEmails: 0,
    killSwitchActive: false,
    testModeActive: false,
  };

  const fallbackSettings: OutreachSettingsEntity = {
    id: 'default_settings',
    global_kill_switch: false,
    test_mode: false,
    daily_send_cap: 50,
    domain_hourly_cap: 5,
    min_delay_between_sends_seconds: 60,
    default_ai_provider: 'gemini',
    default_discovery_provider: 'openstreetmap',
    require_manual_review: true,
    company_name: 'HeyPrince',
    physical_address: 'India',
    contact_email: 'contact@heyprince.in',
    updated_at: new Date().toISOString(),
  };

  // Fetch persisted data with allSettled to ensure zero total dashboard crashes
  const [
    analyticsRes,
    settingsRes,
    businessesRes,
    jobsRes,
    queuedCountRes,
    contactsRes,
    messagesRes,
  ] = await Promise.allSettled([
    getOutreachAnalyticsSummary(),
    getOutreachSettings(),
    getBusinesses({ limit: 100 }),
    getDiscoveryJobs(15),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM email_messages WHERE status = 'QUEUED';`),
    getAllContacts(100),
    query(`SELECT m.*, b.name as business_name, b.domain as business_domain, (b.metadata->>'phone') as business_phone, b.country_code as business_country, b.city as business_city, b.metadata as business_metadata FROM email_messages m LEFT JOIN businesses b ON m.business_id = b.id ORDER BY m.created_at DESC LIMIT 50;`),
  ]);

  const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : fallbackAnalytics;
  const settings = settingsRes.status === 'fulfilled' ? settingsRes.value : fallbackSettings;
  const businesses = businessesRes.status === 'fulfilled' ? (businessesRes.value.items || []) : [];
  const totalBusinesses = businessesRes.status === 'fulfilled' ? (businessesRes.value.total || 0) : 0;
  const jobs = jobsRes.status === 'fulfilled' ? (jobsRes.value || []) : [];
  const queuedCount = queuedCountRes.status === 'fulfilled' ? parseInt(queuedCountRes.value[0]?.count || '0', 10) : 0;
  const contacts = contactsRes.status === 'fulfilled' ? (contactsRes.value || []) : [];
  const messages = messagesRes.status === 'fulfilled' ? (messagesRes.value || []) : [];

  if (analyticsRes.status === 'rejected') console.error('[OutreachAdminPage] Failed analytics query:', analyticsRes.reason);
  if (businessesRes.status === 'rejected') console.error('[OutreachAdminPage] Failed businesses query:', businessesRes.reason);
  if (messagesRes.status === 'rejected') console.error('[OutreachAdminPage] Failed messages query:', messagesRes.reason);

  return (
    <AdminLayout user={user}>
      <OutreachClient
        initialAnalytics={analytics}
        initialSettings={settings}
        initialBusinesses={businesses}
        totalBusinesses={totalBusinesses}
        initialJobs={jobs}
        queuedCount={queuedCount}
        initialContacts={contacts}
        initialMessages={messages}
        adminEmail={user.email}
      />
    </AdminLayout>
  );
}
