import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, getCategoriesList } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';
import PostForm from '@/components/admin/PostForm';

export const metadata = {
  title: 'New Article — HeyPrince Admin',
  description: 'Create and publish an engineering insight or blog post.',
};

export default async function NewPostPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  const categories = await getCategoriesList();

  return (
    <AdminLayout user={user}>
      <PostForm
        categories={categories}
        defaultAuthorAvatar={user.avatar_url || undefined}
        defaultAuthorName={user.name}
      />
    </AdminLayout>
  );
}
