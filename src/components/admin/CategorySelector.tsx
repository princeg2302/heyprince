'use client';

import React, { useState } from 'react';
import { Plus, X, Loader2, FolderPlus } from 'lucide-react';
import { useToast } from '@/components/admin/Toast';

export interface CategoryItem {
  id: number;
  title: string;
  slug?: string;
}

interface CategorySelectorProps {
  categories: CategoryItem[];
  selectedCategoryId: number | '';
  onChange: (id: number | '', name?: string) => void;
  label?: string;
  required?: boolean;
}

export function CategorySelector({
  categories: initialCategories,
  selectedCategoryId,
  onChange,
  label = 'Category',
  required = false,
}: CategorySelectorProps) {
  const { showToast } = useToast();
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(initialCategories || []);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNewSlug(generatedSlug);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    const slugToUse = (newSlug.trim() || newTitle.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: slugToUse,
          description: newDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to create category', 'error');
        return;
      }

      const createdCat: CategoryItem = {
        id: data.category.id,
        title: data.category.title,
        slug: data.category.slug,
      };

      // Check if already in list, if not append
      setCategoriesList((prev) => {
        const exists = prev.some((c) => c.id === createdCat.id);
        return exists ? prev : [...prev, createdCat].sort((a, b) => a.title.localeCompare(b.title));
      });

      // Select newly created category
      onChange(createdCat.id, createdCat.title);

      // Reset and close creation form
      setNewTitle('');
      setNewSlug('');
      setNewDescription('');
      setIsCreating(false);

      showToast(`Category "${createdCat.title}" created & selected!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error creating category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__create_new__') {
      setIsCreating(true);
      return;
    }
    const numVal = val ? Number(val) : '';
    const matched = categoriesList.find((c) => c.id === numVal);
    onChange(numVal, matched?.title);
  };

  return (
    <div className="hpa-form-group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label className="hpa-form-label" style={{ marginBottom: 0 }}>
          {label} {required && <span style={{ color: 'var(--hpa-primary)' }}>*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="hpa-btn hpa-btn-secondary"
          style={{
            padding: '3px 10px',
            fontSize: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            borderRadius: '6px',
            border: isCreating ? '1px solid var(--hpa-primary)' : undefined,
            color: isCreating ? 'var(--hpa-primary)' : undefined,
          }}
          title="Create a new custom category"
        >
          {isCreating ? <X size={12} /> : <Plus size={12} />}
          <span>{isCreating ? 'Cancel' : 'New Category'}</span>
        </button>
      </div>

      {/* Primary Category Select Dropdown */}
      <select
        className="hpa-form-select"
        value={selectedCategoryId}
        onChange={handleSelectChange}
        required={required}
      >
        <option value="">Select Category</option>
        {categoriesList.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
        <option value="__create_new__" style={{ fontWeight: 700, color: '#f43f5e' }}>
          + Create New Category...
        </option>
      </select>

      {/* Inline New Category Creation Card */}
      {isCreating && (
        <div
          style={{
            marginTop: '12px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--hpa-primary)50',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            borderRadius: '10px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ffffff', fontSize: '0.85rem', fontWeight: 700 }}>
            <FolderPlus size={16} style={{ color: 'var(--hpa-primary)' }} />
            <span>Create Custom Category</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', display: 'block', marginBottom: '4px' }}>
                Category Title *
              </label>
              <input
                type="text"
                className="hpa-form-input"
                placeholder="e.g. AI & Automation"
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', display: 'block', marginBottom: '4px' }}>
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                className="hpa-form-input"
                placeholder="e.g. ai-automation"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', display: 'block', marginBottom: '4px' }}>
              Description (Optional)
            </label>
            <input
              type="text"
              className="hpa-form-input"
              placeholder="Brief description of this category topic"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="hpa-btn hpa-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateCategory}
              className="hpa-btn hpa-btn-primary"
              style={{ padding: '6px 16px', fontSize: '0.78rem' }}
              disabled={isSubmitting || !newTitle.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="hpa-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus size={13} />
                  <span>Save &amp; Select</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategorySelector;

