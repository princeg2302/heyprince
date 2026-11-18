'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  Search,
  Inbox,
  X,
  FileText,
  Loader2,
  CloudLightning,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MediaRecord } from '@/lib/admin-db';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';

interface MediaClientProps {
  initialMedia: MediaRecord[];
}

export default function MediaClient({ initialMedia }: MediaClientProps) {
  const { showToast } = useToast();
  const [mediaList, setMediaList] = useState<MediaRecord[]>(initialMedia);
  const [search, setSearch] = useState('');

  // Upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Delete modal
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // R2 Migration state
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const handleRunMigration = async () => {
    setMigrating(true);
    setMigrationResult(null);
    try {
      const res = await fetch('/api/admin/storage/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });
      const data = await res.json();
      setMigrationResult(data);
      if (data.success) {
        showToast(`R2 Migration complete! ${data.migratedCount} new files copied to Cloudflare R2.`, 'success');
        const mRes = await fetch('/api/admin/media');
        const mData = await mRes.json();
        if (mData.media) setMediaList(mData.media);
      } else {
        showToast(data.error || 'Migration reported issues.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error during migration.', 'error');
    } finally {
      setMigrating(false);
    }
  };

  const filtered = mediaList
    .filter((m) => {
      return (
        search === '' ||
        m.filename.toLowerCase().includes(search.toLowerCase()) ||
        m.alt.toLowerCase().includes(search.toLowerCase()) ||
        (m.url && m.url.toLowerCase().includes(search.toLowerCase()))
      );
    })
    .sort((a, b) => {
      const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
      const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
      return (timeB || b.id) - (timeA || a.id);
    });

  const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.includes(m.id));
  const someSelected = filtered.some((m) => selectedIds.includes(m.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((m) => m.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteLoading(true);

    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete selected media assets.', 'error');
        setBulkDeleteLoading(false);
        return;
      }

      setMediaList((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
      showToast(`Successfully deleted ${selectedIds.length} media asset${selectedIds.length > 1 ? 's' : ''}.`, 'success');
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      showToast('Error deleting media records.', 'error');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleCopyUrl = (m: MediaRecord) => {
    const fullUrl = m.url?.startsWith('http') ? m.url : `https://heyprince.in${m.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(m.id);
    showToast('Asset URL copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !urlInput.trim()) {
      showToast('Please choose an image file or provide a URL.', 'error');
      return;
    }

    setUploadLoading(true);

    try {
      let res: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('alt', altText.trim() || selectedFile.name);

        res = await fetch('/api/admin/media', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlInput.trim(),
            alt: altText.trim() || 'Media image',
          }),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Upload failed.', 'error');
        setUploadLoading(false);
        return;
      }

      setMediaList((prev) => [data.media, ...prev]);
      showToast('Asset uploaded and cataloged in Supabase!', 'success');
      setUploadModalOpen(false);
      setSelectedFile(null);
      setUrlInput('');
      setAltText('');
    } catch {
      showToast('Error uploading media asset.', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/media/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete asset.', 'error');
        setDeleteLoading(false);
        return;
      }

      setMediaList((prev) => prev.filter((m) => m.id !== deletingId));
      showToast('Asset deleted successfully.', 'success');
      setDeletingId(null);
    } catch {
      showToast('Error deleting media record.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="hpa-page-title-row">
        <div>
          <h1 className="hpa-page-title">Media Vault & Assets</h1>
          <p className="hpa-page-desc">
            Upload and organize logos, portfolio hero banners, and blog cover illustrations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => {
              setMigrationResult(null);
              setMigrationModalOpen(true);
            }}
            className="hpa-btn hpa-btn-secondary"
            title="Migrate all assets from Supabase to Cloudflare R2"
          >
            <CloudLightning size={16} style={{ color: '#f59e0b' }} />
            <span>Migrate to R2</span>
          </button>
          <button onClick={() => setUploadModalOpen(true)} className="hpa-btn hpa-btn-primary">
            <Upload size={16} />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      <div className="hpa-card">
        <div className="hpa-card-header">
          <div className="hpa-table-filters">
            <div className="hpa-search-input">
              <Search size={16} style={{ color: 'var(--hpa-text-dim)' }} />
              <input
                type="text"
                placeholder="Search assets by filename or alt text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: 'var(--hpa-text-muted)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={handleSelectAll}
                style={{ cursor: 'pointer', accentColor: '#ff3366', width: '16px', height: '16px' }}
              />
              <span>Select All</span>
            </label>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--hpa-text-muted)' }}>
            Total <strong>{filtered.length}</strong> assets
          </div>
        </div>

        {/* Bulk Action Floating Bar */}
        {selectedIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'rgba(255, 51, 102, 0.08)',
              borderBottom: '1px solid rgba(255, 51, 102, 0.25)',
              color: '#ffffff',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'asset' : 'assets'} selected
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="hpa-btn hpa-btn-secondary hpa-btn-sm"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                className="hpa-btn hpa-btn-danger hpa-btn-sm"
                style={{ gap: '6px' }}
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {filtered.length > 0 ? (
          <div
            style={{
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '18px',
            }}
          >
            {filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: selectedIds.includes(item.id) ? '1px solid var(--hpa-primary)' : '1px solid var(--hpa-border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '140px',
                    background: 'var(--hpa-surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      zIndex: 2,
                      background: 'rgba(10, 10, 16, 0.8)',
                      borderRadius: '6px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleToggleSelect(item.id)}
                      style={{ cursor: 'pointer', accentColor: '#ff3366', width: '16px', height: '16px' }}
                    />
                  </div>
                  <img
                    src={item.url || '/favicon.svg'}
                    alt={item.alt || item.filename}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/heyprince-logo.svg';
                    }}
                  />
                </div>

                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '2px',
                    }}
                    title={item.filename}
                  >
                    {item.filename}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', marginBottom: '12px' }}>
                    {item.alt || 'Asset'}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      paddingTop: '8px',
                      marginTop: 'auto',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                    >
                      {copiedId === item.id ? <Check size={12} style={{ color: 'var(--hpa-success)' }} /> : <Copy size={12} />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy URL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingId(item.id)}
                      className="hpa-btn hpa-btn-danger hpa-btn-icon"
                      title="Delete Asset"
                      style={{ width: '28px', height: '28px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hpa-empty-state">
            <ImageIcon size={48} className="hpa-empty-icon" />
            <h3 className="hpa-empty-title">No media assets found</h3>
            <p className="hpa-empty-sub">
              Upload your logos, hero illustrations, and article cover images.
            </p>
            <button onClick={() => setUploadModalOpen(true)} className="hpa-btn hpa-btn-primary hpa-btn-sm">
              <Upload size={14} />
              <span>Upload Media</span>
            </button>
          </div>
        )}
      </div>

      {/* Upload Asset Modal */}
      {uploadModalOpen && (
        <div className="hpa-modal-backdrop" onClick={() => setUploadModalOpen(false)}>
          <div className="hpa-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="hpa-modal-title">Upload Media Asset</h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--hpa-text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="hpa-form-group" style={{ margin: 0 }}>
                <label className="hpa-form-label">Choose Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hpa-form-input"
                  style={{ padding: '8px' }}
                />
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--hpa-text-dim)' }}>
                — OR ENTER DIRECT URL —
              </div>

              <div className="hpa-form-group" style={{ margin: 0 }}>
                <label className="hpa-form-label">External Image URL</label>
                <input
                  type="text"
                  placeholder="https://... or /assets/blog/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="hpa-form-input"
                />
              </div>

              <div className="hpa-form-group" style={{ margin: 0 }}>
                <label className="hpa-form-label">Alt / Descriptive Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Prince technical architecture diagram"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="hpa-form-input"
                />
              </div>

              <div className="hpa-modal-actions">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="hpa-btn hpa-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={uploadLoading} className="hpa-btn hpa-btn-primary">
                  {uploadLoading ? <Loader2 size={15} className="hpa-spin" /> : <Upload size={15} />}
                  <span>{uploadLoading ? 'Uploading...' : 'Save Asset'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Media Asset"
        message="Are you sure you want to delete this media item? Any references to it will lose their media relation."
        confirmLabel="Yes, Delete Asset"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteLoading}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        title="Delete Selected Media Assets"
        message={`Are you sure you want to permanently delete these ${selectedIds.length} selected media assets? Any references to them will lose their media relation.`}
        confirmLabel={bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedIds.length} Assets`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        isLoading={bulkDeleteLoading}
      />

      {/* Cloudflare R2 Migration Modal */}
      {migrationModalOpen && (
        <div className="hpa-modal-backdrop">
          <div className="hpa-modal" style={{ maxWidth: '580px' }}>
            <div className="hpa-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CloudLightning size={20} style={{ color: '#f59e0b' }} />
                <h3 className="hpa-modal-title">Migrate Assets to Cloudflare R2</h3>
              </div>
              <button
                type="button"
                onClick={() => setMigrationModalOpen(false)}
                className="hpa-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 16px 0' }}>
                This tool automatically streams all <strong>115+ images and blog assets</strong> currently stored in Supabase Storage into your <strong>Cloudflare R2 bucket</strong>, and updates all corresponding database records in the <code>media</code> and <code>posts</code> tables.
              </p>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  marginBottom: '20px',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '6px', fontWeight: 600 }}>
                  <CheckCircle2 size={16} />
                  <span>Zero Downtime & Safe Preservation</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8' }}>
                  <li>Existing Supabase files remain intact without deletion.</li>
                  <li>Blog cover images and media vault assets are placed in organized R2 folders.</li>
                  <li>Idempotent: Assets already present in R2 are automatically skipped.</li>
                </ul>
              </div>

              {migrationResult && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: migrationResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: migrationResult.success ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: migrationResult.success ? '#4ade80' : '#f87171', fontWeight: 700, marginBottom: '8px' }}>
                    {migrationResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{migrationResult.success ? 'Migration Succeeded!' : 'Migration Finished with Warnings'}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', color: '#e2e8f0' }}>
                    <div>Total Source Files: <strong>{migrationResult.totalSourceFiles}</strong></div>
                    <div>Newly Uploaded to R2: <strong>{migrationResult.migratedCount}</strong></div>
                    <div>Already in R2: <strong>{migrationResult.alreadyInR2Count}</strong></div>
                    <div>Failed: <strong>{migrationResult.failedCount}</strong></div>
                    <div>Blog Posts Repointed: <strong>{migrationResult.postsUpdatedTotal}</strong></div>
                    <div>Media Vault Repointed: <strong>{migrationResult.mediaUpdatedTotal}</strong></div>
                  </div>
                  {migrationResult.error && (
                    <div style={{ marginTop: '8px', color: '#f87171', fontSize: '0.78rem' }}>
                      Error: {migrationResult.error}
                    </div>
                  )}
                </div>
              )}

              <div className="hpa-modal-actions">
                <button
                  type="button"
                  onClick={() => setMigrationModalOpen(false)}
                  disabled={migrating}
                  className="hpa-btn hpa-btn-secondary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleRunMigration}
                  disabled={migrating}
                  className="hpa-btn hpa-btn-primary"
                  style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000000', fontWeight: 700 }}
                >
                  {migrating ? <Loader2 size={15} className="hpa-spin" /> : <CloudLightning size={15} />}
                  <span>{migrating ? 'Migrating Files to R2...' : 'Start Migration to R2'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
