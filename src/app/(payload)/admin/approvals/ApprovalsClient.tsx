'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Eye,
  Sliders,
  Check,
  Share2,
  ExternalLink,
  Loader2,
  Globe,
  Bot,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/admin/Toast';
import {
  MobileDraftApprovalModal,
  ModalDraftItem,
} from '@/components/admin/MobileDraftApprovalModal';

interface ApprovalItem extends ModalDraftItem {
  numericId?: number;
  status: string;
  createdAt: string;
}

export default function ApprovalsClient() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [selectedItemForModal, setSelectedItemForModal] = useState<ApprovalItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'news' | 'chief'>('all');
  const [quickPublishingId, setQuickPublishingId] = useState<string | number | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approvals');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        showToast(data.error || 'Failed to load approvals queue', 'error');
      }
    } catch {
      showToast('Network error loading approvals queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'news') return item.sourceType === 'news';
    if (filterType === 'chief') return item.sourceType === 'chief';
    return true;
  });

  const handleQuickPublish = async (item: ApprovalItem) => {
    setQuickPublishingId(item.id);
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          sourceType: item.sourceType,
          action: 'publish',
          publishToLinkedIn: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Article published live to HeyPrince.in!', 'success');
        fetchApprovals();
      } else {
        showToast(data.error || 'Publish failed', 'error');
      }
    } catch {
      showToast('Network error while publishing', 'error');
    } finally {
      setQuickPublishingId(null);
    }
  };

  return (
    <div className="hpa-content">
      {/* Mobile-Friendly Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: items.length > 0 ? '#ff4757' : '#00ff88',
                boxShadow: items.length > 0 ? '0 0 10px #ff4757' : '0 0 10px #00ff88',
              }}
            />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              AI Approvals & Publishing
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--hpa-text-dim)' }}>
            Review scheduled blogs, preview articles, customize with JARVIS on your phone, and publish live.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="hpa-btn hpa-btn-secondary"
          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} className={loading ? 'hpa-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => setFilterType('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: 'none',
            background: filterType === 'all' ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderBottom: filterType === 'all' ? '2px solid #ff4757' : '2px solid transparent',
            color: filterType === 'all' ? '#ffffff' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          All Pending ({items.length})
        </button>

        <button
          onClick={() => setFilterType('news')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: 'none',
            background: filterType === 'news' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderBottom: filterType === 'news' ? '2px solid #38bdf8' : '2px solid transparent',
            color: filterType === 'news' ? '#38bdf8' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Scheduled AI Blogs ({items.filter((i) => i.sourceType === 'news').length})
        </button>

        <button
          onClick={() => setFilterType('chief')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: 'none',
            background: filterType === 'chief' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderBottom: filterType === 'chief' ? '2px solid #34d399' : '2px solid transparent',
            color: filterType === 'chief' ? '#34d399' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Chief of Staff Drafts ({items.filter((i) => i.sourceType === 'chief').length})
        </button>
      </div>

      {/* Main Content List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <Loader2 size={32} className="hpa-spin" style={{ margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading pending approvals...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="hpa-card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'rgba(19, 20, 31, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <CheckCircle2 size={46} color="#00ff88" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0 0 6px 0', fontWeight: 700 }}>
            Approval Queue is Clear
          </h2>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--hpa-text-dim)',
              maxWidth: '440px',
              margin: '0 auto 20px',
              lineHeight: 1.5,
            }}
          >
            All autonomous draft proposals, blog posts, and site optimizations have been reviewed and published.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Link
              href="/admin/news-automation/"
              className="hpa-btn hpa-btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              <Sparkles size={14} />
              <span>Generate AI News Blog</span>
            </Link>
            <Link
              href="/admin/chief-of-staff/"
              className="hpa-btn hpa-btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              <Bot size={14} />
              <span>AI Chief of Staff</span>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="hpa-card"
              style={{
                padding: '16px',
                background: 'rgba(19, 20, 31, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Card Header: Source badge & Date */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background:
                        item.sourceType === 'news'
                          ? 'rgba(56, 189, 248, 0.15)'
                          : 'rgba(255, 71, 87, 0.15)',
                      color: item.sourceType === 'news' ? '#38bdf8' : '#ff6b81',
                      border:
                        item.sourceType === 'news'
                          ? '1px solid rgba(56, 189, 248, 0.3)'
                          : '1px solid rgba(255, 71, 87, 0.3)',
                    }}
                  >
                    <Sparkles size={10} />
                    <span>{item.sourceType === 'news' ? 'Scheduled Blog' : 'Chief Draft'}</span>
                  </span>

                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {item.readMins || '5 min read'}
                  </span>
                </div>

                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Title & Excerpt */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {item.coverImage && (
                  <div
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      margin: '0 0 6px 0',
                      lineHeight: 1.3,
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedItemForModal(item)}
                  >
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--hpa-text-dim)',
                        lineHeight: 1.4,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.excerpt}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedItemForModal(item)}
                  className="hpa-btn hpa-btn-primary"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
                    borderColor: '#ff4757',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Eye size={14} />
                  <span>Review & Customize Popup</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPublish(item)}
                  disabled={quickPublishingId === item.id}
                  className="hpa-btn hpa-btn-secondary"
                  title="Approve immediately without preview"
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#00ff88',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    background: 'rgba(0, 255, 136, 0.08)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {quickPublishingId === item.id ? (
                    <Loader2 size={13} className="hpa-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  <span>Publish</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Draft Approval & Customization Modal */}
      {selectedItemForModal && (
        <MobileDraftApprovalModal
          draft={selectedItemForModal}
          isOpen={Boolean(selectedItemForModal)}
          onClose={() => setSelectedItemForModal(null)}
          onSuccessPublished={() => {
            fetchApprovals();
          }}
        />
      )}
    </div>
  );
}

