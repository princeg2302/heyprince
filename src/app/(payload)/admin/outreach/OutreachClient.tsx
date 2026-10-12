'use client';

import React, { useState } from 'react';
import {
  Globe,
  Search,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Mail,
  Send,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  Plus,
  Sparkles,
  Ban,
  Clock,
  Layers,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/components/admin/Toast';
import {
  BusinessEntity,
  DiscoveryJobEntity,
  OutreachSettingsEntity,
  BusinessStatus,
} from '@/lib/outreach/types';

interface OutreachClientProps {
  initialAnalytics: {
    totalBusinesses: number;
    totalAudited: number;
    totalContacts: number;
    validContacts: number;
    queuedEmails: number;
    sentEmails: number;
    deliveredEmails: number;
    bouncedEmails: number;
    suppressedEmails: number;
    killSwitchActive: boolean;
    testModeActive: boolean;
  };
  initialSettings: OutreachSettingsEntity;
  initialBusinesses: BusinessEntity[];
  totalBusinesses: number;
  initialJobs: DiscoveryJobEntity[];
  queuedCount: number;
  initialContacts?: any[];
  initialMessages?: any[];
  adminEmail: string;
}

export default function OutreachClient({
  initialAnalytics,
  initialSettings,
  initialBusinesses,
  totalBusinesses,
  initialJobs,
  queuedCount,
  initialContacts = [],
  initialMessages = [],
}: OutreachClientProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'telemetry' | 'discovery' | 'leads' | 'contacts' | 'queue' | 'compliance' | 'settings'
  >('telemetry');

  const [settings, setSettings] = useState<OutreachSettingsEntity>(initialSettings);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [businesses, setBusinesses] = useState<BusinessEntity[]>(initialBusinesses);
  const [jobs, setJobs] = useState<DiscoveryJobEntity[]>(initialJobs);
  const [contacts, setContacts] = useState<any[]>(initialContacts);
  const [messages, setMessages] = useState<any[]>(initialMessages);

  // Discovery Form State
  const [discoverCountry, setDiscoverCountry] = useState('US');
  const [discoverCity, setDiscoverCity] = useState('Austin');
  const [discoverCategory, setDiscoverCategory] = useState('Restaurants & Cafes');
  const [discoverProvider, setDiscoverProvider] = useState<'openstreetmap' | 'mock'>('openstreetmap');
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Business Action State
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessEntity | null>(null);
  const [businessDetail, setBusinessDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Queue Processing State
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueBatchSize, setQueueBatchSize] = useState(5);
  const [queuedEmailCount, setQueuedEmailCount] = useState(queuedCount);
  const [isQueueingEmail, setIsQueueingEmail] = useState(false);

  // Contact Form State
  const [newContactEmail, setNewContactEmail] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Suppression State
  const [suppressEmail, setSuppressEmail] = useState('');
  const [suppressReason, setSuppressReason] = useState('MANUAL_BLOCK');
  const [isAddingSuppression, setIsAddingSuppression] = useState(false);

  // CRM & Pipeline State
  const [pipelineFilter, setPipelineFilter] = useState('ALL');
  const [crmNotesInput, setCrmNotesInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'CLOSED_WON':
        return {
          bg: 'rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.4)',
          label: 'Won 🎉',
          longLabel: 'Closed / Won 🎉',
        };
      case 'CLOSED_LOST':
        return {
          bg: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.4)',
          label: 'Lost ❌',
          longLabel: 'Closed / Lost ❌',
        };
      case 'IN_DISCUSSION':
        return {
          bg: 'rgba(245, 158, 11, 0.2)',
          color: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.4)',
          label: 'Talking 💬',
          longLabel: 'In Discussion 💬',
        };
      case 'CONTACTED':
        return {
          bg: 'rgba(56, 189, 248, 0.2)',
          color: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.4)',
          label: 'Contacted ✉️',
          longLabel: 'Contacted ✉️',
        };
      case 'ENRICHED':
        return {
          bg: 'rgba(168, 85, 247, 0.2)',
          color: '#c084fc',
          border: 'rgba(168, 85, 247, 0.4)',
          label: 'Enriched ⚡',
          longLabel: 'AI Enriched ⚡',
        };
      case 'AUDITED':
        return {
          bg: 'rgba(99, 102, 241, 0.2)',
          color: '#818cf8',
          border: 'rgba(99, 102, 241, 0.4)',
          label: 'Audited 🔍',
          longLabel: 'Audited 🔍',
        };
      case 'DISQUALIFIED':
        return {
          bg: 'rgba(107, 114, 128, 0.2)',
          color: '#9ca3af',
          border: 'rgba(107, 114, 128, 0.4)',
          label: 'Disqualified 🚫',
          longLabel: 'Disqualified 🚫',
        };
      case 'DISCOVERED':
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#cbd5e1',
          border: 'rgba(148, 163, 184, 0.3)',
          label: 'Fresh 📍',
          longLabel: 'Discovered 📍',
        };
    }
  };

  // Toggle Kill Switch
  const toggleKillSwitch = async () => {
    try {
      const nextState = !settings.global_kill_switch;
      const res = await fetch('/api/admin/outreach/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ global_kill_switch: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setAnalytics((prev) => ({ ...prev, killSwitchActive: nextState }));
        showToast(
          nextState
            ? '🛑 Emergency Kill Switch ENGAGED: Outbound email paused.'
            : '✅ Emergency Kill Switch DISENGAGED: Sending permitted.',
          nextState ? 'error' : 'success'
        );
      } else {
        showToast(data.error || 'Failed to update kill switch', 'error');
      }
    } catch {
      showToast('Network error while toggling kill switch', 'error');
    }
  };

  // Toggle Test Mode
  const toggleTestMode = async () => {
    try {
      const nextState = !settings.test_mode;
      const res = await fetch('/api/admin/outreach/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_mode: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setAnalytics((prev) => ({ ...prev, testModeActive: nextState }));
        showToast(
          nextState ? 'Test mode activated (Simulated sends only)' : 'Production mode activated',
          'info'
        );
      }
    } catch {
      showToast('Error updating test mode', 'error');
    }
  };

  // Execute Discovery Scan
  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiscovering(true);
    try {
      const res = await fetch('/api/admin/outreach/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: discoverProvider,
          countryCode: discoverCountry,
          city: discoverCity,
          category: discoverCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        // Refresh businesses and jobs
        const bRes = await fetch('/api/admin/outreach/businesses?limit=25');
        const bData = await bRes.json();
        if (bData.items) setBusinesses(bData.items);

        const jRes = await fetch('/api/admin/outreach/discovery');
        const jData = await jRes.json();
        if (jData.jobs) setJobs(jData.jobs);
      } else {
        showToast(data.error || 'Discovery scan failed', 'error');
      }
    } catch {
      showToast('Error executing discovery job', 'error');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Open Business Detail
  const handleSelectBusiness = async (b: BusinessEntity) => {
    setSelectedBusiness(b);
    setCrmNotesInput((b.metadata as any)?.crm_notes || '');
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/outreach/businesses/${b.id}`);
      const data = await res.json();
      if (data.success) {
        setBusinessDetail(data);
        if (data.business?.metadata?.crm_notes !== undefined) {
          setCrmNotesInput(data.business.metadata.crm_notes || '');
        }
      }
    } catch {
      showToast('Error fetching business intelligence record', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Update Business Status & CRM Notes
  const handleUpdateBusinessStatus = async (
    businessId: string,
    newStatus: BusinessStatus,
    notes?: string
  ) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/outreach/businesses/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          crmNotes: notes !== undefined ? notes : crmNotesInput,
        }),
      });
      const data = await res.json();
      if (data.success && data.business) {
        showToast(`Lead marked as ${newStatus}`, 'success');
        setBusinesses((prev) =>
          prev.map((biz) => (biz.id === businessId ? { ...biz, ...data.business } : biz))
        );
        if (selectedBusiness?.id === businessId) {
          setSelectedBusiness((prev) => (prev ? { ...prev, ...data.business } : null));
        }
      } else {
        showToast(data.error || 'Failed to update lead status', 'error');
      }
    } catch {
      showToast('Network error updating status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Trigger Website Audit
  const handleRunAudit = async (businessId: string) => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/admin/outreach/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('SSRF-safe website audit completed.', 'success');
        // Refresh detail
        if (selectedBusiness) handleSelectBusiness(selectedBusiness);
      } else {
        showToast(data.error || 'Audit failed', 'error');
      }
    } catch {
      showToast('Network error during website audit', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  // Trigger AI Intelligence & Personalization Draft
  const handleGenerateAi = async (businessId: string) => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/admin/outreach/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('AI intelligence opportunity & draft generated.', 'success');
        if (selectedBusiness) handleSelectBusiness(selectedBusiness);
      } else {
        showToast(data.error || 'AI generation failed', 'error');
      }
    } catch {
      showToast('Network error during AI analysis', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Add & Verify Contact Email
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !newContactEmail) return;
    setIsAddingContact(true);
    try {
      const res = await fetch(`/api/admin/outreach/businesses/${selectedBusiness.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newContactEmail }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setNewContactEmail('');
        setAnalytics((prev) => ({
          ...prev,
          totalContacts: prev.totalContacts + 1,
          validContacts: data.contact?.verification_status === 'VALID' ? prev.validContacts + 1 : prev.validContacts,
        }));
        handleSelectBusiness(selectedBusiness);
      } else {
        showToast(data.error || 'Failed to add contact', 'error');
      }
    } catch {
      showToast('Error adding contact', 'error');
    } finally {
      setIsAddingContact(false);
    }
  };

  // Enqueue Approved AI Draft for Dispatch
  const handleEnqueueDraft = async () => {
    if (!selectedBusiness || !businessDetail?.aiAnalysis) return;
    const contact = businessDetail.contacts?.[0];
    if (!contact) {
      showToast('Please add or discover a verified contact email first', 'error');
      return;
    }

    setIsQueueingEmail(true);
    try {
      const res = await fetch('/api/admin/outreach/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enqueue_draft',
          businessId: selectedBusiness.id,
          contactId: contact.id,
          aiAnalysisId: businessDetail.aiAnalysis.id,
          subject: businessDetail.aiAnalysis.suggested_subject,
          bodyText: businessDetail.aiAnalysis.personalized_draft,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Email draft approved and added to outbound queue!', 'success');
        setQueuedEmailCount((prev) => prev + 1);
        setAnalytics((prev) => ({ ...prev, queuedEmails: prev.queuedEmails + 1 }));
      } else {
        showToast(data.error || 'Failed to queue email draft', 'error');
      }
    } catch {
      showToast('Network error enqueuing draft', 'error');
    } finally {
      setIsQueueingEmail(false);
    }
  };

  // Refresh Queue
  const refreshQueueMessages = async () => {
    try {
      const res = await fetch('/api/admin/outreach/queue');
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {}
  };

  // Process Outbound Queue Batch (Supports standard due check or forceNow override)
  const handleProcessQueueBatch = async (forceNow = false) => {
    setIsProcessingQueue(true);
    try {
      const res = await fetch('/api/admin/outreach/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_batch', batchSize: queueBatchSize, forceNow }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, data.outcome?.killSwitchActive ? 'info' : 'success');
        refreshQueueMessages();
        if (data.outcome && !data.outcome.killSwitchActive) {
          setQueuedEmailCount((prev) => Math.max(0, prev - data.outcome.sent));
          setAnalytics((prev) => ({
            ...prev,
            queuedEmails: Math.max(0, prev.queuedEmails - data.outcome.sent),
            sentEmails: prev.sentEmails + data.outcome.sent,
          }));
        }
      } else {
        showToast(data.error || 'Queue processing failed', 'error');
      }
    } catch {
      showToast('Error processing outbound queue', 'error');
    } finally {
      setIsProcessingQueue(false);
    }
  };

  // Send single queued email immediately
  const handleSendSingle = async (messageId: string) => {
    try {
      const res = await fetch('/api/admin/outreach/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_single', messageId, forceNow: true }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        refreshQueueMessages();
        setQueuedEmailCount((prev) => Math.max(0, prev - 1));
        setAnalytics((prev) => ({
          ...prev,
          queuedEmails: Math.max(0, prev.queuedEmails - 1),
          sentEmails: prev.sentEmails + 1,
        }));
      } else {
        showToast(data.error || data.message || 'Send failed', 'error');
      }
    } catch {
      showToast('Error sending message', 'error');
    }
  };

  // Cancel queued message
  const handleCancelMessage = async (messageId: string) => {
    try {
      const res = await fetch('/api/admin/outreach/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_message', messageId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Message cancelled', 'info');
        refreshQueueMessages();
        setQueuedEmailCount((prev) => Math.max(0, prev - 1));
        setAnalytics((prev) => ({ ...prev, queuedEmails: Math.max(0, prev.queuedEmails - 1) }));
      }
    } catch {
      showToast('Error cancelling message', 'error');
    }
  };

  // Add Manual Suppression
  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppressEmail) return;
    setIsAddingSuppression(true);
    try {
      const res = await fetch('/api/admin/outreach/suppressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: suppressEmail, reason: suppressReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Suppression added for ${suppressEmail}`, 'success');
        setSuppressEmail('');
        setAnalytics((prev) => ({ ...prev, suppressedEmails: prev.suppressedEmails + 1 }));
      } else {
        showToast(data.error || 'Failed to add suppression', 'error');
      }
    } catch {
      showToast('Network error adding suppression', 'error');
    } finally {
      setIsAddingSuppression(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner: Emergency Kill Switch & Safety Bar */}
      <div
        style={{
          background: settings.global_kill_switch
            ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))'
            : 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
          border: `1px solid ${settings.global_kill_switch ? '#ef4444' : '#10b981'}`,
          borderRadius: '12px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {settings.global_kill_switch ? (
            <ShieldAlert size={28} color="#ef4444" />
          ) : (
            <ShieldCheck size={28} color="#10b981" />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                {settings.global_kill_switch
                  ? 'EMERGENCY KILL SWITCH: ACTIVE (SENDING PAUSED)'
                  : 'OUTBOUND DISPATCH: ENABLED'}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: settings.test_mode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: settings.test_mode ? '#38bdf8' : '#10b981',
                  border: `1px solid ${settings.test_mode ? '#38bdf8' : '#10b981'}`,
                }}
              >
                {settings.test_mode ? 'TEST MODE (SIMULATED)' : 'LIVE PRODUCTION'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
              {settings.global_kill_switch
                ? 'Outbound email sending is globally blocked. No emails will leave this platform under any circumstance.'
                : 'Emails in queue will be processed according to strict compliance gates, domain throttling, and daily caps.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={toggleTestMode}
            style={{
              background: '#161622',
              border: '1px solid #2d2d42',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Switch to {settings.test_mode ? 'Live Provider' : 'Test Mode'}
          </button>
          <button
            onClick={toggleKillSwitch}
            style={{
              background: settings.global_kill_switch ? '#10b981' : '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {settings.global_kill_switch ? <Play size={14} /> : <Pause size={14} />}
            {settings.global_kill_switch ? 'Deactivate Kill Switch' : 'Emergency Stop'}
          </button>
        </div>
      </div>

      {/* Main Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            Lead Intelligence & Outreach Command Center
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
            Multi-country business discovery, SSRF-safe website auditing, contact verification, and compliant outreach engine.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('discovery')}
            style={{
              background: 'linear-gradient(135deg, #ff3366, #e11d48)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> New Discovery Scan
          </button>
        </div>
      </div>

      {/* Styles for scrollbar suppression and responsive layouts */}
      <style>{`
        .hpa-outreach-tabs-bar::-webkit-scrollbar {
          display: none !important;
          height: 0px !important;
        }
        .hpa-outreach-tabs-bar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        @media (max-width: 1200px) {
          .hpa-leads-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Navigation Sub-Tabs */}
      <div
        className="hpa-outreach-tabs-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #1c1c2b',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {[
          { key: 'telemetry', label: 'Overview & Metrics', icon: Layers },
          { key: 'discovery', label: 'Discovery Scanner', icon: Globe },
          { key: 'leads', label: `Businesses (${totalBusinesses})`, icon: Search },
          { key: 'contacts', label: `Contacts (${contacts.length})`, icon: UserCheck },
          { key: 'queue', label: `Outbox Queue (${queuedEmailCount})`, icon: Mail },
          { key: 'compliance', label: 'Compliance & Suppression', icon: ShieldCheck },
          { key: 'settings', label: 'Safety Settings', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(255, 51, 102, 0.45)' : '1px solid #1c1c2b',
                background: isActive ? 'rgba(255, 51, 102, 0.12)' : '#0e0e16',
                color: isActive ? '#ffffff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} color={isActive ? '#ff3366' : '#9ca3af'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div>
          {/* Key Metric Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            {[
              { label: 'Discovered Businesses', value: analytics.totalBusinesses, sub: 'Total in PostgreSQL', color: '#ff3366' },
              { label: 'Websites Audited', value: analytics.totalAudited, sub: 'SSRF-verified signals', color: '#00f5a0' },
              { label: 'Discovered Contacts', value: analytics.totalContacts, sub: `${analytics.validContacts} validated MX`, color: '#8b5cf6' },
              { label: 'Queued Emails', value: analytics.queuedEmails, sub: 'Awaiting eligibility dispatch', color: '#f59e0b' },
              { label: 'Dispatched Emails', value: analytics.sentEmails, sub: `${analytics.deliveredEmails} delivered`, color: '#38bdf8' },
              { label: 'Suppression Registry', value: analytics.suppressedEmails, sub: 'Opt-outs & hard bounces', color: '#ec4899' },
            ].map((metric, i) => (
              <div
                key={i}
                style={{
                  background: '#0e0e16',
                  border: '1px solid #1c1c2b',
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: metric.color,
                  }}
                />
                <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>{metric.label}</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '8px 0 4px 0' }}>
                  {metric.value}
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>{metric.sub}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions & Recent Jobs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Recent Discovery Jobs
              </h3>
              {jobs.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '13px' }}>No discovery jobs recorded yet. Run a scan from the Discovery Scanner tab.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {jobs.slice(0, 5).map((j) => (
                    <div
                      key={j.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#07070d',
                        border: '1px solid #161622',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '13px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>{j.city || j.country_code}</span>
                        <span style={{ color: '#9ca3af', marginLeft: '6px' }}>• {j.category}</span>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Provider: {j.provider}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: j.status === 'COMPLETED' ? 'rgba(0, 245, 160, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: j.status === 'COMPLETED' ? '#00f5a0' : '#ef4444',
                          }}
                        >
                          {j.status}
                        </span>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          +{j.total_inserted} new
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outbound Dispatch Queue Quick Box */}
            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Queue Dispatch Control
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.6 }}>
                There are currently <strong>{queuedEmailCount}</strong> emails queued. When processed, each email undergoes live pre-send suppression checks, domain rate-limiting, and jurisdiction eligibility verification.
              </p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={queueBatchSize}
                  onChange={(e) => setQueueBatchSize(Number(e.target.value))}
                  style={{
                    background: '#07070d',
                    border: '1px solid #2d2d42',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  <option value={1}>Batch: 1 email</option>
                  <option value={5}>Batch: 5 emails</option>
                  <option value={10}>Batch: 10 emails</option>
                </select>
                <button
                  disabled={isProcessingQueue || queuedEmailCount === 0}
                  onClick={() => handleProcessQueueBatch(false)}
                  style={{
                    background: queuedEmailCount > 0 ? '#ff3366' : '#2d2d42',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: queuedCount > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Send size={15} />
                  {isProcessingQueue ? 'Processing...' : 'Dispatch Queue Batch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCOVERY SCANNER */}
      {activeTab === 'discovery' && (
        <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
            Targeted Global Business Discovery
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 24px 0' }}>
            Queries public OpenStreetMap geographic business clusters or mock fixtures to discover businesses, websites, and verified contact points.
          </p>

          <form onSubmit={handleRunDiscovery} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                Target Country
              </label>
              <select
                value={discoverCountry}
                onChange={(e) => setDiscoverCountry(e.target.value)}
                style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="IN">India (IN)</option>
                <option value="CA">Canada (CA)</option>
                <option value="AU">Australia (AU)</option>
                <option value="DE">Germany (DE)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                City / Metropolitan Area
              </label>
              <input
                type="text"
                value={discoverCity}
                onChange={(e) => setDiscoverCity(e.target.value)}
                required
                style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                Business Category
              </label>
              <select
                value={discoverCategory}
                onChange={(e) => setDiscoverCategory(e.target.value)}
                style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="Restaurants & Cafes">Restaurants & Cafes</option>
                <option value="Boutique Hotels">Boutique Hotels & Lodging</option>
                <option value="Digital Agencies">Digital & Tech Agencies</option>
                <option value="Healthcare & Dental">Clinics & Healthcare</option>
                <option value="Retail & Specialty Stores">Retail & Specialty Stores</option>
                <option value="Automotive Services">Local Automotive Services</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                Discovery Provider
              </label>
              <select
                value={discoverProvider}
                onChange={(e) => setDiscoverProvider(e.target.value as any)}
                style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="openstreetmap">OpenStreetMap Overpass (Live)</option>
                <option value="mock">Deterministic Test Mock</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
              <button
                type="submit"
                disabled={isDiscovering}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: isDiscovering ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Globe size={16} />
                {isDiscovering ? 'Scanning & Deduplicating...' : 'Launch Discovery Scan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: BUSINESSES LEADS TABLE */}
      {activeTab === 'leads' && (
        <div
          className="hpa-leads-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: selectedBusiness ? 'minmax(0, 1fr) 420px' : 'minmax(0, 1fr)',
            gap: '20px',
            minWidth: 0,
            width: '100%',
          }}
        >
          <div
            style={{
              background: '#0e0e16',
              border: '1px solid #1c1c2b',
              borderRadius: '12px',
              padding: '20px',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Discovered Business Records ({businesses.length})
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>
                  Track contacts and lead stages from discovery through closed deals.
                </p>
              </div>

              {/* Status / Pipeline Filters */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { id: 'ALL', label: `All (${businesses.length})` },
                  { id: 'DISCOVERED', label: `Fresh (${businesses.filter((b) => b.status === 'DISCOVERED').length})` },
                  { id: 'CONTACTED', label: `Contacted (${businesses.filter((b) => b.status === 'CONTACTED').length})` },
                  { id: 'IN_DISCUSSION', label: `Talking (${businesses.filter((b) => b.status === 'IN_DISCUSSION').length})` },
                  { id: 'CLOSED_WON', label: `Won 🎉 (${businesses.filter((b) => b.status === 'CLOSED_WON').length})` },
                  { id: 'CLOSED_LOST', label: `Lost (${businesses.filter((b) => b.status === 'CLOSED_LOST').length})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setPipelineFilter(pill.id)}
                    style={{
                      background: pipelineFilter === pill.id ? 'rgba(255, 51, 102, 0.15)' : '#161622',
                      border: pipelineFilter === pill.id ? '1px solid #ff3366' : '1px solid #2d2d42',
                      color: pipelineFilter === pill.id ? '#ff3366' : '#d1d5db',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {businesses.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>No businesses in database yet. Run a discovery scan above!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1c1c2b', color: '#9ca3af' }}>
                      <th style={{ padding: '10px' }}>Business</th>
                      <th style={{ padding: '10px' }}>Location</th>
                      <th style={{ padding: '10px' }}>Category</th>
                      <th style={{ padding: '10px' }}>Website</th>
                      <th style={{ padding: '10px' }}>Lead Stage</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses
                      .filter((b) => pipelineFilter === 'ALL' || b.status === pipelineFilter)
                      .map((b) => {
                        const badge = getStatusBadgeStyle(b.status);
                        return (
                          <tr
                            key={b.id}
                            style={{
                              borderBottom: '1px solid #161622',
                              background: selectedBusiness?.id === b.id ? 'rgba(255, 51, 102, 0.08)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '12px 10px', fontWeight: 600, color: '#ffffff' }}>{b.name}</td>
                            <td style={{ padding: '12px 10px', color: '#9ca3af' }}>{b.city || b.country_code}</td>
                            <td style={{ padding: '12px 10px', color: '#9ca3af' }}>{b.category}</td>
                            <td style={{ padding: '12px 10px' }}>
                              {b.website_url ? (
                                <a
                                  href={b.website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {b.domain || 'Visit'} <ExternalLink size={12} />
                                </a>
                              ) : (
                                <span style={{ color: '#6b7280' }}>None</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '8px',
                                  background: badge.bg,
                                  color: badge.color,
                                  border: `1px solid ${badge.border}`,
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                }}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleSelectBusiness(b)}
                                  style={{
                                    background: selectedBusiness?.id === b.id ? '#ff3366' : '#161622',
                                    border: selectedBusiness?.id === b.id ? '1px solid #ff3366' : '1px solid #2d2d42',
                                    color: '#ffffff',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Inspect & CRM
                                </button>
                                {b.status !== 'CLOSED_WON' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateBusinessStatus(b.id, 'CLOSED_WON');
                                    }}
                                    title="Mark Deal as Won"
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      color: '#10b981',
                                      padding: '6px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Won 🎉
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
            )}
          </div>

          {/* Drawer: Selected Business Detail & AI Analysis */}
          {selectedBusiness && (
            <div
              style={{
                background: '#0e0e16',
                border: '1px solid #1c1c2b',
                borderRadius: '12px',
                padding: '24px',
                maxHeight: '850px',
                overflowY: 'auto',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>{selectedBusiness.name}</h3>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{selectedBusiness.category} • {selectedBusiness.city}</span>
                </div>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px' }}
                >
                  ✕
                </button>
              </div>

              {/* CRM Pipeline & Deal Stage Card */}
              <div
                style={{
                  background: '#161622',
                  border: '1px solid #2d2d42',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 700 }}>
                    Lead Pipeline Stage
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      background: getStatusBadgeStyle(selectedBusiness.status).bg,
                      color: getStatusBadgeStyle(selectedBusiness.status).color,
                      border: `1px solid ${getStatusBadgeStyle(selectedBusiness.status).border}`,
                    }}
                  >
                    {getStatusBadgeStyle(selectedBusiness.status).longLabel}
                  </span>
                </div>

                {/* Quick 1-Click Status Changers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                  <button
                    onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, 'CONTACTED')}
                    disabled={isUpdatingStatus || selectedBusiness.status === 'CONTACTED'}
                    style={{
                      background: selectedBusiness.status === 'CONTACTED' ? 'rgba(56, 189, 248, 0.2)' : '#0e0e16',
                      border: selectedBusiness.status === 'CONTACTED' ? '1px solid #38bdf8' : '1px solid #2d2d42',
                      color: selectedBusiness.status === 'CONTACTED' ? '#38bdf8' : '#e5e7eb',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    ✉️ Contacted
                  </button>
                  <button
                    onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, 'IN_DISCUSSION')}
                    disabled={isUpdatingStatus || selectedBusiness.status === 'IN_DISCUSSION'}
                    style={{
                      background: selectedBusiness.status === 'IN_DISCUSSION' ? 'rgba(245, 158, 11, 0.2)' : '#0e0e16',
                      border: selectedBusiness.status === 'IN_DISCUSSION' ? '1px solid #f59e0b' : '1px solid #2d2d42',
                      color: selectedBusiness.status === 'IN_DISCUSSION' ? '#f59e0b' : '#e5e7eb',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    💬 Talking
                  </button>
                  <button
                    onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, 'CLOSED_WON')}
                    disabled={isUpdatingStatus || selectedBusiness.status === 'CLOSED_WON'}
                    style={{
                      background: selectedBusiness.status === 'CLOSED_WON' ? 'rgba(16, 185, 129, 0.25)' : '#0e0e16',
                      border: selectedBusiness.status === 'CLOSED_WON' ? '1px solid #10b981' : '1px solid #2d2d42',
                      color: selectedBusiness.status === 'CLOSED_WON' ? '#10b981' : '#e5e7eb',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    🎉 Won!
                  </button>
                  <button
                    onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, 'CLOSED_LOST')}
                    disabled={isUpdatingStatus || selectedBusiness.status === 'CLOSED_LOST'}
                    style={{
                      background: selectedBusiness.status === 'CLOSED_LOST' ? 'rgba(239, 68, 68, 0.2)' : '#0e0e16',
                      border: selectedBusiness.status === 'CLOSED_LOST' ? '1px solid #ef4444' : '1px solid #2d2d42',
                      color: selectedBusiness.status === 'CLOSED_LOST' ? '#ef4444' : '#e5e7eb',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    ❌ Lost
                  </button>
                  <button
                    onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, 'DISQUALIFIED')}
                    disabled={isUpdatingStatus || selectedBusiness.status === 'DISQUALIFIED'}
                    style={{
                      background: selectedBusiness.status === 'DISQUALIFIED' ? 'rgba(107, 114, 128, 0.2)' : '#0e0e16',
                      border: selectedBusiness.status === 'DISQUALIFIED' ? '1px solid #9ca3af' : '1px solid #2d2d42',
                      color: selectedBusiness.status === 'DISQUALIFIED' ? '#9ca3af' : '#e5e7eb',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    🚫 Disqualify
                  </button>
                  <button
                    onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, 'DISCOVERED')}
                    disabled={isUpdatingStatus || selectedBusiness.status === 'DISCOVERED'}
                    style={{
                      background: selectedBusiness.status === 'DISCOVERED' ? 'rgba(148, 163, 184, 0.2)' : '#0e0e16',
                      border: selectedBusiness.status === 'DISCOVERED' ? '1px solid #cbd5e1' : '1px solid #2d2d42',
                      color: selectedBusiness.status === 'DISCOVERED' ? '#cbd5e1' : '#e5e7eb',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    📍 Fresh
                  </button>
                </div>

                {/* CRM Notes & Follow-up log */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', color: '#9ca3af' }}>Deal Notes & Meeting Recap:</label>
                    {isUpdatingStatus && <span style={{ fontSize: '10px', color: '#ff3366' }}>Saving...</span>}
                  </div>
                  <textarea
                    value={crmNotesInput}
                    onChange={(e) => setCrmNotesInput(e.target.value)}
                    placeholder="e.g. Spoke with manager on call. Interested in redesign, quoted $2,500. Follow-up meeting Friday."
                    rows={2}
                    style={{
                      width: '100%',
                      background: '#0a0a10',
                      border: '1px solid #2d2d42',
                      borderRadius: '6px',
                      color: '#ffffff',
                      padding: '8px',
                      fontSize: '12px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, selectedBusiness.status, crmNotesInput)}
                      disabled={isUpdatingStatus}
                      style={{
                        background: '#2d2d42',
                        border: 'none',
                        color: '#ffffff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                  disabled={isAuditing || !selectedBusiness.website_url}
                  onClick={() => handleRunAudit(selectedBusiness.id)}
                  style={{
                    flex: 1,
                    background: '#161622',
                    border: '1px solid #2d2d42',
                    color: '#ffffff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: isAuditing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isAuditing ? 'Auditing...' : 'Run Website Audit'}
                </button>
                <button
                  disabled={isGeneratingAi}
                  onClick={() => handleGenerateAi(selectedBusiness.id)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={14} />
                  {isGeneratingAi ? 'Analyzing...' : 'Generate AI Draft'}
                </button>
              </div>

              {isLoadingDetail ? (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading intelligence data...</p>
              ) : businessDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                  {/* Verified Contacts */}
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#ff3366' }}>
                      Contacts ({businessDetail.contacts?.length || 0})
                    </h4>
                    {businessDetail.contacts?.length > 0 ? (
                      businessDetail.contacts.map((c: any) => (
                        <div key={c.id} style={{ background: '#07070d', border: '1px solid #1c1c2b', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{c.email}</div>
                          <span style={{ fontSize: '11px', color: c.verification_status === 'VALID' ? '#00f5a0' : '#f59e0b' }}>
                            Status: {c.verification_status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '12px' }}>
                        No email discovered yet. Audit the website or enter a public contact email below:
                      </p>
                    )}

                    {/* Inline Add Contact */}
                    <form onSubmit={handleAddContact} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        type="email"
                        placeholder="e.g. info@business.com"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        required
                        style={{
                          flex: 1,
                          background: '#07070d',
                          border: '1px solid #2d2d42',
                          color: '#ffffff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isAddingContact}
                        style={{
                          background: '#161622',
                          border: '1px solid #2d2d42',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isAddingContact ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isAddingContact ? 'Verifying...' : 'Save & Verify'}
                      </button>
                    </form>
                  </div>

                  {/* AI Recommendation & Personalized Draft */}
                  {businessDetail.aiAnalysis && (
                    <div style={{ background: '#07070d', border: '1px solid #1c1c2b', borderRadius: '8px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6', fontWeight: 700, marginBottom: '6px' }}>
                        <Sparkles size={14} /> Recommended Service:
                      </div>
                      <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                        {businessDetail.aiAnalysis.recommended_service}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>
                        <strong>Evidence:</strong> {businessDetail.aiAnalysis.evidence}
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        Draft Subject:
                      </div>
                      <div style={{ background: '#0e0e16', padding: '6px 10px', borderRadius: '4px', color: '#38bdf8', marginBottom: '8px' }}>
                        {businessDetail.aiAnalysis.suggested_subject}
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        Personalized Draft:
                      </div>
                      <pre style={{ background: '#0e0e16', padding: '10px', borderRadius: '4px', color: '#d1d5db', fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                        {businessDetail.aiAnalysis.personalized_draft}
                      </pre>

                      {/* Approve & Enqueue Action Button */}
                      <div style={{ marginTop: '14px' }}>
                        <button
                          disabled={isQueueingEmail || !businessDetail.contacts || businessDetail.contacts.length === 0}
                          onClick={handleEnqueueDraft}
                          style={{
                            width: '100%',
                            background: businessDetail.contacts && businessDetail.contacts.length > 0 ? '#ff3366' : '#2d2d42',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: businessDetail.contacts && businessDetail.contacts.length > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <Send size={15} />
                          {isQueueingEmail ? 'Enqueuing...' : 'Approve & Enqueue for Dispatch'}
                        </button>
                        {(!businessDetail.contacts || businessDetail.contacts.length === 0) && (
                          <p style={{ color: '#f59e0b', fontSize: '11px', marginTop: '6px', textAlign: 'center' }}>
                            Add a contact email above to enable enqueuing.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* TAB: CONTACTS DIRECTORY */}
      {activeTab === 'contacts' && (
        <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Discovered Business Contacts ({contacts.length})
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0 0' }}>
                Verified against MX DNS records, disposable domain blocklists, and role accounts.
              </p>
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/admin/outreach/contacts');
                const data = await res.json();
                if (data.contacts) setContacts(data.contacts);
                showToast('Contact directory refreshed.', 'info');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#161622',
                border: '1px solid #2d2d42',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} /> Refresh Contacts
            </button>
          </div>

          {contacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
              <UserCheck size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db', margin: '0 0 4px 0' }}>No Contacts Recorded Yet</p>
              <p style={{ fontSize: '12px', margin: 0 }}>
                Contacts are discovered automatically during website audits or can be added manually when inspecting any business lead.
              </p>
              <button
                onClick={() => setActiveTab('leads')}
                style={{
                  marginTop: '16px',
                  background: '#ff3366',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Inspect Businesses & Add Contacts
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1c1c2b', color: '#9ca3af' }}>
                    <th style={{ padding: '12px 10px' }}>Contact Email</th>
                    <th style={{ padding: '12px 10px' }}>Verification Status</th>
                    <th style={{ padding: '12px 10px' }}>Associated Business</th>
                    <th style={{ padding: '12px 10px' }}>Location</th>
                    <th style={{ padding: '12px 10px' }}>Type</th>
                    <th style={{ padding: '12px 10px' }}>MX DNS</th>
                    <th style={{ padding: '12px 10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #161622' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: '#ffffff' }}>
                        {c.email}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            background:
                              c.verification_status === 'VALID'
                                ? 'rgba(0, 245, 160, 0.15)'
                                : c.verification_status === 'RISKY'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color:
                              c.verification_status === 'VALID'
                                ? '#00f5a0'
                                : c.verification_status === 'RISKY'
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        >
                          {c.verification_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{c.business_name}</div>
                        {c.business_domain && (
                          <div style={{ fontSize: '11px', color: '#38bdf8' }}>{c.business_domain}</div>
                        )}
                        {c.business_status && (
                          <div style={{ marginTop: '4px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '6px',
                                background: getStatusBadgeStyle(c.business_status).bg,
                                color: getStatusBadgeStyle(c.business_status).color,
                                border: `1px solid ${getStatusBadgeStyle(c.business_status).border}`,
                                display: 'inline-block',
                              }}
                            >
                              {getStatusBadgeStyle(c.business_status).label}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#9ca3af' }}>
                        {c.business_city ? `${c.business_city}, ` : ''}{c.business_country}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontSize: '11px', color: c.is_role_account ? '#f59e0b' : '#9ca3af' }}>
                          {c.is_role_account ? 'Team / Role' : 'Direct Mailbox'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontSize: '11px', color: c.mx_valid ? '#00f5a0' : '#6b7280' }}>
                          {c.mx_valid ? 'Verified' : 'Unchecked'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              const foundBiz = businesses.find((b) => b.id === c.business_id);
                              if (foundBiz) {
                                setActiveTab('leads');
                                handleSelectBusiness(foundBiz);
                              } else {
                                showToast(`Business record loaded: ${c.business_name}`, 'info');
                              }
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Inspect & CRM
                          </button>
                          {c.business_status !== 'CLOSED_WON' && (
                            <button
                              onClick={async () => {
                                await handleUpdateBusinessStatus(c.business_id, 'CLOSED_WON');
                                setContacts((prev) =>
                                  prev.map((item) =>
                                    item.business_id === c.business_id
                                      ? { ...item, business_status: 'CLOSED_WON' }
                                      : item
                                  )
                                );
                              }}
                              title="Mark Deal Won"
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#10b981',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Won 🎉
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: QUEUE & DISPATCH */}
      {activeTab === 'queue' && (
        <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Outbound Dispatch Queue ({messages.length})
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0 0' }}>
                Protected by SPF/DKIM verification, domain hourly rate limiting (1/hr per domain), and pre-send suppression checks.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={queueBatchSize}
                onChange={(e) => setQueueBatchSize(Number(e.target.value))}
                style={{
                  background: '#07070d',
                  border: '1px solid #2d2d42',
                  color: '#ffffff',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <option value={1}>Batch: 1</option>
                <option value={5}>Batch: 5</option>
                <option value={10}>Batch: 10</option>
              </select>

              <button
                onClick={() => handleProcessQueueBatch(false)}
                disabled={isProcessingQueue}
                style={{
                  background: '#161622',
                  border: '1px solid #2d2d42',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: isProcessingQueue ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Play size={14} color="#00f5a0" />
                {isProcessingQueue ? 'Processing...' : 'Run Due Queue'}
              </button>

              <button
                onClick={() => handleProcessQueueBatch(true)}
                disabled={isProcessingQueue}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isProcessingQueue ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={14} />
                Force Dispatch All
              </button>

              <button
                onClick={refreshQueueMessages}
                style={{
                  background: '#161622',
                  border: '1px solid #2d2d42',
                  color: '#9ca3af',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Refresh Queue List"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
              <Mail size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db', margin: '0 0 4px 0' }}>Queue is Empty</p>
              <p style={{ fontSize: '12px', margin: 0 }}>
                To enqueue emails, inspect any business lead in the Businesses tab, generate an AI draft, and click "Approve & Enqueue for Dispatch".
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1c1c2b', color: '#9ca3af' }}>
                    <th style={{ padding: '12px 10px' }}>Recipient</th>
                    <th style={{ padding: '12px 10px' }}>Business</th>
                    <th style={{ padding: '12px 10px' }}>Subject</th>
                    <th style={{ padding: '12px 10px' }}>Status</th>
                    <th style={{ padding: '12px 10px' }}>Dispatch Schedule / Note</th>
                    <th style={{ padding: '12px 10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #161622' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: '#ffffff' }}>
                        {m.recipient_email}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{m.business_name || 'Business'}</div>
                        {m.business_domain && (
                          <div style={{ fontSize: '11px', color: '#38bdf8' }}>{m.business_domain}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#d1d5db', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.subject}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            background:
                              m.status === 'SENT'
                                ? 'rgba(0, 245, 160, 0.15)'
                                : m.status === 'QUEUED'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : m.status === 'SENDING'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(107, 114, 128, 0.15)',
                            color:
                              m.status === 'SENT'
                                ? '#00f5a0'
                                : m.status === 'QUEUED'
                                ? '#f59e0b'
                                : m.status === 'SENDING'
                                ? '#38bdf8'
                                : '#9ca3af',
                          }}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '12px', color: '#9ca3af' }}>
                        {m.status === 'SENT' ? (
                          <span style={{ color: '#00f5a0' }}>✓ Sent {new Date(m.sent_at || m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : m.error_message ? (
                          <span style={{ color: '#f59e0b' }}>{m.error_message}</span>
                        ) : m.scheduled_for ? (
                          <span>Scheduled: {new Date(m.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : (
                          'Ready to send'
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {m.status === 'QUEUED' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleSendSingle(m.id)}
                              style={{
                                background: '#ff3366',
                                color: '#ffffff',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Send Now
                            </button>
                            <button
                              onClick={() => handleCancelMessage(m.id)}
                              style={{
                                background: '#161622',
                                border: '1px solid #2d2d42',
                                color: '#9ca3af',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : m.status === 'SENT' ? (
                          <span style={{ fontSize: '11px', color: '#00f5a0' }}>Dispatched</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMPLIANCE & SUPPRESSION */}
      {activeTab === 'compliance' && (
        <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
            Compliance & Global Suppression List
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 20px 0' }}>
            Any address present here is permanently and irreversibly blocked from receiving outbound outreach.
          </p>

          <form onSubmit={handleAddSuppression} style={{ display: 'flex', gap: '12px', maxWidth: '600px', marginBottom: '24px' }}>
            <input
              type="email"
              placeholder="Enter email to suppress..."
              value={suppressEmail}
              onChange={(e) => setSuppressEmail(e.target.value)}
              required
              style={{
                flex: 1,
                background: '#07070d',
                border: '1px solid #2d2d42',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <button
              type="submit"
              disabled={isAddingSuppression}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {isAddingSuppression ? 'Adding...' : 'Add Suppression'}
            </button>
          </form>

          <div style={{ background: '#07070d', border: '1px solid #1c1c2b', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ffffff' }}>Jurisdiction Gate Policy Summary</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#9ca3af', fontSize: '13px', lineHeight: 1.8 }}>
              <li><strong>United States (CAN-SPAM):</strong> Commercial B2B permitted with physical address and one-click unsubscribe.</li>
              <li><strong>European Union (GDPR):</strong> Corporate domains require documented Legitimate Interest Assessment. Consumer webmail strictly blocked.</li>
              <li><strong>United Kingdom (PECR):</strong> Corporate bodies permitted with legitimate interest. Sole traders require prior consent.</li>
              <li><strong>Canada (CASL):</strong> Requires verified conspicuous publication relevant to business duties without non-solicitation disclaimer.</li>
              <li><strong>Rest of World / Unknown Country:</strong> Precautionary default: Sending strictly blocked.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px', maxWidth: '700px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>Safety & Rate Limits</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', marginBottom: '6px' }}>Daily Sending Cap</label>
              <input
                type="number"
                value={settings.daily_send_cap}
                disabled
                style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '10px', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', marginBottom: '6px' }}>Domain Hourly Throttle Cap</label>
              <input
                type="number"
                value={settings.domain_hourly_cap}
                disabled
                style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '10px', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', marginBottom: '6px' }}>Physical Company Address (for CAN-SPAM disclosure)</label>
              <input
                type="text"
                value={settings.physical_address}
                disabled
                style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '10px', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
