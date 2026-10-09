import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentAdmin, getServiceById, getCategoriesList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import ServiceForm from '@/components/admin/ServiceForm';

export const metadata = {
  title: 'Edit Service — HeyPrince Admin',
  description: 'Update service details, deliverables, pricing, and process steps.',
};

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  const [service, categories] = await Promise.all([
    getServiceById(numId),
    getCategoriesList(),
  ]);

  if (!service) notFound();

  return (
    <AdminLayout user={user}>
      <ServiceForm initialData={service} categories={categories} isEdit={true} />
    </AdminLayout>
  );
}
