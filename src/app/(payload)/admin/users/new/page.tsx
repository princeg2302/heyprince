import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import UserForm from '@/components/admin/UserForm';

export const metadata = {
  title: 'Add Admin User — HeyPrince Admin',
  description: 'Grant administrator permissions to a team member.',
};

export default async function NewUserPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login');
  }

  return (
    <AdminLayout user={user}>
      <UserForm />
    </AdminLayout>
  );
}
