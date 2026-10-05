import { permanentRedirect } from 'next/navigation';
import { getPosts } from '@/lib/cms';

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogRedirectRoute({ params }: BlogPageProps) {
  const { slug } = await params;
  permanentRedirect(`/insights/${slug}/`);
}
