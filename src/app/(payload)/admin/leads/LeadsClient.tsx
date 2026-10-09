'use client';

import React, { useState } from 'react';
import {
  Mail,
  Search,
  Eye,
  Trash2,
  Calendar,
  Building,
  Phone,
  DollarSign,
  Clock,
  Inbox,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { LeadRecord } from '@/lib/admin-db';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';

interface LeadsClientProps {
  initialLeads: LeadRecord[];
}

const statusOptions = [
  { value: 'NEW', label: 'New Inquiry', color: '#38bdf8' },
  { value: 'CONTACTED', label: 'Contacted', color: '#fbbf24' },
  { value: 'QUALIFIED', label: 'Qualified', color: '#a78bfa' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent', color: '#ec4899' },
  { value: 'WON', label: 'Won / Client', color: '#00f5a0' },
  { value: 'LOST', label: 'Lost / Closed', color: '#94a3b8' },
];

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<LeadRecord[]>(initialLeads);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Single view drawer / modal
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete modal
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = leads.filter((l) => {
    const matchesSearch =
      search === '' ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(search.toLowerCase())) ||
      l.service.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to update lead status.', 'error');
        setUpdatingStatus(false);
        return;
      }

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as any } : l))
      );
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus as any });
      }
      showToast('Lead status updated.', 'success');
    } catch {
      showToast('Network error while updating status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/leads/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete lead.', 'error');
        setDeleteLoading(false);
        return;
      }

      setLeads((prev) => prev.filter((l) => l.id !== deletingId));
      if (selectedLead && selectedLead.id === deletingId) {
        setSelectedLead(null);
      }
      showToast('Lead deleted successfully.', 'success');
      setDeletingId(null);
    } catch {
      showToast('Network error while deleting lead.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find((s) => s.value === status) || statusOptions[0];
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 9px',
          borderRadius: '100px',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          background: `${opt.color}15`,
          border: `1px solid ${opt.color}40`,
          color: opt.color,
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: opt.color,
          }}
        />
        <span>{opt.label}</span>
      </span>
    );
  };

  return (
    <div>
      <div className="ad-page-title-row">
        <div>
          <h1 className="ad-page-title">Client Leads & Inquiries</h1>
          <p className="ad-page-desc">
            Inbound project submissions from heyprince.in/contact. Track status and deal progression.
          </p>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card-header">
          <div className="ad-table-filters">
            <div className="ad-search-input">
              <Search size={16} style={{ color: 'var(--ad-text-dim)' }} />
              <input
                type="text"
                placeholder="Search by client, email, company, or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="ad-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Inquiries</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--ad-text-muted)' }}>
            Total <strong>{filtered.length}</strong> inquiries
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Requested Service</th>
                  <th>Budget & Timeline</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const dateStr = lead.created_at
                    ? new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={lead.id}>
                      <td>
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontWeight: 700,
                              color: '#ffffff',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              textAlign: 'left',
                            }}
                          >
                            {lead.name}
                          </button>
                          <div style={{ fontSize: '0.76rem', color: 'var(--ad-text-dim)' }}>
                            {lead.email} {lead.company ? `• ${lead.company}` : ''}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
                          {lead.service}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                          {lead.budget ? `${lead.budget}` : 'Custom Quote'}
                        </div>
                        {lead.timeline && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--ad-text-dim)' }}>
                            {lead.timeline}
                          </div>
                        )}
                      </td>

                      <td>
                        <select
                          className="ad-select"
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                          }}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ fontSize: '0.8rem', color: 'var(--ad-text-muted)' }}>
                        {dateStr}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="ad-btn ad-btn-secondary ad-btn-icon"
                            title="Inspect Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(lead.id)}
                            className="ad-btn ad-btn-danger ad-btn-icon"
                            title="Delete Lead"
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
            <h3 className="ad-empty-title">No client inquiries found</h3>
            <p className="ad-empty-sub">
              Submissions through the website contact form will appear here in real time.
            </p>
          </div>
        )}
      </div>

      {/* Inspect Lead Modal */}
      {selectedLead && (
        <div className="ad-modal-backdrop" onClick={() => setSelectedLead(null)}>
          <div
            className="ad-modal"
            style={{ maxWidth: '620px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                borderBottom: '1px solid var(--ad-border)',
                paddingBottom: '14px',
              }}
            >
              <div>
                <h3 className="ad-modal-title" style={{ margin: '0 0 4px 0' }}>
                  {selectedLead.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusBadge(selectedLead.status)}
                  <span style={{ fontSize: '0.78rem', color: 'var(--ad-text-dim)' }}>
                    Lead ID #{selectedLead.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                style={{ background: 'none', border: 'none', color: 'var(--ad-text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--ad-text-dim)', display: 'block' }}>Email Address</span>
                <a
                  href={`mailto:${selectedLead.email}`}
                  style={{ color: 'var(--ad-primary)', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}
                >
                  {selectedLead.email}
                </a>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--ad-text-dim)', display: 'block' }}>Phone / WhatsApp</span>
                <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.88rem' }}>
                  {selectedLead.phone || 'Not provided'}
                </span>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--ad-text-dim)', display: 'block' }}>Requested Service</span>
                <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.88rem' }}>
                  {selectedLead.service}
                </span>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--ad-text-dim)', display: 'block' }}>Estimated Budget</span>
                <span style={{ color: 'var(--ad-success)', fontWeight: 700, fontSize: '0.88rem' }}>
                  {selectedLead.budget || 'Custom Quote'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: '8px' }}>
                Client Project Message
              </span>
              <p
                style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.85)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--ad-border)',
                  whiteSpace: 'pre-line',
                  margin: 0,
                }}
              >
                {selectedLead.message}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--ad-text-dim)' }}>Change Status:</span>
                <select
                  className="ad-select"
                  value={selectedLead.status}
                  onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                  disabled={updatingStatus}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`mailto:${selectedLead.email}?subject=Regarding Your Project Inquiry with Prince`}
                  className="ad-btn ad-btn-primary ad-btn-sm"
                >
                  <Mail size={14} />
                  <span>Reply via Email</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="ad-btn ad-btn-secondary ad-btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Client Inquiry"
        message="Are you sure you want to delete this lead record? This action cannot be undone."
        confirmLabel="Yes, Delete Lead"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteLoading}
      />
    </div>
  );
}
