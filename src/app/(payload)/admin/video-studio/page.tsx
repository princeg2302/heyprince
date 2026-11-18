import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-db';
import { AdminLayout } from '@/components/admin/AdminLayout';
import VideoStudioClient from './VideoStudioClient';

export const dynamic = 'force-dynamic';

export default async function VideoStudioPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login/');
  }

  return (
    <AdminLayout user={admin}>
      <VideoStudioClient />
    </AdminLayout>
  );
}
