'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Lock, Mail, User as UserIcon, Shield, Upload, Trash2, Camera, Loader2 } from 'lucide-react';
import { AdminUser } from '@/lib/admin-db';
import { useToast } from '@/components/admin/Toast';

interface UserFormProps {
  initialData?: AdminUser;
  isEdit?: boolean;
}

export function UserForm({ initialData, isEdit = false }: UserFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [role, setRole] = useState<'admin' | 'editor'>(initialData?.role || 'admin');
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG, WebP).', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', `${name || 'Author'} Profile Picture`);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to upload profile picture.', 'error');
        setUploadingAvatar(false);
        return;
      }

      setAvatarUrl(data.media.url);
      showToast('Profile picture uploaded successfully! Click Save Changes to apply.', 'success');
    } catch {
      showToast('Network error while uploading profile photo.', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('Email is required.', 'error');
      return;
    }

    if (!isEdit && !password) {
      showToast('Password is required for new accounts.', 'error');
      return;
    }

    if (password && password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);

    const payload: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      avatar_url: avatarUrl.trim(),
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    try {
      const url = isEdit ? `/api/admin/users/${initialData?.id}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to save user.', 'error');
        setLoading(false);
        return;
      }

      showToast(isEdit ? 'User updated successfully!' : 'User created successfully!', 'success');
      router.push('/admin/users');
      router.refresh();
    } catch {
      showToast('Network error while saving user.', 'error');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="hpa-page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/admin/users" className="hpa-btn hpa-btn-secondary hpa-btn-icon" title="Back">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="hpa-page-title">{isEdit ? 'Edit Admin User' : 'Add Admin User'}</h1>
            <p className="hpa-page-desc">
              {isEdit ? `Editing ${initialData?.email}` : 'Grant administrative permissions to a team member'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/users" className="hpa-btn hpa-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="hpa-btn hpa-btn-primary">
            <Save size={16} />
            <span>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}</span>
          </button>
        </div>
      </div>

      <div className="hpa-form-card" style={{ maxWidth: '640px' }}>
        {/* Profile Picture / Author Avatar Management */}
        <div className="hpa-form-group" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--hpa-border)' }}>
          <label className="hpa-form-label" style={{ marginBottom: '10px' }}>
            Author Profile Picture / Avatar
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--hpa-primary), var(--hpa-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.8rem',
                color: '#ffffff',
                overflow: 'hidden',
                flexShrink: 0,
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Profile'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (name || 'P').charAt(0).toUpperCase()
              )}
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="hpa-btn hpa-btn-primary hpa-btn-sm"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 size={14} className="hpa-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload New Photo</span>
                    </>
                  )}
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="hpa-btn hpa-btn-danger hpa-btn-sm"
                    title="Remove Photo"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                className="hpa-form-input"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                placeholder="Or paste direct image URL (https://...)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>
          <span className="hpa-form-help" style={{ marginTop: '10px', display: 'block', lineHeight: 1.4 }}>
            💡 Updating this profile picture automatically synchronizes your photo across every single blog article, author bio box, admin navigation, and account settings.
          </span>
        </div>

        <div className="hpa-form-group">
          <label className="hpa-form-label">Full Name *</label>
          <div style={{ position: 'relative' }}>
            <UserIcon
              size={17}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hpa-text-dim)' }}
            />
            <input
              type="text"
              className="hpa-form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="e.g. Prince"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="hpa-form-group">
          <label className="hpa-form-label">Email Address *</label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={17}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hpa-text-dim)' }}
            />
            <input
              type="email"
              className="hpa-form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="e.g. colleague@heyprince.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="hpa-form-group">
          <label className="hpa-form-label">Role & Permissions</label>
          <select
            className="hpa-select"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="admin">Administrator (Full Access)</option>
            <option value="editor">Editor (Content Management)</option>
          </select>
          <span className="hpa-form-help">
            Administrators can create users and change database configurations.
          </span>
        </div>

        <div className="hpa-form-group">
          <label className="hpa-form-label">{isEdit ? 'New Password (Leave blank to keep current)' : 'Password *'}</label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={17}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hpa-text-dim)' }}
            />
            <input
              type="password"
              className="hpa-form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
            />
          </div>
        </div>

        {password && (
          <div className="hpa-form-group">
            <label className="hpa-form-label">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hpa-text-dim)' }}
              />
              <input
                type="password"
                className="hpa-form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

export default UserForm;
