import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, getCategoriesList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import CategoriesClient from './CategoriesClient';

export const metadata = {
  title: 'Categories — HeyPrince Admin',
  description: 'Manage taxonomies and content classifications.',
};

export default async function CategoriesPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login');
  }

  const categories = await getCategoriesList();

  return (
    <AdminLayout user={user}>
      <CategoriesClient initialCategories={categories} />
    </AdminLayout>
  );
}
