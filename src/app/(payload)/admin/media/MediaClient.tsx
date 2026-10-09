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

  const filtered = mediaList.filter((m) => {
    return (
      search === '' ||
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      m.alt.toLowerCase().includes(search.toLowerCase()) ||
      (m.url && m.url.toLowerCase().includes(search.toLowerCase()))
    );
  });

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
        <button onClick={() => setUploadModalOpen(true)} className="hpa-btn hpa-btn-primary">
          <Upload size={16} />
          <span>Upload Media</span>
        </button>
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
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--hpa-text-muted)' }}>
            Total <strong>{filtered.length}</strong> assets
          </div>
        </div>

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
                  border: '1px solid var(--hpa-border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
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
                  <Upload size={15} />
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
    </div>
  );
}
