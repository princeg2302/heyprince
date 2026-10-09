'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  ExternalLink,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { PostRecord } from '@/lib/admin-db';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';

interface PostsListClientProps {
  initialPosts: PostRecord[];
  categories: { id: number; title: string }[];
}

export default function PostsListClient({ initialPosts, categories }: PostsListClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostRecord[]>(initialPosts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Filter posts
  const filtered = posts.filter((post) => {
    const matchesSearch =
      search === '' ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.slug.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || post.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' ||
      String(post.category_id) === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/posts/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete post.', 'error');
        setDeleteLoading(false);
        return;
      }

      setPosts((prev) => prev.filter((p) => p.id !== deletingId));
      showToast('Article deleted successfully.', 'success');
      setDeletingId(null);
    } catch {
      showToast('Error connecting to server.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="ad-page-title-row">
        <div>
          <h1 className="ad-page-title">Insights & Articles</h1>
          <p className="ad-page-desc">
            Manage your technical engineering insights, tutorials, and career publications.
          </p>
        </div>
        <Link href="/admin/posts/new" className="ad-btn ad-btn-primary">
          <Plus size={16} />
          <span>New Article</span>
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="ad-card">
        {/* Filters Bar */}
        <div className="ad-card-header">
          <div className="ad-table-filters">
            <div className="ad-search-input">
              <Search size={16} style={{ color: 'var(--ad-text-dim)' }} />
              <input
                type="text"
                placeholder="Search by title, slug, or content..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="ad-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              className="ad-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--ad-text-muted)' }}>
            Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'article' : 'articles'}
          </div>
        </div>

        {/* Table */}
        {paginated.length > 0 ? (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Published Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((post) => {
                  const dateStr = post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Draft';

                  return (
                    <tr key={post.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={post.cover_image || '/assets/blog/photo1.webp'}
                            alt={post.title}
                            className="ad-table-thumb"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/blog/photo1.webp';
                            }}
                          />
                          <div>
                            <Link
                              href={`/admin/posts/${post.id}`}
                              style={{
                                fontWeight: 700,
                                color: '#ffffff',
                                textDecoration: 'none',
                                display: 'block',
                                maxWidth: '320px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {post.title}
                            </Link>
                            <span style={{ fontSize: '0.76rem', color: 'var(--ad-text-dim)' }}>
                              /{post.slug} • {post.read_mins || '5 min'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                          {post.category_name || 'General'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 500 }}>
                          {post.author_name}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`ad-pill ${
                            post.status === 'published' ? 'ad-pill-published' : 'ad-pill-draft'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.82rem', color: 'var(--ad-text-muted)' }}>
                        {dateStr}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            href={`/admin/posts/${post.id}`}
                            className="ad-btn ad-btn-secondary ad-btn-icon"
                            title="View Full Post"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="ad-btn ad-btn-secondary ad-btn-icon"
                            title="Edit Post"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <a
                            href={`https://heyprince.in/insights/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ad-btn ad-btn-secondary ad-btn-icon"
                            title="Open on Live Website"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={() => setDeletingId(post.id)}
                            className="ad-btn ad-btn-danger ad-btn-icon"
                            title="Delete Article"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ad-empty-state">
            <Inbox size={48} className="ad-empty-icon" />
            <h3 className="ad-empty-title">No articles found</h3>
            <p className="ad-empty-sub">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search keywords.'
                : 'Get started by creating your first article.'}
            </p>
            <Link href="/admin/posts/new" className="ad-btn ad-btn-primary ad-btn-sm">
              <Plus size={14} />
              <span>Add New Article</span>
            </Link>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > itemsPerPage && (
          <div className="ad-pagination">
            <span>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="ad-btn ad-btn-secondary ad-btn-sm"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="ad-btn ad-btn-secondary ad-btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Insight Article"
        message="Are you sure you want to delete this article? This will remove the article and its associated sections permanently from Supabase."
        confirmLabel="Yes, Delete Article"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteLoading}
      />
    </div>
  );
}
