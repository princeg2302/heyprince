import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Settings & Security — HeyPrince Admin',
  description: 'Manage executive profile, Two-Factor Authentication (MFA), social media channels, and cloud infrastructure.',
};

export default async function SettingsPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muzbzrxwbanzsjvgtexp.supabase.co';

  return (
    <AdminLayout user={user}>
      <SettingsClient user={user} supabaseUrl={supabaseUrl} />
    </AdminLayout>
  );
}
