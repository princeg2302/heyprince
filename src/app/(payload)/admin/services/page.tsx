import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, getServicesList, getCategoriesList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import ServicesListClient from './ServicesListClient';

export const metadata = {
  title: 'Services — HeyPrince Admin',
  description: 'Manage core consulting and engineering service offerings.',
};

export default async function ServicesPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  const [{ services }, categories] = await Promise.all([
    getServicesList({ limit: 100 }),
    getCategoriesList(),
  ]);

  return (
    <AdminLayout user={user}>
      <ServicesListClient initialServices={services} categories={categories} />
    </AdminLayout>
  );
}
