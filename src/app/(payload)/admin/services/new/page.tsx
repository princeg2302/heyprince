import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, getCategoriesList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import ServiceForm from '@/components/admin/ServiceForm';

export const metadata = {
  title: 'Add Service — HeyPrince Admin',
  description: 'Create and launch a new consulting service or solution package.',
};

export default async function NewServicePage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login');
  }

  const categories = await getCategoriesList();

  return (
    <AdminLayout user={user}>
      <ServiceForm categories={categories} />
    </AdminLayout>
  );
}
