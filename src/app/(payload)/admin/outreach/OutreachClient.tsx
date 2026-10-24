'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Search,
  ShieldAlert,
  ShieldCheck,
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
  Layers,
  FileText,
  Phone,
  Loader2,
  X,
  Target,
  ArrowRight,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';
import {
  BusinessEntity,
  DiscoveryJobEntity,
  OutreachSettingsEntity,
  BusinessStatus,
} from '@/lib/outreach/types';
import {
  evaluateLeadContactChannels,
  LEAD_SCOUT_TARGET_ROTATION,
} from '@/lib/outreach/qualification';

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

const WhatsAppIcon = ({ size = 13 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.301-.776.978-.952 1.179-.176.2-.352.226-.653.076-.301-.15-1.272-.469-2.424-1.496-.897-.799-1.503-1.787-1.68-2.088-.176-.301-.019-.464.131-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.501.1-.2.05-.376-.025-.527-.075-.15-.676-1.63-.927-2.232-.245-.586-.494-.506-.676-.516-.176-.01-.376-.01-.577-.01-.2 0-.526.075-.802.376-.276.301-1.053 1.029-1.053 2.509 0 1.48 1.078 2.91 1.229 3.11.15.201 2.122 3.24 5.141 4.544.718.311 1.279.497 1.716.636.721.23 1.377.197 1.895.12.578-.087 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.351zM12.042 22C6.541 22 2.07 17.529 2.07 12.028c0-2.02.597-3.904 1.63-5.49L2.07 2l4.664 1.599C8.286 2.628 10.111 2.056 12.042 2.056c5.501 0 9.972 4.471 9.972 9.972 0 5.501-4.471 9.972-9.972 9.972z" />
  </svg>
);

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

  // 4 Core Pipeline Views
  const [activeTab, setActiveTab] = useState<'discover' | 'qualified' | 'sent' | 'analytics'>('discover');

  const [settings, setSettings] = useState<OutreachSettingsEntity>(initialSettings);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [businesses, setBusinesses] = useState<BusinessEntity[]>(initialBusinesses);
  const [jobs, setJobs] = useState<DiscoveryJobEntity[]>(initialJobs);
  const [contacts, setContacts] = useState<any[]>(initialContacts);
  const [messages, setMessages] = useState<any[]>(initialMessages);

  // Automated Daily Scout State
  const [isRunningScout, setIsRunningScout] = useState(false);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [scoutDrafts, setScoutDrafts] = useState<any[]>([]);

  // Discover Leads Workspace State
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverSourceFilter, setDiscoverSourceFilter] = useState<'all' | 'automated' | 'manual'>('all');
  const [discoverQualFilter, setDiscoverQualFilter] = useState<'all' | 'qualified' | 'unqualified'>('all');
  const [showManualScanForm, setShowManualScanForm] = useState(false);

  // Manual Scan Form Inputs
  const [discoverCountry, setDiscoverCountry] = useState('US');
  const [discoverCity, setDiscoverCity] = useState('Austin');
  const [discoverCategory, setDiscoverCategory] = useState('WordPress & Web Development');
  const [discoverProvider, setDiscoverProvider] = useState<'openstreetmap' | 'mock'>('openstreetmap');
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Business Detail / CRM State
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessEntity | null>(null);
  const [businessDetail, setBusinessDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Queue Processing State
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueBatchSize, setQueueBatchSize] = useState(5);
  const [queuedEmailCount, setQueuedEmailCount] = useState(queuedCount);

  // CRM Pipeline State
  const [pipelineFilter, setPipelineFilter] = useState('ALL');
  const [crmNotesInput, setCrmNotesInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Business Selection & Deletion State
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [bulkDeleteBizOpen, setBulkDeleteBizOpen] = useState(false);
  const [bulkDeleteBizLoading, setBulkDeleteBizLoading] = useState(false);
  const [deletingBizId, setDeletingBizId] = useState<string | null>(null);
  const [deletingBizLoading, setDeletingBizLoading] = useState(false);

  // Compute today's scheduled rotation target
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const todayTarget = LEAD_SCOUT_TARGET_ROTATION[dayOfYear % LEAD_SCOUT_TARGET_ROTATION.length];

  // Load existing proposals
  const loadScoutDrafts = async () => {
    try {
      const res = await fetch('/api/admin/outreach/scout');
      const data = await res.json();
      if (data.drafts) setScoutDrafts(data.drafts);
    } catch {}
  };

  useEffect(() => {
    loadScoutDrafts();
  }, []);

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

  // Evaluate lead qualification across all businesses
  const getLeadEval = (biz: BusinessEntity) => {
    return evaluateLeadContactChannels({
      website_url: biz.website_url,
      domain: biz.domain,
      phone: (biz.metadata as any)?.phone,
      metadata: biz.metadata,
      contacts: contacts.filter((c) => c.business_id === biz.id),
    });
  };

  const qualifiedBusinesses = businesses.filter((b) => getLeadEval(b).isQualified);

  // Discover Leads Display Filter
  const displayedDiscoverBusinesses = businesses
    .filter((b) => {
      if (discoverSearch.trim()) {
        const q = discoverSearch.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchDomain = (b.domain || b.website_url || '').toLowerCase().includes(q);
        const matchCity = (b.city || '').toLowerCase().includes(q);
        const matchCategory = (b.category || '').toLowerCase().includes(q);
        if (!matchName && !matchDomain && !matchCity && !matchCategory) return false;
      }

      const isAuto =
        (b.metadata as any)?.discovery_source === 'automated' ||
        (b.metadata as any)?.discovery_source === 'automated_daily_scout';
      if (discoverSourceFilter === 'automated' && !isAuto) return false;
      if (discoverSourceFilter === 'manual' && isAuto) return false;

      const evalInfo = getLeadEval(b);
      if (discoverQualFilter === 'qualified' && !evalInfo.isQualified) return false;
      if (discoverQualFilter === 'unqualified' && evalInfo.isQualified) return false;

      return true;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

  // Qualified Leads CRM Filter
  const displayedQualifiedBusinesses = qualifiedBusinesses
    .filter((b) => {
      if (pipelineFilter === 'ALL') return true;
      return b.status === pipelineFilter;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

  const activeDisplayList = activeTab === 'qualified' ? displayedQualifiedBusinesses : displayedDiscoverBusinesses;

  const allBizSelected =
    activeDisplayList.length > 0 &&
    activeDisplayList.every((b) => selectedBusinessIds.includes(b.id));
  const someBizSelected =
    activeDisplayList.some((b) => selectedBusinessIds.includes(b.id)) && !allBizSelected;

  const handleSelectAllBiz = () => {
    if (allBizSelected) {
      setSelectedBusinessIds([]);
    } else {
      setSelectedBusinessIds(activeDisplayList.map((b) => b.id));
    }
  };

  const handleToggleSelectBiz = (id: string) => {
    setSelectedBusinessIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
      } else {
        showToast('Error updating test mode', 'error');
      }
    } catch {
      showToast('Error updating test mode', 'error');
    }
  };

  // Trigger Automated Daily Lead Scout
  const handleRunAutomatedScout = async () => {
    setIsRunningScout(true);
    try {
      const res = await fetch('/api/admin/outreach/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_scout' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Automated Lead Scout scan completed successfully!', 'success');
        await loadScoutDrafts();
        const bRes = await fetch('/api/admin/outreach/businesses?limit=100');
        const bData = await bRes.json();
        if (bData.items) setBusinesses(bData.items);
        const jRes = await fetch('/api/admin/outreach/discovery');
        const jData = await jRes.json();
        if (jData.jobs) setJobs(jData.jobs);
      } else {
        showToast(data.error || 'Failed to run Lead Scout', 'error');
      }
    } catch {
      showToast('Network error while running automated Lead Scout', 'error');
    } finally {
      setIsRunningScout(false);
    }
  };

  // Deduplicate Existing Businesses
  const handleDeduplicate = async () => {
    setIsDeduplicating(true);
    try {
      const res = await fetch('/api/admin/outreach/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduplicate' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          data.message || `Deduplication complete. Removed ${data.duplicatesRemoved || 0} duplicate records.`,
          'success'
        );
        const bRes = await fetch('/api/admin/outreach/businesses?limit=100');
        const bData = await bRes.json();
        if (bData.items) setBusinesses(bData.items);
        await loadScoutDrafts();
      } else {
        showToast(data.error || 'Deduplication failed', 'error');
      }
    } catch {
      showToast('Network error while running deduplication', 'error');
    } finally {
      setIsDeduplicating(false);
    }
  };

  // Execute Manual Discovery Scan
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
          triggerSource: 'manual',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        const bRes = await fetch('/api/admin/outreach/businesses?limit=100');
        const bData = await bRes.json();
        if (bData.items) setBusinesses(bData.items);

        const jRes = await fetch('/api/admin/outreach/discovery');
        const jData = await jRes.json();
        if (jData.jobs) setJobs(jData.jobs);
        setShowManualScanForm(false);
      } else {
        showToast(data.error || 'Discovery scan failed', 'error');
      }
    } catch {
      showToast('Error executing discovery job', 'error');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Open Business Detail & CRM
  const handleOpenBusinessById = async (businessId: string, fallbackName?: string) => {
    setIsLoadingDetail(true);
    const existing = businesses.find((b) => b.id === businessId);
    if (existing) {
      setSelectedBusiness(existing);
      setCrmNotesInput((existing.metadata as any)?.crm_notes || '');
    } else {
      setSelectedBusiness({
        id: businessId,
        name: fallbackName || 'Loading business...',
        status: 'DISCOVERED',
        country_code: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as BusinessEntity);
    }

    try {
      const res = await fetch(`/api/admin/outreach/businesses/${businessId}`);
      const data = await res.json();
      if (data.success && data.business) {
        setSelectedBusiness(data.business);
        setBusinessDetail(data);
        setCrmNotesInput(data.business.metadata?.crm_notes || '');
        setBusinesses((prev) => {
          if (!prev.some((b) => b.id === data.business.id)) {
            return [data.business, ...prev];
          }
          return prev;
        });
      }
    } catch {
      showToast('Error fetching business CRM record', 'error');
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

  // Delete Single Business (Cascades cleanly)
  const handleDeleteSingleBiz = async () => {
    if (!deletingBizId) return;
    setDeletingBizLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/businesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [deletingBizId] }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete business.', 'error');
        setDeletingBizLoading(false);
        return;
      }
      setBusinesses((prev) => prev.filter((b) => b.id !== deletingBizId));
      if (selectedBusiness?.id === deletingBizId) {
        setSelectedBusiness(null);
        setBusinessDetail(null);
      }
      showToast('Business record deleted.', 'success');
      setDeletingBizId(null);
    } catch {
      showToast('Error deleting business.', 'error');
    } finally {
      setDeletingBizLoading(false);
    }
  };

  // Bulk Delete Selected Businesses
  const handleBulkDeleteBiz = async () => {
    if (selectedBusinessIds.length === 0) return;
    setBulkDeleteBizLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/businesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBusinessIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete selected businesses.', 'error');
        setBulkDeleteBizLoading(false);
        return;
      }
      setBusinesses((prev) => prev.filter((b) => !selectedBusinessIds.includes(b.id)));
      if (selectedBusiness && selectedBusinessIds.includes(selectedBusiness.id)) {
        setSelectedBusiness(null);
        setBusinessDetail(null);
      }
      showToast(
        `Successfully deleted ${selectedBusinessIds.length} business lead${selectedBusinessIds.length > 1 ? 's' : ''}.`,
        'success'
      );
      setSelectedBusinessIds([]);
      setBulkDeleteBizOpen(false);
    } catch {
      showToast('Error deleting selected businesses.', 'error');
    } finally {
      setBulkDeleteBizLoading(false);
    }
  };

  // Run Website Tech Audit
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
        const pagesCrawled = data.crawledPages || 1;
        const emailsFound = data.discoveredContacts?.length || 0;
        const phonesFound = data.discoveredPhones?.length || 0;
        showToast(
          `Deep audit complete! Crawled ${pagesCrawled} pages. Discovered ${emailsFound} emails & ${phonesFound} phones.`,
          'success'
        );
        if (data.business) {
          setBusinesses((prev) =>
            prev.map((biz) => (biz.id === businessId ? { ...biz, ...data.business } : biz))
          );
        }
        fetch('/api/admin/outreach/contacts')
          .then((r) => r.json())
          .then((cData) => {
            if (cData.contacts) setContacts(cData.contacts);
          })
          .catch(() => {});
        if (selectedBusiness?.id === businessId) {
          handleOpenBusinessById(businessId);
        }
      } else {
        showToast(data.error || 'Audit failed', 'error');
      }
    } catch {
      showToast('Network error during website audit', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  // Trigger AI Intelligence Opportunity & Pitch (Routes to AI Approvals)
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
        showToast('AI opportunity proposal generated & submitted to AI Approvals Hub!', 'success');
        await loadScoutDrafts();
        if (selectedBusiness?.id === businessId) {
          handleOpenBusinessById(businessId);
        }
      } else {
        showToast(data.error || 'AI proposal generation failed', 'error');
      }
    } catch {
      showToast('Network error during proposal generation', 'error');
    } finally {
      setIsGeneratingAi(false);
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

  // Process Outbound Queue Batch
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

  // Reusable CRM & Lead Dossier Drawer
  const renderBusinessDetailDrawer = () => {
    if (!selectedBusiness) return null;
    const evalData = getLeadEval(selectedBusiness);

    // Check if there is an existing proposal for this business
    const existingDraft = scoutDrafts.find(
      (d) =>
        d.metadata?.businessId === selectedBusiness.id ||
        (selectedBusiness.domain && d.metadata?.domain === selectedBusiness.domain)
    );

    return (
      <div
        style={{
          position: 'sticky',
          top: '20px',
          alignSelf: 'start',
          background: '#0e0e16',
          border: '1px solid #1c1c2b',
          borderRadius: '12px',
          padding: '24px',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              {selectedBusiness.name}
            </h3>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {selectedBusiness.category} • {selectedBusiness.city || selectedBusiness.country_code}
            </span>
          </div>
          <button
            onClick={() => setSelectedBusiness(null)}
            style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>

        {/* Contact Channels Dossier */}
        <div style={{ background: '#12121a', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 700 }}>
            Available Contact Channels
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Website URL:</span>
              {selectedBusiness.website_url ? (
                <a
                  href={selectedBusiness.website_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{selectedBusiness.domain || selectedBusiness.website_url}</span>
                  <ExternalLink size={11} />
                </a>
              ) : (
                <span style={{ color: '#ef4444' }}>None</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Public Email:</span>
              {evalData.hasEmail ? (
                <span style={{ color: '#00f5a0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={12} />
                  <span>{contacts.find((c) => c.business_id === selectedBusiness.id)?.email}</span>
                </span>
              ) : (
                <span style={{ color: '#ef4444' }}>None Discovered</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Phone & WhatsApp:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {evalData.hasPhone ? (
                  <a
                    href={`tel:${evalData.phoneDigits}`}
                    style={{ color: '#d1d5db', textDecoration: 'none' }}
                  >
                    {evalData.phoneDigits}
                  </a>
                ) : (
                  <span style={{ color: '#ef4444' }}>None</span>
                )}
                {evalData.isWhatsAppEligible && evalData.whatsappUrl && (
                  <a
                    href={evalData.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'rgba(37, 211, 102, 0.2)',
                      border: '1px solid #25d366',
                      color: '#25d366',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <WhatsAppIcon size={11} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1c1c2b', paddingTop: '8px', marginTop: '4px' }}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>Recommended Outreach Channel:</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background:
                    evalData.bestChannel === 'whatsapp'
                      ? 'rgba(37, 211, 102, 0.2)'
                      : evalData.bestChannel === 'email'
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  color:
                    evalData.bestChannel === 'whatsapp'
                      ? '#25d366'
                      : evalData.bestChannel === 'email'
                      ? '#38bdf8'
                      : '#ef4444',
                  border: `1px solid ${
                    evalData.bestChannel === 'whatsapp'
                      ? '#25d366'
                      : evalData.bestChannel === 'email'
                      ? '#38bdf8'
                      : '#ef4444'
                  }`,
                }}
              >
                {evalData.bestChannel.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Pipeline & Deal Stage */}
        <div style={{ background: '#161622', border: '1px solid #2d2d42', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {['CONTACTED', 'IN_DISCUSSION', 'CLOSED_WON', 'CLOSED_LOST', 'DISQUALIFIED', 'DISCOVERED'].map((st) => (
              <button
                key={st}
                onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, st as BusinessStatus)}
                disabled={isUpdatingStatus || selectedBusiness.status === st}
                style={{
                  background: selectedBusiness.status === st ? 'rgba(255, 51, 102, 0.2)' : '#0e0e16',
                  border: selectedBusiness.status === st ? '1px solid #ff3366' : '1px solid #2d2d42',
                  color: selectedBusiness.status === st ? '#ff3366' : '#e5e7eb',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {getStatusBadgeStyle(st).label}
              </button>
            ))}
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
              Deal Notes & Follow-up Recap:
            </label>
            <textarea
              value={crmNotesInput}
              onChange={(e) => setCrmNotesInput(e.target.value)}
              placeholder="e.g. Spoke with founder. Needs WooCommerce speed tuning. Proposal sent."
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
                onClick={() =>
                  handleUpdateBusinessStatus(selectedBusiness.id, selectedBusiness.status, crmNotesInput)
                }
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

        {/* Technical Investigation & Audit */}
        <div style={{ background: '#12121a', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 700 }}>
              Technical Website Audit
            </span>
            <button
              onClick={() => handleRunAudit(selectedBusiness.id)}
              disabled={isAuditing}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isAuditing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Search size={11} className={isAuditing ? 'hpa-spin' : ''} />
              <span>{isAuditing ? 'Crawling...' : 'Run Audit'}</span>
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            Audits tech stack (WordPress, Shopify, Next.js), TTFB speed latency, and extracts public contact points.
          </p>
        </div>

        {/* AI Proposal & Outreach Review */}
        <div style={{ background: '#12121a', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff3366', fontWeight: 700 }}>
              AI Proposal & Outreach
            </span>
            {!existingDraft && (
              <button
                onClick={() => handleGenerateAi(selectedBusiness.id)}
                disabled={isGeneratingAi}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} className={isGeneratingAi ? 'hpa-spin' : ''} />
                <span>{isGeneratingAi ? 'Generating...' : 'Draft Pitch'}</span>
              </button>
            )}
          </div>

          {existingDraft ? (
            <div>
              <div style={{ background: '#0a0a10', border: '1px solid #2d2d42', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                  {existingDraft.title}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                  {existingDraft.excerpt}
                </div>
                <div style={{ fontSize: '11px', color: '#d1d5db', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto', background: '#050508', padding: '8px', borderRadius: '4px' }}>
                  {existingDraft.content}
                </div>
              </div>

              {/* Direct Authorization Action linking to AI Approvals */}
              <Link
                href="/admin/approvals"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                  color: '#ffffff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <span>Authorize & Send in AI Approvals Hub</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              No proposal generated yet. Click &quot;Draft Pitch&quot; above to create a tailored strategy pitch and route it to AI Approvals.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 32px', color: '#ffffff', maxWidth: '1440px', margin: '0 auto', minWidth: 0, boxSizing: 'border-box' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            Lead Intelligence & Outreach Command Center
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
            Automated daily Lead Scout, multi-country business discovery, SSRF-safe website auditing, and AI Approvals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/admin/approvals"
            style={{
              background: 'rgba(255, 51, 102, 0.12)',
              border: '1px solid rgba(255, 51, 102, 0.4)',
              color: '#ff3366',
              borderRadius: '8px',
              padding: '10px 16px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            <Sparkles size={15} />
            <span>AI Approvals Hub</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs: 4 Clear Workspaces */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #1c1c2b',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {[
          { key: 'discover', label: `1. Discover Leads (${businesses.length})`, icon: Globe },
          { key: 'qualified', label: `2. Qualified Leads (${qualifiedBusinesses.length})`, icon: Target },
          { key: 'sent', label: `3. Sent & Follow-ups (${analytics.sentEmails + queuedEmailCount})`, icon: Send },
          { key: 'analytics', label: '4. History & Analytics', icon: Layers },
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
              }}
            >
              <Icon size={15} color={isActive ? '#ff3366' : '#9ca3af'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DISCOVER LEADS (Central Workspace: Manual + Automated Discovery)       */}
      {/* ========================================================================= */}
      {activeTab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Automated Daily Lead Scout Status Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 51, 102, 0.08), rgba(14, 14, 22, 0.95))',
              border: '1px solid rgba(255, 51, 102, 0.3)',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: 'rgba(255, 51, 102, 0.2)',
                    padding: '6px',
                    borderRadius: '8px',
                    color: '#ff3366',
                    display: 'flex',
                  }}
                >
                  <Sparkles size={18} />
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                  Automated Daily Lead Scout: Active & Scheduled
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Daily 05:00 UTC
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#9ca3af', maxWidth: '780px' }}>
                Today&apos;s rotation target: <strong style={{ color: '#ffffff' }}>{todayTarget.city}, {todayTarget.country}</strong> ({todayTarget.category}).
                Automatically discovers public businesses, verifies contact points, and prepares tailored proposals for AI Approval without duplicates.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleRunAutomatedScout}
                disabled={isRunningScout}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isRunningScout ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 51, 102, 0.25)',
                }}
              >
                {isRunningScout ? <Loader2 size={16} className="hpa-spin" /> : <Sparkles size={16} />}
                <span>{isRunningScout ? 'Scouting Leads...' : '⚡ Run Automated Daily Scout Now'}</span>
              </button>

              <button
                onClick={() => setShowManualScanForm(!showManualScanForm)}
                style={{
                  background: '#161622',
                  border: '1px solid #2d2d42',
                  color: '#ffffff',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={15} />
                <span>{showManualScanForm ? 'Hide Manual Scan Form' : 'New Manual Scan'}</span>
              </button>
            </div>
          </div>

          {/* Manual Discovery Scan Form (Collapsible) */}
          {showManualScanForm && (
            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                Launch Custom Manual Discovery Scan
              </h4>
              <form onSubmit={handleRunDiscovery} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                    Country
                  </label>
                  <select
                    value={discoverCountry}
                    onChange={(e) => setDiscoverCountry(e.target.value)}
                    style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                  >
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="IN">India (IN)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="AE">United Arab Emirates (AE)</option>
                    <option value="DE">Germany (DE)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={discoverCity}
                    onChange={(e) => setDiscoverCity(e.target.value)}
                    required
                    style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={discoverCategory}
                    onChange={(e) => setDiscoverCategory(e.target.value)}
                    style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                  >
                    <option value="WordPress & Web Development">WordPress & Web Development</option>
                    <option value="E-commerce & Retail Storefront">E-commerce & Retail Storefront</option>
                    <option value="Healthcare & Dental Clinics">Healthcare & Dental Clinics</option>
                    <option value="Tech & Marketing Agencies">Tech & Marketing Agencies</option>
                    <option value="Restaurants & Hospitality">Restaurants & Hospitality</option>
                    <option value="Law & Professional Services">Law & Professional Services</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                    Provider
                  </label>
                  <select
                    value={discoverProvider}
                    onChange={(e) => setDiscoverProvider(e.target.value as any)}
                    style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                  >
                    <option value="openstreetmap">OpenStreetMap Nominatim (Live Real Data)</option>
                    <option value="mock">Test Mock Provider</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowManualScanForm(false)}
                    style={{ background: '#161622', border: '1px solid #2d2d42', color: '#9ca3af', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDiscovering}
                    style={{ background: '#ff3366', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: isDiscovering ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isDiscovering ? <Loader2 size={13} className="hpa-spin" /> : <Globe size={13} />}
                    <span>{isDiscovering ? 'Scanning...' : 'Launch Manual Scan'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Combined Discovered Leads Directory */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selectedBusiness ? 'minmax(0, 1fr) 420px' : 'minmax(0, 1fr)',
              gap: '20px',
              minWidth: 0,
              width: '100%',
              alignItems: 'start',
            }}
          >
            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px', minWidth: 0 }}>
              {/* Header & Sub-filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                    All Discovered Businesses ({displayedDiscoverBusinesses.length} of {businesses.length})
                  </h2>
                  <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>
                    Shared pipeline of automated Lead Scout discoveries and manual scans with unified deduplication.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search name, city, domain..."
                      value={discoverSearch}
                      onChange={(e) => setDiscoverSearch(e.target.value)}
                      style={{
                        background: '#07070d',
                        border: '1px solid #2d2d42',
                        borderRadius: '6px',
                        color: '#ffffff',
                        padding: '6px 10px 6px 28px',
                        fontSize: '12px',
                        width: '200px',
                      }}
                    />
                    <Search size={13} style={{ position: 'absolute', left: '9px', top: '9px', color: '#6b7280' }} />
                  </div>

                  {/* Source Filters */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { id: 'all', label: 'All Sources' },
                      { id: 'automated', label: 'Automated 🤖' },
                      { id: 'manual', label: 'Manual 🔍' },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => setDiscoverSourceFilter(pill.id as any)}
                        style={{
                          background: discoverSourceFilter === pill.id ? 'rgba(255, 51, 102, 0.15)' : '#161622',
                          border: discoverSourceFilter === pill.id ? '1px solid #ff3366' : '1px solid #2d2d42',
                          color: discoverSourceFilter === pill.id ? '#ff3366' : '#d1d5db',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Qualification Filter */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { id: 'all', label: 'All Leads' },
                      { id: 'qualified', label: 'Qualified 🎯' },
                      { id: 'unqualified', label: 'No Contact 🚫' },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => setDiscoverQualFilter(pill.id as any)}
                        style={{
                          background: discoverQualFilter === pill.id ? 'rgba(0, 245, 160, 0.15)' : '#161622',
                          border: discoverQualFilter === pill.id ? '1px solid #00f5a0' : '1px solid #2d2d42',
                          color: discoverQualFilter === pill.id ? '#00f5a0' : '#d1d5db',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleDeduplicate}
                    disabled={isDeduplicating}
                    style={{
                      background: '#161626',
                      border: '1px solid #2d2d48',
                      color: '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: isDeduplicating ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Purge duplicate business records"
                  >
                    <RefreshCw size={11} className={isDeduplicating ? 'hpa-spin' : ''} />
                    <span>{isDeduplicating ? 'Purging...' : 'Purge Duplicates'}</span>
                  </button>
                </div>
              </div>

              {/* Bulk Action Bar */}
              {selectedBusinessIds.length > 0 && (
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
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#ffffff' }}>
                    <strong>{selectedBusinessIds.length}</strong> {selectedBusinessIds.length === 1 ? 'business' : 'businesses'} selected
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedBusinessIds([])}
                      style={{ background: '#161622', border: '1px solid #2d2d42', color: '#cbd5e1', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkDeleteBizOpen(true)}
                      style={{ background: '#ef4444', border: 'none', color: '#ffffff', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={13} />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              {displayedDiscoverBusinesses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: '13px' }}>
                  No businesses found matching current filters. Run a discovery scan or change filters.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1c1c2b', color: '#9ca3af' }}>
                        <th style={{ width: '36px', padding: '10px' }}>
                          <input
                            type="checkbox"
                            checked={allBizSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someBizSelected;
                            }}
                            onChange={handleSelectAllBiz}
                            style={{ cursor: 'pointer', accentColor: '#ff3366', width: '15px', height: '15px' }}
                          />
                        </th>
                        <th style={{ padding: '10px' }}>Business</th>
                        <th style={{ padding: '10px' }}>Contacts Discovered</th>
                        <th style={{ padding: '10px' }}>Qualification</th>
                        <th style={{ padding: '10px' }}>Best Channel</th>
                        <th style={{ padding: '10px' }}>Tech Audit</th>
                        <th style={{ padding: '10px' }}>Proposal</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedDiscoverBusinesses.map((b) => {
                        const evalInfo = getLeadEval(b);
                        const isSelected = selectedBusinessIds.includes(b.id);
                        const isAuto =
                          (b.metadata as any)?.discovery_source === 'automated' ||
                          (b.metadata as any)?.discovery_source === 'automated_daily_scout';
                        const existingDraft = scoutDrafts.find(
                          (d) =>
                            d.metadata?.businessId === b.id ||
                            (b.domain && d.metadata?.domain === b.domain)
                        );

                        return (
                          <tr
                            key={b.id}
                            style={{
                              borderBottom: '1px solid #161622',
                              background:
                                selectedBusiness?.id === b.id
                                  ? 'rgba(255, 51, 102, 0.08)'
                                  : isSelected
                                  ? 'rgba(255, 51, 102, 0.04)'
                                  : 'transparent',
                            }}
                          >
                            <td style={{ width: '36px', padding: '12px 10px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectBiz(b.id)}
                                style={{ cursor: 'pointer', accentColor: '#ff3366', width: '15px', height: '15px' }}
                              />
                            </td>

                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ fontWeight: 600, color: '#ffffff' }}>{b.name}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{b.city || b.country_code}</span>
                                <span>•</span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    background: isAuto ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                    color: isAuto ? '#c084fc' : '#38bdf8',
                                  }}
                                >
                                  {isAuto ? 'Automated Scout 🤖' : 'Manual Scan 🔍'}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '11px' }}>
                                {evalInfo.hasWebsite && (
                                  <a
                                    href={b.website_url || `https://${b.domain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      color: '#38bdf8',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    <span>Web</span>
                                    <ExternalLink size={9} />
                                  </a>
                                )}
                                {evalInfo.hasEmail && (
                                  <span
                                    style={{
                                      background: evalInfo.emailStatus === 'verified' ? 'rgba(0, 245, 160, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                                      color: evalInfo.emailStatus === 'verified' ? '#00f5a0' : '#fbbf24',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                    }}
                                    title={evalInfo.emailStatus === 'verified' ? 'Verified MX Email' : 'Public Discovered Email'}
                                  >
                                    Email ✉️
                                  </span>
                                )}
                                {evalInfo.hasPhone && (
                                  <a
                                    href={`tel:${evalInfo.phoneDigits}`}
                                    style={{
                                      background: 'rgba(156, 163, 175, 0.15)',
                                      color: '#d1d5db',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    Phone 📞
                                  </a>
                                )}
                                {evalInfo.isWhatsAppEligible && evalInfo.whatsappUrl && (
                                  <a
                                    href={evalInfo.whatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      background: 'rgba(37, 211, 102, 0.15)',
                                      color: '#25d366',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    <WhatsAppIcon size={10} />
                                    <span>WA</span>
                                  </a>
                                )}
                                {!evalInfo.hasWebsite && !evalInfo.hasEmail && !evalInfo.hasPhone && (
                                  <span style={{ color: '#ef4444', fontSize: '11px' }}>None</span>
                                )}
                              </div>
                            </td>

                            <td style={{ padding: '12px 10px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: evalInfo.isQualified ? 'rgba(0, 245, 160, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: evalInfo.isQualified ? '#00f5a0' : '#ef4444',
                                  border: `1px solid ${evalInfo.isQualified ? '#00f5a0' : '#ef4444'}`,
                                }}
                              >
                                {evalInfo.isQualified ? 'Qualified 🎯' : 'No Contact 🚫'}
                              </span>
                            </td>

                            <td style={{ padding: '12px 10px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background:
                                    evalInfo.bestChannel === 'whatsapp'
                                      ? 'rgba(37, 211, 102, 0.2)'
                                      : evalInfo.bestChannel === 'email'
                                      ? 'rgba(56, 189, 248, 0.2)'
                                      : 'rgba(107, 114, 128, 0.2)',
                                  color:
                                    evalInfo.bestChannel === 'whatsapp'
                                      ? '#25d366'
                                      : evalInfo.bestChannel === 'email'
                                      ? '#38bdf8'
                                      : '#9ca3af',
                                }}
                              >
                                {evalInfo.bestChannel.toUpperCase()}
                              </span>
                            </td>

                            <td style={{ padding: '12px 10px' }}>
                              <button
                                onClick={() => handleRunAudit(b.id)}
                                disabled={isAuditing}
                                style={{
                                  background: b.status === 'AUDITED' || b.status === 'ENRICHED' ? 'rgba(16, 185, 129, 0.15)' : '#161622',
                                  border: b.status === 'AUDITED' || b.status === 'ENRICHED' ? '1px solid #10b981' : '1px solid #2d2d42',
                                  color: b.status === 'AUDITED' || b.status === 'ENRICHED' ? '#10b981' : '#9ca3af',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: isAuditing ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Search size={11} />
                                <span>{b.status === 'AUDITED' || b.status === 'ENRICHED' ? 'Audited 🔍' : 'Run Audit'}</span>
                              </button>
                            </td>

                            <td style={{ padding: '12px 10px' }}>
                              {existingDraft ? (
                                <Link
                                  href="/admin/approvals"
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#ff3366',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                  title="View and authorize in central AI Approvals hub"
                                >
                                  <span>In Approvals</span>
                                  <ArrowRight size={11} />
                                </Link>
                              ) : (
                                <button
                                  onClick={() => handleGenerateAi(b.id)}
                                  disabled={isGeneratingAi}
                                  style={{
                                    background: 'rgba(255, 51, 102, 0.15)',
                                    border: '1px solid rgba(255, 51, 102, 0.3)',
                                    color: '#ff3366',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Sparkles size={11} />
                                  <span>AI Pitch</span>
                                </button>
                              )}
                            </td>

                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleOpenBusinessById(b.id)}
                                  style={{
                                    background: selectedBusiness?.id === b.id ? '#ff3366' : '#161622',
                                    border: selectedBusiness?.id === b.id ? '1px solid #ff3366' : '1px solid #2d2d42',
                                    color: '#ffffff',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Inspect & CRM
                                </button>
                                <button
                                  onClick={() => setDeletingBizId(b.id)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    padding: '5px 7px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                  }}
                                  title="Delete lead"
                                >
                                  <Trash2 size={12} />
                                </button>
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

            {/* Reusable CRM Drawer */}
            {renderBusinessDetailDrawer()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. QUALIFIED LEADS (CRM Pipeline & Deal Closing Workspace)               */}
      {/* ========================================================================= */}
      {activeTab === 'qualified' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selectedBusiness ? 'minmax(0, 1fr) 420px' : 'minmax(0, 1fr)',
            gap: '20px',
            minWidth: 0,
            width: '100%',
            alignItems: 'start',
          }}
        >
          <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Qualified Business Leads ({displayedQualifiedBusinesses.length} of {qualifiedBusinesses.length})
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>
                  Every lead here has at least one usable contact method (website, verified email, or phone/WhatsApp).
                </p>
              </div>

              {/* Deal Stage Pipeline Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: `All Qualified (${qualifiedBusinesses.length})` },
                  { id: 'DISCOVERED', label: `Fresh (${qualifiedBusinesses.filter((b) => b.status === 'DISCOVERED').length})` },
                  { id: 'ENRICHED', label: `Audited/Enriched (${qualifiedBusinesses.filter((b) => b.status === 'ENRICHED' || b.status === 'AUDITED').length})` },
                  { id: 'CONTACTED', label: `Contacted (${qualifiedBusinesses.filter((b) => b.status === 'CONTACTED').length})` },
                  { id: 'IN_DISCUSSION', label: `Talking (${qualifiedBusinesses.filter((b) => b.status === 'IN_DISCUSSION').length})` },
                  { id: 'CLOSED_WON', label: `Won 🎉 (${qualifiedBusinesses.filter((b) => b.status === 'CLOSED_WON').length})` },
                  { id: 'CLOSED_LOST', label: `Lost (${qualifiedBusinesses.filter((b) => b.status === 'CLOSED_LOST').length})` },
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
                    }}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {displayedQualifiedBusinesses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: '13px' }}>
                No qualified leads found for the selected pipeline stage.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1c1c2b', color: '#9ca3af' }}>
                      <th style={{ width: '36px', padding: '10px' }}>
                        <input
                          type="checkbox"
                          checked={allBizSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someBizSelected;
                          }}
                          onChange={handleSelectAllBiz}
                          style={{ cursor: 'pointer', accentColor: '#ff3366', width: '15px', height: '15px' }}
                        />
                      </th>
                      <th style={{ padding: '10px' }}>Business</th>
                      <th style={{ padding: '10px' }}>Location</th>
                      <th style={{ padding: '10px' }}>Category</th>
                      <th style={{ padding: '10px' }}>Direct Contact</th>
                      <th style={{ padding: '10px' }}>Stage</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedQualifiedBusinesses.map((b) => {
                      const evalInfo = getLeadEval(b);
                      const badge = getStatusBadgeStyle(b.status);
                      const isSelected = selectedBusinessIds.includes(b.id);

                      return (
                        <tr
                          key={b.id}
                          style={{
                            borderBottom: '1px solid #161622',
                            background:
                              selectedBusiness?.id === b.id
                                ? 'rgba(255, 51, 102, 0.08)'
                                : isSelected
                                ? 'rgba(255, 51, 102, 0.04)'
                                : 'transparent',
                          }}
                        >
                          <td style={{ width: '36px', padding: '12px 10px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectBiz(b.id)}
                              style={{ cursor: 'pointer', accentColor: '#ff3366', width: '15px', height: '15px' }}
                            />
                          </td>

                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{b.name}</div>
                            {b.website_url && (
                              <a
                                href={b.website_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                              >
                                <span>{b.domain || b.website_url}</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </td>

                          <td style={{ padding: '12px 10px', color: '#9ca3af' }}>{b.city || b.country_code}</td>
                          <td style={{ padding: '12px 10px', color: '#9ca3af' }}>{b.category}</td>

                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {evalInfo.hasPhone && (
                                <a
                                  href={`tel:${evalInfo.phoneDigits}`}
                                  style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}
                                >
                                  {evalInfo.phoneDigits}
                                </a>
                              )}
                              {evalInfo.isWhatsAppEligible && evalInfo.whatsappUrl && (
                                <a
                                  href={evalInfo.whatsappUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: 'rgba(37, 211, 102, 0.15)',
                                    color: '#25d366',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                  }}
                                >
                                  <WhatsAppIcon size={11} />
                                  <span>Chat</span>
                                </a>
                              )}
                            </div>
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
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                onClick={() => handleOpenBusinessById(b.id)}
                                style={{
                                  background: selectedBusiness?.id === b.id ? '#ff3366' : '#161622',
                                  border: selectedBusiness?.id === b.id ? '1px solid #ff3366' : '1px solid #2d2d42',
                                  color: '#ffffff',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                CRM
                              </button>
                              {b.status !== 'CLOSED_WON' && (
                                <button
                                  onClick={() => handleUpdateBusinessStatus(b.id, 'CLOSED_WON')}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid #10b981',
                                    color: '#10b981',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Won 🎉
                                </button>
                              )}
                              <button
                                onClick={() => setDeletingBizId(b.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#ef4444',
                                  padding: '5px 7px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
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

          {renderBusinessDetailDrawer()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SENT & FOLLOW-UPS (Outbound Dispatch Queue & Timeline)                 */}
      {/* ========================================================================= */}
      {activeTab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Outbound Queue & Dispatch Engine
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0 0' }}>
                  There are currently <strong>{queuedEmailCount}</strong> emails queued. When processed, each email undergoes live pre-send suppression checks and domain throttling.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={queueBatchSize}
                  onChange={(e) => setQueueBatchSize(Number(e.target.value))}
                  style={{
                    background: '#07070d',
                    border: '1px solid #2d2d42',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
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
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: queuedEmailCount > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isProcessingQueue ? <Loader2 size={14} className="hpa-spin" /> : <Send size={14} />}
                  <span>{isProcessingQueue ? 'Processing...' : 'Dispatch Queue Batch'}</span>
                </button>
              </div>
            </div>

            {/* Messages Queue Table */}
            {messages.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '20px 0 0 0' }}>
                No active queued messages. Approved messages from AI Approvals will appear here ready for scheduled dispatch.
              </p>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%', marginTop: '16px' }}>
                <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1c1c2b', color: '#9ca3af' }}>
                      <th style={{ padding: '10px' }}>Recipient</th>
                      <th style={{ padding: '10px' }}>Subject</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #161622' }}>
                        <td style={{ padding: '12px 10px', color: '#ffffff', fontWeight: 600 }}>
                          {m.recipient_email}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{m.subject}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background:
                                m.status === 'SENT' || m.status === 'DELIVERED'
                                  ? 'rgba(0, 245, 160, 0.15)'
                                  : m.status === 'BOUNCED'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(251, 191, 36, 0.15)',
                              color:
                                m.status === 'SENT' || m.status === 'DELIVERED'
                                  ? '#00f5a0'
                                  : m.status === 'BOUNCED'
                                  ? '#ef4444'
                                  : '#fbbf24',
                            }}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', color: '#6b7280', fontSize: '12px' }}>
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HISTORY & ANALYTICS (Discovery History, Telemetry, Safety Limits)      */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key Metric Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: metric.color }} />
                <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>{metric.label}</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '8px 0 4px 0' }}>
                  {metric.value}
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>{metric.sub}</span>
              </div>
            ))}
          </div>

          {/* Discovery Jobs History Table */}
          <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
              Discovery Scan History (Manual & Automated)
            </h3>
            {jobs.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>No discovery jobs recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {jobs.map((j) => (
                  <div
                    key={j.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#07070d',
                      border: '1px solid #161622',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>
                        {j.city || j.country_code}
                      </span>
                      <span style={{ color: '#9ca3af', marginLeft: '6px' }}>• {j.category}</span>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        Provider: {j.provider} • Mode:{' '}
                        {j.query === 'automated_daily_scout' ? 'Automated Daily Scout 🤖' : 'Manual Scan 🔍'}
                      </div>
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
                        +{j.total_inserted ?? 0} inserted • {j.total_duplicates ?? 0} duplicates
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety Settings & Rate Limits */}
          <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px', maxWidth: '700px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>Safety & Rate Limits</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Daily Sending Cap</label>
                <input
                  type="number"
                  value={settings.daily_send_cap}
                  disabled
                  style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Domain Hourly Throttle Cap</label>
                <input
                  type="number"
                  value={settings.domain_hourly_cap}
                  disabled
                  style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Physical CAN-SPAM Address</label>
                <input
                  type="text"
                  value={settings.physical_address}
                  disabled
                  style={{ width: '100%', background: '#07070d', border: '1px solid #2d2d42', color: '#ffffff', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modals */}
      <ConfirmModal
        isOpen={deletingBizId !== null}
        title="Delete Business Lead"
        message="Are you sure you want to delete this business record? All associated audit data, analyses, and queued outreach will be removed."
        confirmLabel="Yes, Delete Business"
        onConfirm={handleDeleteSingleBiz}
        onCancel={() => setDeletingBizId(null)}
        isLoading={deletingBizLoading}
      />

      <ConfirmModal
        isOpen={bulkDeleteBizOpen}
        title="Delete Selected Business Leads"
        message={`Are you sure you want to permanently delete these ${selectedBusinessIds.length} selected business records and their associated data? This action cannot be undone.`}
        confirmLabel={bulkDeleteBizLoading ? 'Deleting...' : `Delete ${selectedBusinessIds.length} Leads`}
        onConfirm={handleBulkDeleteBiz}
        onCancel={() => setBulkDeleteBizOpen(false)}
        isLoading={bulkDeleteBizLoading}
      />
    </div>
  );
}
