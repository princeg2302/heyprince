'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Inbox,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { ServiceRecord } from '@/lib/admin-db';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';

interface ServicesListClientProps {
  initialServices: ServiceRecord[];
  categories: { id: number; title: string }[];
}

export default function ServicesListClient({ initialServices, categories }: ServicesListClientProps) {
  const { showToast } = useToast();
  const [services, setServices] = useState<ServiceRecord[]>(initialServices);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = services.filter((s) => {
    const matchesSearch =
      search === '' ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.tagline && s.tagline.toLowerCase().includes(search.toLowerCase())) ||
      (s.short_description && s.short_description.toLowerCase().includes(search.toLowerCase()));

    const matchesCat =
      categoryFilter === 'all' || String(s.category_id) === categoryFilter;

    const matchesPublished =
      publishedFilter === 'all' ||
      (publishedFilter === 'published' ? s.published : !s.published);

    return matchesSearch && matchesCat && matchesPublished;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/services/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete service.', 'error');
        setDeleteLoading(false);
        return;
      }

      setServices((prev) => prev.filter((s) => s.id !== deletingId));
      showToast('Service deleted successfully.', 'success');
      setDeletingId(null);
    } catch {
      showToast('Network error while deleting service.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="hpa-page-title-row">
        <div>
          <h1 className="hpa-page-title">Services Catalog</h1>
          <p className="hpa-page-desc">
            Manage your high-ticket consulting offerings, full-stack packages, and AI automations.
          </p>
        </div>
        <Link href="/admin/services/new" className="hpa-btn hpa-btn-primary">
          <Plus size={16} />
          <span>Add New Service</span>
        </Link>
      </div>

      <div className="hpa-card">
        {/* Filters */}
        <div className="hpa-card-header">
          <div className="hpa-table-filters">
            <div className="hpa-search-input">
              <Search size={16} style={{ color: 'var(--hpa-text-dim)' }} />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

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

            <select
              className="hpa-select"
              value={publishedFilter}
              onChange={(e) => {
                setPublishedFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="published">Live / Published</option>
              <option value="draft">Draft / Hidden</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--hpa-text-muted)' }}>
            Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'service' : 'services'}
          </div>
        </div>

        {/* Table */}
        {paginated.length > 0 ? (
          <div className="hpa-table-wrap">
            <table className="hpa-table">
              <thead>
                <tr>
                  <th>Service Offering</th>
                  <th>Category</th>
                  <th>Theme & Badge</th>
                  <th>Pricing</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((srv) => (
                  <tr key={srv.id}>
                    <td>
                      <div>
                        <Link
                          href={`/admin/services/${srv.id}`}
                          style={{
                            fontWeight: 700,
                            color: '#ffffff',
                            textDecoration: 'none',
                            display: 'block',
                            fontSize: '0.92rem',
                          }}
                        >
                          {srv.title}
                        </Link>
                        <span style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)' }}>
                          /{srv.slug} • {srv.tagline || 'Engineering Service'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                        {srv.category_name || 'Engineering'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--hpa-border)',
                            color: 'rgba(255,255,255,0.8)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {srv.card_theme}
                        </span>
                        {srv.is_featured && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(0, 245, 160, 0.12)',
                              border: '1px solid rgba(0, 245, 160, 0.3)',
                              color: 'var(--hpa-success)',
                            }}
                          >
                            ★ Featured
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>
                        {srv.starting_price ? `$${srv.starting_price}` : srv.pricing_type.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`hpa-pill ${srv.published ? 'hpa-pill-published' : 'hpa-pill-draft'}`}
                      >
                        {srv.published ? 'Live' : 'Draft'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link
                          href={`/admin/services/${srv.id}`}
                          className="hpa-btn hpa-btn-secondary hpa-btn-icon"
                          title="View Service"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/admin/services/${srv.id}/edit`}
                          className="hpa-btn hpa-btn-secondary hpa-btn-icon"
                          title="Edit Service"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <a
                          href={`https://heyprince.in/services/${srv.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hpa-btn hpa-btn-secondary hpa-btn-icon"
                          title="Open on Live Website"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => setDeletingId(srv.id)}
                          className="hpa-btn hpa-btn-danger hpa-btn-icon"
                          title="Delete Service"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="hpa-empty-state">
            <Inbox size={48} className="hpa-empty-icon" />
            <h3 className="hpa-empty-title">No services found</h3>
            <p className="hpa-empty-sub">
              {search || publishedFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Get started by creating your first service.'}
            </p>
            <Link href="/admin/services/new" className="hpa-btn hpa-btn-primary hpa-btn-sm">
              <Plus size={14} />
              <span>Add New Service</span>
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

      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Service"
        message="Are you sure you want to delete this service? All deliverables, process steps, and FAQs associated with it will be removed permanently."
        confirmLabel="Yes, Delete Service"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteLoading}
      />
    </div>
  );
}
