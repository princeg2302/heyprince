import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, getPostsList, getCategoriesList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import PostsListClient from './PostsListClient';

export const metadata = {
  title: 'Insights & Articles — HeyPrince Admin',
  description: 'Manage publications, technical blogs, and insights.',
};

export default async function PostsPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  const [{ posts }, categories] = await Promise.all([
    getPostsList({ limit: 100 }),
    getCategoriesList(),
  ]);

  return (
    <AdminLayout user={user}>
      <PostsListClient initialPosts={posts} categories={categories} />
    </AdminLayout>
  );
}
