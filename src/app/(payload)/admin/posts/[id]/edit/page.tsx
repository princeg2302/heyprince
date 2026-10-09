import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentAdmin, getPostById, getCategoriesList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import PostForm from '@/components/admin/PostForm';

export const metadata = {
  title: 'Edit Article — HeyPrince Admin',
  description: 'Update article content, metadata, or publication status.',
};

export default async function EditPostPage({
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

  const [post, categories] = await Promise.all([
    getPostById(numId),
    getCategoriesList(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <AdminLayout user={user}>
      <PostForm initialData={post} categories={categories} isEdit={true} />
    </AdminLayout>
  );
}
