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
  Share2,
  Sparkles,
} from 'lucide-react';
import { PostRecord } from '@/lib/admin-db';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';
import { LinkedInPublishModal } from '@/components/admin/LinkedInPublishModal';

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
  const [publishingPost, setPublishingPost] = useState<PostRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Filter posts with latest on top
  const filtered = posts
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at || b.published_at || 0).getTime() -
          new Date(a.created_at || a.published_at || 0).getTime() || b.id - a.id
    )
    .filter((post) => {
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

  // Selection handlers
  const allOnPageSelected =
    paginated.length > 0 && paginated.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginated.some((p) => p.id === id)));
    } else {
      const newIds = new Set([...selectedIds, ...paginated.map((p) => p.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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
      setSelectedIds((prev) => prev.filter((id) => id !== deletingId));
      showToast('Article deleted successfully.', 'success');
      setDeletingId(null);
    } catch {
      showToast('Error connecting to server.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteLoading(true);

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete selected articles.', 'error');
        setBulkDeleteLoading(false);
        return;
      }

      setPosts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      showToast(`${selectedIds.length} article(s) deleted successfully.`, 'success');
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      showToast('Error connecting to server.', 'error');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="hpa-page-title-row">
        <div>
          <h1 className="hpa-page-title">Insights & Articles</h1>
          <p className="hpa-page-desc">
            Manage your technical engineering insights, tutorials, and career publications.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/admin/news-automation/"
            className="hpa-btn hpa-btn-secondary"
            title="Manage Daily AI News Automation"
          >
            <Sparkles size={15} style={{ color: '#a855f7' }} />
            <span>Daily AI News</span>
          </Link>
          <Link href="/admin/posts/new" className="hpa-btn hpa-btn-primary">
            <Plus size={16} />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="hpa-card">
        {/* Filters Bar */}
        <div className="hpa-card-header">
          <div className="hpa-table-filters">
            <div className="hpa-search-input">
              <Search size={16} style={{ color: 'var(--hpa-text-dim)' }} />
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
              className="hpa-select"
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
              className="hpa-select"
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

          <div style={{ fontSize: '0.82rem', color: 'var(--hpa-text-muted)' }}>
            Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'article' : 'articles'}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#ffffff' }}>
              <span>
                <strong>{selectedIds.length}</strong> article(s) selected
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="hpa-btn hpa-btn-secondary hpa-btn-sm"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                className="hpa-btn hpa-btn-sm"
                style={{
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {paginated.length > 0 ? (
          <div className="hpa-table-wrap">
            <table className="hpa-table">
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      title="Select all on this page"
                      style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#ff4757' }}
                    />
                  </th>
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
                  const isChecked = selectedIds.includes(post.id);

                  return (
                    <tr
                      key={post.id}
                      style={{
                        background: isChecked ? 'rgba(255, 71, 87, 0.06)' : undefined,
                      }}
                    >
                      <td style={{ width: '38px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(post.id)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#ff4757' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={post.cover_image || '/assets/blog/photo1.webp'}
                            alt={post.title}
                            className="hpa-table-thumb"
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
                            <span style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)' }}>
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
                          className={`hpa-status-badge ${
                            post.status === 'published' ? 'published' : 'draft'
                          }`}
                        >
                          {post.status === 'published' ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          <span>{post.status.toUpperCase()}</span>
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem',
                            color: 'var(--hpa-text-dim)',
                          }}
                        >
                          <Calendar size={13} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '6px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setPublishingPost(post)}
                            className="hpa-table-action-btn"
                            title="Publish / Share to LinkedIn"
                            style={{
                              color: '#0a66c2',
                              background: 'rgba(10, 102, 194, 0.1)',
                              borderColor: 'rgba(10, 102, 194, 0.25)',
                            }}
                          >
                            <Share2 size={14} />
                          </button>

                          <Link
                            href={`/insights/${post.slug}`}
                            target="_blank"
                            className="hpa-table-action-btn"
                            title="View on Live Site"
                          >
                            <ExternalLink size={14} />
                          </Link>

                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="hpa-table-action-btn"
                            title="Edit Article"
                          >
                            <Edit2 size={14} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeletingId(post.id)}
                            className="hpa-table-action-btn danger"
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
          <div className="hpa-empty-state">
            <Inbox size={48} className="hpa-empty-icon" />
            <h3 className="hpa-empty-title">No articles found</h3>
            <p className="hpa-empty-sub">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search keywords.'
                : 'Get started by creating your first article.'}
            </p>
            <Link href="/admin/posts/new" className="hpa-btn hpa-btn-primary hpa-btn-sm">
              <Plus size={14} />
              <span>Add New Article</span>
            </Link>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > itemsPerPage && (
          <div className="hpa-pagination">
            <span>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="hpa-btn hpa-btn-secondary hpa-btn-sm"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="hpa-btn hpa-btn-secondary hpa-btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal - Single Delete */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Insight Article"
        message="Are you sure you want to delete this article? This will remove the article and its associated sections permanently from Supabase."
        confirmLabel="Yes, Delete Article"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteLoading}
      />

      {/* Confirmation Modal - Bulk Delete */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        title={`Delete ${selectedIds.length} Article(s)`}
        message={`Are you sure you want to delete ${selectedIds.length} selected article(s)? This will permanently remove them and all their sections from the database.`}
        confirmLabel={`Yes, Delete ${selectedIds.length} Articles`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        isLoading={bulkDeleteLoading}
      />

      {/* LinkedIn Publish Modal */}
      <LinkedInPublishModal
        post={publishingPost}
        isOpen={publishingPost !== null}
        onClose={() => setPublishingPost(null)}
      />
    </div>
  );
}
