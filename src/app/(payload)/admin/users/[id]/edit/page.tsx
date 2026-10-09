import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentAdmin, getUserById } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import UserForm from '@/components/admin/UserForm';

export const metadata = {
  title: 'Edit Admin User — HeyPrince Admin',
  description: 'Update user name, role, email, or credentials.',
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  const targetUser = await getUserById(numId);
  if (!targetUser) notFound();

  return (
    <AdminLayout user={user}>
      <UserForm initialData={targetUser} isEdit={true} />
    </AdminLayout>
  );
}
