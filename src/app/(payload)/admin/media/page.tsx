import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, getMediaList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import MediaClient from './MediaClient';

export const metadata = {
  title: 'Media Vault — HeyPrince Admin',
  description: 'Manage media files, illustrations, and logos.',
};

export default async function MediaPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login');
  }

  const media = await getMediaList();

  return (
    <AdminLayout user={user}>
      <MediaClient initialMedia={media} />
    </AdminLayout>
  );
}
