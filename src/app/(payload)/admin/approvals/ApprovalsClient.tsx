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
  Bell,
  BellRing,
  Smartphone,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  Briefcase,
  Send,
  Target,
  XCircle,
  Bookmark,
} from 'lucide-react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';
import {
  MobileDraftApprovalModal,
  ModalDraftItem,
} from '@/components/admin/MobileDraftApprovalModal';

interface ApprovalItem extends ModalDraftItem {
  numericId?: number;
  status: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function ApprovalsClient() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [selectedItemForModal, setSelectedItemForModal] = useState<ApprovalItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'news' | 'chief' | 'outreach'>('all');
  const [quickPublishingId, setQuickPublishingId] = useState<string | number | null>(null);
  const [quickSendingId, setQuickSendingId] = useState<string | number | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Array<{ id: string | number; sourceType: 'news' | 'chief' | 'outreach' }>>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Single delete state
  const [deletingItem, setDeletingItem] = useState<ApprovalItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Push Notification States
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Check Push Capability & Existing Subscription
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;

      setIsIosDevice(isIos);
      setIsStandaloneApp(isStandalone);

      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setPushSupported(supported);

      if (supported) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setPushSubscribed(true);
            }
          });
        });
      }
    }
  }, []);

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

  // Deep linking: If URL has ?draftId=..., open modal automatically
  useEffect(() => {
    if (typeof window !== 'undefined' && items.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetDraftId = params.get('draftId');
      if (targetDraftId) {
        const match = items.find((i) => String(i.id) === String(targetDraftId));
        if (match) {
          setSelectedItemForModal(match);
        }
      }
    }
  }, [items]);

  const filteredItems = items
    .filter((item) => {
      if (filterType === 'all') return true;
      if (filterType === 'news') return item.sourceType === 'news';
      if (filterType === 'chief') return item.sourceType === 'chief';
      if (filterType === 'outreach') return item.sourceType === 'outreach';
      return true;
    })
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (timeB || Number(b.id) || 0) - (timeA || Number(a.id) || 0);
    });

  const isItemSelected = (item: ApprovalItem) =>
    selectedIds.some((s) => String(s.id) === String(item.id) && s.sourceType === item.sourceType);

  const allSelected =
    filteredItems.length > 0 && filteredItems.every((item) => isItemSelected(item));
  const someSelected =
    filteredItems.some((item) => isItemSelected(item)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        filteredItems.map((item) => ({ id: item.id, sourceType: item.sourceType as 'news' | 'chief' | 'outreach' }))
      );
    }
  };

  const handleToggleSelect = (item: ApprovalItem) => {
    if (isItemSelected(item)) {
      setSelectedIds((prev) =>
        prev.filter((s) => !(String(s.id) === String(item.id) && s.sourceType === item.sourceType))
      );
    } else {
      setSelectedIds((prev) => [
        ...prev,
        { id: item.id, sourceType: item.sourceType as 'news' | 'chief' | 'outreach' },
      ]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteLoading(true);

    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          items: selectedIds,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete selected drafts.', 'error');
        setBulkDeleteLoading(false);
        return;
      }

      showToast(`Successfully deleted ${selectedIds.length} draft${selectedIds.length > 1 ? 's' : ''}.`, 'success');
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchApprovals();
    } catch {
      showToast('Error deleting selected approval drafts.', 'error');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: deletingItem.id,
          sourceType: deletingItem.sourceType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete draft.', 'error');
        setDeleteLoading(false);
        return;
      }
      showToast('Draft deleted successfully.', 'success');
      setDeletingItem(null);
      fetchApprovals();
    } catch {
      showToast('Error deleting draft.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEnablePush = async () => {
    if (!pushSupported) {
      if (isIosDevice && !isStandaloneApp) {
        setShowIosGuide(true);
        showToast(
          'On iPhone, please tap Safari Share ⎋ -> "Add to Home Screen" first to enable Web Push.',
          'info'
        );
        return;
      }
      showToast('Push notifications are not supported on this browser.', 'error');
      return;
    }

    setEnablingPush(true);
    try {
      // 1. Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 2. Request Notification Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Notification permission was not granted.', 'error');
        setEnablingPush(false);
        return;
      }

      // 3. Fetch VAPID Public Key
      const keyRes = await fetch('/api/admin/push/vapid-public-key');
      const keyData = await keyRes.json();
      if (!keyData.success || !keyData.publicKey) {
        throw new Error('Failed to retrieve VAPID public key');
      }

      // 4. Subscribe with Push Manager
      const convertedVapidKey = urlB64ToUint8Array(keyData.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 5. Send subscription to server
      const saveRes = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      const saveData = await saveRes.json();
      if (saveData.success) {
        setPushSubscribed(true);
        showToast('iPhone Lock Screen Push Notifications activated!', 'success');
      } else {
        showToast(saveData.error || 'Failed to save subscription', 'error');
      }
    } catch (err: any) {
      console.error('[EnablePush] Error:', err);
      showToast(err?.message || 'Error subscribing to push notifications', 'error');
    } finally {
      setEnablingPush(false);
    }
  };

  const handleSendTestPush = async () => {
    setSendingTestPush(true);
    try {
      const res = await fetch('/api/admin/push/test', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Test push notification sent! Check your phone lock screen.', 'success');
      } else {
        showToast(data.error || 'Failed to send test push', 'error');
      }
    } catch {
      showToast('Network error sending test push', 'error');
    } finally {
      setSendingTestPush(false);
    }
  };

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

  const handleQuickSendOutreach = async (item: ApprovalItem) => {
    setQuickSendingId(item.id);
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          sourceType: 'outreach',
          action: 'approve_and_send_outreach',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Client outreach email dispatched successfully!', 'success');
        fetchApprovals();
      } else {
        showToast(data.error || 'Failed to dispatch outreach proposal', 'error');
      }
    } catch {
      showToast('Network error while dispatching outreach proposal', 'error');
    } finally {
      setQuickSendingId(null);
    }
  };

  const handleRejectSingle = async (item: ApprovalItem) => {
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          sourceType: item.sourceType,
          action: 'reject',
          rejectionReason: 'Rejected directly from Approvals Hub',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Item rejected.', 'info');
        fetchApprovals();
      } else {
        showToast(data.error || 'Failed to reject item', 'error');
      }
    } catch {
      showToast('Network error while rejecting item', 'error');
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
          marginBottom: '16px',
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
            Review scheduled blogs, preview articles, customize with JARVIS on your phone, and approve client outreach.
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

      {/* iPhone Push Notification Card */}
      <div
        className="hpa-card"
        style={{
          marginBottom: '20px',
          padding: '14px 16px',
          background: pushSubscribed
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(19, 20, 31, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(19, 20, 31, 0.9) 100%)',
          border: pushSubscribed
            ? '1px solid rgba(16, 185, 129, 0.3)'
            : '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: pushSubscribed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                color: pushSubscribed ? '#34d399' : '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {pushSubscribed ? <BellRing size={18} /> : <Smartphone size={18} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', fontWeight: 700 }}>
                  iPhone Lock Screen Push Notifications
                </h4>
                {pushSubscribed && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                {pushSubscribed
                  ? 'Your iPhone will receive native alerts whenever JARVIS drafts a blog. Tapping it opens this approval screen.'
                  : 'Receive instant native alerts on your iPhone lock screen when new scheduled blogs and drafts are ready.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {pushSubscribed ? (
              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={sendingTestPush}
                className="hpa-btn hpa-btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                {sendingTestPush ? (
                  <Loader2 size={12} className="hpa-spin" />
                ) : (
                  <Bell size={12} />
                )}
                <span>Send Test Alert</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={enablingPush}
                className="hpa-btn hpa-btn-primary"
                style={{
                  fontSize: '0.8rem',
                  padding: '7px 14px',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  borderColor: '#38bdf8',
                  color: '#000000',
                  fontWeight: 700,
                }}
              >
                {enablingPush ? (
                  <Loader2 size={13} className="hpa-spin" />
                ) : (
                  <BellRing size={13} />
                )}
                <span>Enable iPhone Push</span>
              </button>
            )}

            {isIosDevice && !isStandaloneApp && (
              <button
                type="button"
                onClick={() => setShowIosGuide(!showIosGuide)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="iPhone Setup Guide"
              >
                {showIosGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* iPhone Safari PWA Instructions Collapsible */}
        {showIosGuide && (
          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.8rem',
              color: '#cbd5e1',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
              📲 Quick 10-Second Setup for iPhone (iOS 16.4+):
            </div>
            <ol style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
              <li>
                In <strong>Safari</strong> on your iPhone, tap the <strong>Share button (⎋)</strong> at the bottom of the screen.
              </li>
              <li>
                Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.
              </li>
              <li>
                Open the newly created <strong>HeyPrince</strong> icon on your iPhone Home Screen.
              </li>
              <li>
                Tap <strong>&quot;Enable iPhone Push&quot;</strong> and tap <strong>Allow</strong> when iOS asks for notification permission!
              </li>
            </ol>
          </div>
        )}
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
          Thought Leadership & Pages ({items.filter((i) => i.sourceType === 'chief').length})
        </button>

        <button
          onClick={() => setFilterType('outreach')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: 'none',
            background: filterType === 'outreach' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderBottom: filterType === 'outreach' ? '2px solid #c084fc' : '2px solid transparent',
            color: filterType === 'outreach' ? '#c084fc' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Lead Proposals & Outreach ({items.filter((i) => i.sourceType === 'outreach').length})
        </button>
      </div>

      {/* Select All & Summary Bar */}
      {filteredItems.length > 0 && !loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '4px 2px',
          }}
        >
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
            <span>Select All ({filteredItems.length})</span>
          </label>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Latest pending items on top
          </span>
        </div>
      )}

      {/* Bulk Action Floating Bar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'rgba(255, 51, 102, 0.08)',
            border: '1px solid rgba(255, 51, 102, 0.25)',
            borderRadius: '10px',
            marginBottom: '16px',
            color: '#ffffff',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'draft' : 'drafts'} selected
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
          {filteredItems.map((item) => {
            const isOutreach = item.sourceType === 'outreach';

            return (
              <div
                key={item.id}
                className="hpa-card"
                style={{
                  padding: '16px',
                  background: isOutreach
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(19, 20, 31, 0.9) 100%)'
                    : 'rgba(19, 20, 31, 0.8)',
                  border: isOutreach
                    ? '1px solid rgba(168, 85, 247, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
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
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="checkbox"
                      checked={isItemSelected(item)}
                      onChange={() => handleToggleSelect(item)}
                      style={{ cursor: 'pointer', accentColor: isOutreach ? '#c084fc' : '#ff3366', width: '16px', height: '16px' }}
                      title="Select Item"
                    />
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
                        background: isOutreach
                          ? 'rgba(168, 85, 247, 0.15)'
                          : item.sourceType === 'news'
                          ? 'rgba(56, 189, 248, 0.15)'
                          : 'rgba(255, 71, 87, 0.15)',
                        color: isOutreach
                          ? '#c084fc'
                          : item.sourceType === 'news'
                          ? '#38bdf8'
                          : '#ff6b81',
                        border: isOutreach
                          ? '1px solid rgba(168, 85, 247, 0.35)'
                          : item.sourceType === 'news'
                          ? '1px solid rgba(56, 189, 248, 0.3)'
                          : '1px solid rgba(255, 71, 87, 0.3)',
                      }}
                    >
                      {isOutreach ? <Briefcase size={11} /> : <Sparkles size={10} />}
                      <span>
                        {isOutreach
                          ? 'Client Outreach Proposal'
                          : item.sourceType === 'news'
                          ? 'Scheduled Blog'
                          : 'Chief Draft'}
                      </span>
                    </span>

                    {isOutreach && (item.metadata?.fit_score || item.metadata?.confidence) && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <Target size={11} />
                        <span>Fit: {item.metadata?.fit_score || 85}/100</span>
                      </span>
                    )}

                    {!isOutreach && (
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {item.readMins || '5 min read'}
                      </span>
                    )}
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

                {/* Card Body: Distinct Outreach vs Blog Presentation */}
                {isOutreach ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          margin: 0,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedItemForModal(item)}
                      >
                        {item.metadata?.company_name || item.title}
                      </h3>

                      {(item.metadata?.domain || item.targetUrl) && (
                        <a
                          href={`https://${(item.metadata?.domain || item.targetUrl || '').replace(/^https?:\/\//, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            color: '#38bdf8',
                            textDecoration: 'none',
                          }}
                        >
                          <Globe size={12} />
                          <span>{item.metadata?.domain || item.targetUrl}</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.78rem', color: '#94a3b8' }}>
                      {item.metadata?.contact_email && (
                        <div>
                          <strong style={{ color: '#cbd5e1' }}>Contact:</strong> {item.metadata.contact_email}
                        </div>
                      )}
                      {item.metadata?.recommended_service && (
                        <div>
                          <strong style={{ color: '#cbd5e1' }}>Recommended:</strong> {item.metadata.recommended_service}
                        </div>
                      )}
                    </div>

                    {/* Opportunity Evidence */}
                    {Array.isArray(item.metadata?.audit_evidence) && item.metadata.audit_evidence.length > 0 && (
                      <div
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Key Opportunity Findings:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                          {item.metadata.audit_evidence.slice(0, 2).map((ev: string, idx: number) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>
                              {ev}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Proposed Pitch snippet */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', lineHeight: 1.4 }}>
                      <strong style={{ color: '#ffffff' }}>Subject:</strong> {item.title}
                      {item.excerpt && (
                        <p style={{ margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
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
                )}

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    flexWrap: 'wrap',
                  }}
                >
                  {isOutreach ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedItemForModal(item)}
                        className="hpa-btn hpa-btn-primary"
                        style={{
                          flex: 1,
                          minWidth: '180px',
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                          borderColor: '#a855f7',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Eye size={14} />
                        <span>Review Lead & Edit Pitch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickSendOutreach(item)}
                        disabled={quickSendingId === item.id}
                        className="hpa-btn hpa-btn-secondary"
                        title="Approve and send outreach email to client"
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.8rem',
                          color: '#00ff88',
                          border: '1px solid rgba(0, 255, 136, 0.3)',
                          background: 'rgba(0, 255, 136, 0.08)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {quickSendingId === item.id ? (
                          <Loader2 size={13} className="hpa-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        <span>Approve & Send</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectSingle(item)}
                        className="hpa-btn hpa-btn-secondary"
                        title="Reject proposal"
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          color: '#f87171',
                          borderColor: 'rgba(248, 113, 113, 0.3)',
                        }}
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="hpa-btn hpa-btn-danger"
                        title="Delete proposal"
                        style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <>
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

                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="hpa-btn hpa-btn-danger"
                        title="Delete Draft"
                        style={{
                          padding: '8px 10px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Draft Approval & Customization Modal */}
      {selectedItemForModal && (
        <MobileDraftApprovalModal
          draft={selectedItemForModal}
          isOpen={Boolean(selectedItemForModal)}
          onClose={() => {
            setSelectedItemForModal(null);
            // Clear URL draftId parameter if set
            if (typeof window !== 'undefined' && window.history.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('draftId');
              window.history.replaceState({}, '', url.toString());
            }
          }}
          onSuccessPublished={() => {
            fetchApprovals();
          }}
        />
      )}

      {/* Single Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingItem !== null}
        title="Delete Draft"
        message="Are you sure you want to delete and reject this draft proposal? This action cannot be undone."
        confirmLabel="Yes, Delete Draft"
        onConfirm={handleDeleteSingle}
        onCancel={() => setDeletingItem(null)}
        isLoading={deleteLoading}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        title="Delete Selected Drafts"
        message={`Are you sure you want to permanently delete these ${selectedIds.length} selected draft proposals? This action cannot be undone.`}
        confirmLabel={bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedIds.length} Drafts`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        isLoading={bulkDeleteLoading}
      />
    </div>
  );
}
