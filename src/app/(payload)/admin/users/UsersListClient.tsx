'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  Shield,
  Inbox,
  Lock,
} from 'lucide-react';
import { AdminUser } from '@/lib/admin-db';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';

interface UsersListClientProps {
  initialUsers: AdminUser[];
  currentAdminId: number;
}

export default function UsersListClient({ initialUsers, currentAdminId }: UsersListClientProps) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const filtered = users
    .filter((u) => {
      return (
        search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return (timeB || b.id) - (timeA || a.id);
    });

  const selectableUsers = filtered.filter((u) => u.id !== currentAdminId);
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.includes(u.id));
  const someSelected = selectableUsers.some((u) => selectedIds.includes(u.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableUsers.map((u) => u.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    if (id === currentAdminId) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete users.', 'error');
        setBulkDeleteLoading(false);
        return;
      }

      setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
      showToast(`Successfully deleted ${selectedIds.length} user account${selectedIds.length > 1 ? 's' : ''}.`, 'success');
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      showToast('Error connecting to server.', 'error');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete user.', 'error');
        setDeleteLoading(false);
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deletingId));
      showToast('User account deleted successfully.', 'success');
      setDeletingId(null);
    } catch {
      showToast('Error connecting to server.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="hpa-page-title-row">
        <div>
          <h1 className="hpa-page-title">Admin User Management</h1>
          <p className="hpa-page-desc">
            Manage authorized platform administrators, credentials, and role permissions.
          </p>
        </div>
        <Link href="/admin/users/new" className="hpa-btn hpa-btn-primary">
          <Plus size={16} />
          <span>Add Admin User</span>
        </Link>
      </div>

      <div className="hpa-card">
        <div className="hpa-card-header">
          <div className="hpa-table-filters">
            <div className="hpa-search-input">
              <Search size={16} style={{ color: 'var(--hpa-text-dim)' }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--hpa-text-muted)' }}>
            Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'account' : 'accounts'}
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
              <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'user' : 'users'} selected
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
          <div className="hpa-table-wrap">
            <table className="hpa-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', accentColor: '#ff3366', width: '16px', height: '16px' }}
                      title="Select All"
                    />
                  </th>
                  <th>User Profile</th>
                  <th>Email</th>
                  <th>System Role</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isCurrent = user.id === currentAdminId;
                  const dateStr = user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'System Seed';

                  return (
                    <tr key={user.id}>
                      <td style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          disabled={isCurrent}
                          checked={selectedIds.includes(user.id)}
                          onChange={() => handleToggleSelect(user.id)}
                          title={isCurrent ? 'Cannot delete your own account' : 'Select user'}
                          style={{
                            cursor: isCurrent ? 'not-allowed' : 'pointer',
                            accentColor: '#ff3366',
                            width: '16px',
                            height: '16px',
                            opacity: isCurrent ? 0.3 : 1,
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--hpa-primary), var(--hpa-accent))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#ffffff',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#ffffff' }}>
                              {user.name} {isCurrent && <span style={{ fontSize: '0.72rem', color: 'var(--hpa-primary)' }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)' }}>
                              ID #{user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.85)' }}>
                          {user.email}
                        </span>
                      </td>

                      <td>
                        <span
                          className="hpa-pill"
                          style={{
                            background: user.role === 'admin' ? 'rgba(255, 51, 102, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                            borderColor: user.role === 'admin' ? 'rgba(255, 51, 102, 0.3)' : 'rgba(56, 189, 248, 0.3)',
                            color: user.role === 'admin' ? 'var(--hpa-primary)' : 'var(--hpa-info)',
                          }}
                        >
                          {user.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                          <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                        </span>
                      </td>

                      <td style={{ fontSize: '0.82rem', color: 'var(--hpa-text-muted)' }}>
                        {dateStr}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="hpa-btn hpa-btn-secondary hpa-btn-icon"
                            title="View User"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="hpa-btn hpa-btn-secondary hpa-btn-icon"
                            title="Edit User"
                          >
                            <Edit2 size={14} />
                          </Link>
                          {!isCurrent && (
                            <button
                              onClick={() => setDeletingId(user.id)}
                              className="hpa-btn hpa-btn-danger hpa-btn-icon"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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
            <h3 className="hpa-empty-title">No users matched your search</h3>
            <p className="hpa-empty-sub">Try searching with a different name or email.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deletingId !== null}
        title="Revoke Admin User Access"
        message="Are you sure you want to permanently delete this user account? Their administrative login permissions will be immediately disabled."
        confirmLabel="Yes, Delete User"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteLoading}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        title="Revoke Access for Selected Users"
        message={`Are you sure you want to permanently delete these ${selectedIds.length} selected admin user accounts? Their administrative login permissions will be immediately revoked.`}
        confirmLabel={bulkDeleteLoading ? 'Revoking Access...' : `Delete ${selectedIds.length} Accounts`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        isLoading={bulkDeleteLoading}
      />
    </div>
  );
}
