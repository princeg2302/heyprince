'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Lock, Mail, User as UserIcon, Shield } from 'lucide-react';
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div className="ad-page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/admin/users" className="ad-btn ad-btn-secondary ad-btn-icon" title="Back">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="ad-page-title">{isEdit ? 'Edit Admin User' : 'Add Admin User'}</h1>
            <p className="ad-page-desc">
              {isEdit ? `Editing ${initialData?.email}` : 'Grant administrative permissions to a team member'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/users" className="ad-btn ad-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="ad-btn ad-btn-primary">
            <Save size={16} />
            <span>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}</span>
          </button>
        </div>
      </div>

      <div className="ad-form-card" style={{ maxWidth: '640px' }}>
        <div className="ad-form-group">
          <label className="ad-form-label">Full Name *</label>
          <div style={{ position: 'relative' }}>
            <UserIcon
              size={17}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ad-text-dim)' }}
            />
            <input
              type="text"
              className="ad-form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="e.g. Prince"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="ad-form-group">
          <label className="ad-form-label">Email Address *</label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={17}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ad-text-dim)' }}
            />
            <input
              type="email"
              className="ad-form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="e.g. colleague@heyprince.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="ad-form-group">
          <label className="ad-form-label">Role & Permissions</label>
          <select
            className="ad-select"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="admin">Administrator (Full Access)</option>
            <option value="editor">Editor (Content Management)</option>
          </select>
          <span className="ad-form-help">
            Administrators can create users and change database configurations.
          </span>
        </div>

        <div className="ad-form-group">
          <label className="ad-form-label">{isEdit ? 'New Password (Leave blank to keep current)' : 'Password *'}</label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={17}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ad-text-dim)' }}
            />
            <input
              type="password"
              className="ad-form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
            />
          </div>
        </div>

        {password && (
          <div className="ad-form-group">
            <label className="ad-form-label">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ad-text-dim)' }}
              />
              <input
                type="password"
                className="ad-form-input"
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
