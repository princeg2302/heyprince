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
  adminEmail: string;
}

export default function OutreachClient({
  initialAnalytics,
  initialSettings,
  initialBusinesses,
  totalBusinesses,
  initialJobs,
  queuedCount,
}: OutreachClientProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'telemetry' | 'discovery' | 'leads' | 'queue' | 'compliance' | 'settings'
  >('telemetry');

  const [settings, setSettings] = useState<OutreachSettingsEntity>(initialSettings);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [businesses, setBusinesses] = useState<BusinessEntity[]>(initialBusinesses);
  const [jobs, setJobs] = useState<DiscoveryJobEntity[]>(initialJobs);

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
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/outreach/businesses/${b.id}`);
      const data = await res.json();
      if (data.success) {
        setBusinessDetail(data);
      }
    } catch {
      showToast('Error fetching business intelligence record', 'error');
    } finally {
      setIsLoadingDetail(false);
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

  // Process Outbound Queue Batch
  const handleProcessQueueBatch = async () => {
    setIsProcessingQueue(true);
    try {
      const res = await fetch('/api/admin/outreach/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_batch', batchSize: queueBatchSize }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, data.outcome?.killSwitchActive ? 'info' : 'success');
        if (data.outcome && !data.outcome.killSwitchActive) {
          setQueuedEmailCount((prev) => Math.max(0, prev - data.outcome.processed));
          setAnalytics((prev) => ({
            ...prev,
            queuedEmails: Math.max(0, prev.queuedEmails - data.outcome.processed),
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

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #1c1c2b',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'telemetry', label: 'Overview & Metrics', icon: Layers },
          { key: 'discovery', label: 'Discovery Scanner', icon: Globe },
          { key: 'leads', label: `Businesses (${totalBusinesses})`, icon: Search },
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#1c1c2b' : 'transparent',
                color: isActive ? '#ffffff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} color={isActive ? '#ff3366' : '#9ca3af'} />
              {tab.label}
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
                  onClick={handleProcessQueueBatch}
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
        <div style={{ display: 'grid', gridTemplateColumns: selectedBusiness ? '1fr 420px' : '1fr', gap: '20px' }}>
          <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
              Discovered Business Records ({businesses.length})
            </h2>

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
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b) => (
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
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: b.status === 'ENRICHED' ? 'rgba(0, 245, 160, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                              color: b.status === 'ENRICHED' ? '#00f5a0' : '#a78bfa',
                            }}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <button
                            onClick={() => handleSelectBusiness(b)}
                            style={{
                              background: '#161622',
                              border: '1px solid #2d2d42',
                              color: '#ffffff',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
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
                maxHeight: '800px',
                overflowY: 'auto',
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

      {/* TAB 4: QUEUE & DISPATCH */}
      {activeTab === 'queue' && (
        <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>Outbound Dispatch Queue</h2>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0 0' }}>
                Governed by pre-send suppression verification, RFC 8058 one-click headers, and domain throttling.
              </p>
            </div>
            <button
              onClick={handleProcessQueueBatch}
              disabled={isProcessingQueue}
              style={{
                background: '#ff3366',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {isProcessingQueue ? 'Processing...' : 'Run Dispatch Worker'}
            </button>
          </div>

          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            Queue messages are created when approved drafts are queued. To enqueue drafts, click "Inspect" on any business lead and approve the draft.
          </p>
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
