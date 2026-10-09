import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, getUsersList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import UsersListClient from './UsersListClient';

export const metadata = {
  title: 'Admin Users — HeyPrince Admin',
  description: 'Manage administrator accounts and permissions.',
};

export default async function UsersPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login');
  }

  const users = await getUsersList();

  return (
    <AdminLayout user={user}>
      <UsersListClient initialUsers={users} currentAdminId={user.id} />
    </AdminLayout>
  );
}
