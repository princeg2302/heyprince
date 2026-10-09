import { redirect } from 'next/navigation';

export default async function CollectionsRedirectPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const [collection, action, id] = slug || [];

  if (collection === 'posts') {
    if (action === 'create') redirect('/admin/posts/new');
    if (action && action !== 'create') redirect(`/admin/posts/${action}`);
    redirect('/admin/posts');
  }

  if (collection === 'services') {
    if (action === 'create') redirect('/admin/services/new');
    if (action && action !== 'create') redirect(`/admin/services/${action}`);
    redirect('/admin/services');
  }

  if (collection === 'users') {
    if (action === 'create') redirect('/admin/users/new');
    if (action && action !== 'create') redirect(`/admin/users/${action}`);
    redirect('/admin/users');
  }

  if (collection === 'categories') {
    redirect('/admin/categories');
  }

  if (collection === 'leads') {
    redirect('/admin/leads');
  }

  if (collection === 'media') {
    redirect('/admin/media');
  }

  redirect('/admin');
}
