'use client';

import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Inbox,
  X,
  Save,
} from 'lucide-react';
import { CategoryRecord } from '@/lib/admin-db';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';

interface CategoriesClientProps {
  initialCategories: CategoryRecord[];
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories);
  const [search, setSearch] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Delete modal
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = categories.filter((c) => {
    return (
      search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryRecord) => {
    setEditingCategory(cat);
    setTitle(cat.title);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      showToast('Title and slug are required.', 'error');
      return;
    }

    setModalLoading(true);

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to save category.', 'error');
        setModalLoading(false);
        return;
      }

      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? data.category : c))
        );
        showToast('Category updated successfully.', 'success');
      } else {
        setCategories((prev) => [...prev, data.category]);
        showToast('Category created successfully.', 'success');
      }

      setModalOpen(false);
    } catch {
      showToast('Network error while saving category.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/categories/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete category.', 'error');
        setDeleteLoading(false);
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== deletingId));
      showToast('Category deleted successfully.', 'success');
      setDeletingId(null);
    } catch {
      showToast('Network error while deleting category.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="hpa-page-title-row">
        <div>
          <h1 className="hpa-page-title">Categories & Taxonomies</h1>
          <p className="hpa-page-desc">
            Classify and organize your insights, articles, and consulting services.
          </p>
        </div>
        <button onClick={openCreateModal} className="hpa-btn hpa-btn-primary">
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      <div className="hpa-card">
        <div className="hpa-card-header">
          <div className="hpa-table-filters">
            <div className="hpa-search-input">
              <Search size={16} style={{ color: 'var(--hpa-text-dim)' }} />
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--hpa-text-muted)' }}>
            Total <strong>{filtered.length}</strong> categories
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="hpa-table-wrap">
            <table className="hpa-table">
              <thead>
                <tr>
                  <th>Category Title</th>
                  <th>URL Slug</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{cat.title}</div>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: '0.78rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--hpa-primary)',
                        }}
                      >
                        {cat.slug}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                        {cat.description || 'No description provided.'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(cat)}
                          className="hpa-btn hpa-btn-secondary hpa-btn-icon"
                          title="Edit Category"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingId(cat.id)}
                          className="hpa-btn hpa-btn-danger hpa-btn-icon"
                          title="Delete Category"
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
            <h3 className="hpa-empty-title">No categories found</h3>
            <p className="hpa-empty-sub">Create your first category tag.</p>
            <button onClick={openCreateModal} className="hpa-btn hpa-btn-primary hpa-btn-sm">
              <Plus size={14} />
              <span>Add Category</span>
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="hpa-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="hpa-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="hpa-modal-title">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--hpa-text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="hpa-form-group" style={{ margin: 0 }}>
                <label className="hpa-form-label">Category Title *</label>
                <input
                  type="text"
                  className="hpa-form-input"
                  placeholder="e.g. Artificial Intelligence & Automation"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="hpa-form-group" style={{ margin: 0 }}>
                <label className="hpa-form-label">URL Slug *</label>
                <input
                  type="text"
                  className="hpa-form-input"
                  placeholder="ai-automation"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="hpa-form-group" style={{ margin: 0 }}>
                <label className="hpa-form-label">Description</label>
                <textarea
                  className="hpa-form-textarea"
                  rows={3}
                  placeholder="Services and insights related to this topic..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="hpa-modal-actions">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="hpa-btn hpa-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="hpa-btn hpa-btn-primary">
                  <Save size={15} />
                  <span>{modalLoading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Category"
        message="Are you sure you want to delete this category? Any posts referencing it will remain intact with their saved category label."
        confirmLabel="Yes, Delete Category"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteLoading}
      />
    </div>
  );
}
