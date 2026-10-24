'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Phone,
  MessageSquare,
  Loader2,
  Inbox,
  X,
  Target,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
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
  const [activeTab, setActiveTab] = useState<
    | 'discover'
    | 'research'
    | 'qualified'
    | 'proposals'
    | 'pending_approval'
    | 'sent'
    | 'analytics'
    | 'discovery'
    | 'leads'
    | 'scout'
    | 'contacts'
    | 'queue'
    | 'compliance'
    | 'settings'
    | 'telemetry'
  >('discover');

  const currentView = (() => {
    if (activeTab === 'discovery' || activeTab === 'discover') return 'discover';
    if (activeTab === 'research') return 'research';
    if (activeTab === 'leads' || activeTab === 'contacts' || activeTab === 'qualified') return 'qualified';
    if (activeTab === 'scout' || activeTab === 'proposals') return 'proposals';
    if (activeTab === 'pending_approval') return 'pending_approval';
    if (activeTab === 'queue' || activeTab === 'sent') return 'sent';
    if (activeTab === 'telemetry' || activeTab === 'compliance' || activeTab === 'settings' || activeTab === 'analytics') return 'analytics';
    return 'discover';
  })();

  const [settings, setSettings] = useState<OutreachSettingsEntity>(initialSettings);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [businesses, setBusinesses] = useState<BusinessEntity[]>(initialBusinesses);
  const [jobs, setJobs] = useState<DiscoveryJobEntity[]>(initialJobs);
  const [contacts, setContacts] = useState<any[]>(initialContacts);
  const [messages, setMessages] = useState<any[]>(initialMessages);

  // Scout State
  const [scoutDrafts, setScoutDrafts] = useState<any[]>([]);
  const [loadingScoutDrafts, setLoadingScoutDrafts] = useState(false);
  const [isRunningScout, setIsRunningScout] = useState(false);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [selectedScoutDraft, setSelectedScoutDraft] = useState<any | null>(null);
  const [scoutFilter, setScoutFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

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

  // Business Selection & Deletion State
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [bulkDeleteBizOpen, setBulkDeleteBizOpen] = useState(false);
  const [bulkDeleteBizLoading, setBulkDeleteBizLoading] = useState(false);
  const [deletingBizId, setDeletingBizId] = useState<string | null>(null);
  const [deletingBizLoading, setDeletingBizLoading] = useState(false);

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

  const getWhatsAppUrl = (phone?: string | null, businessName?: string) => {
    if (!phone) return null;
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 8) return null;
    if (/^(1?(800|888|877|866|855|844|833)|1800|44(800|808|845|844|870)|0800|0808)/.test(digits)) return null;
    const greeting = encodeURIComponent(
      `Hello ${businessName ? businessName + ' team' : 'there'}! 👋 I came across your website. I'm Prince from HeyPrince (https://heyprince.in). We analyzed your website and identified high-impact opportunities to improve your online presence and customer bookings. Would you be open to a quick chat?`
    );
    return `https://wa.me/${digits}?text=${greeting}`;
  };

  // Check if a phone number is eligible for WhatsApp vs standard phone only (e.g. landline/toll-free)
  const isWhatsAppEligible = (phone?: string | null, whatsappUrl?: string | null): boolean => {
    if (whatsappUrl) return true;
    if (!phone) return false;
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 8) return false;
    // Toll-free prefixes (US 800, 888, 877, 866, 855, 844, 833; UK 0800, 0808; India 1800) are landlines
    if (/^(1?(800|888|877|866|855|844|833)|1800|44(800|808|845|844|870)|0800|0808)/.test(digits)) {
      return false;
    }
    return true;
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
        showToast(`CRM Record loaded: ${data.business.name}`, 'success');
      } else {
        showToast(data.error || `Could not load business record`, 'error');
      }
    } catch {
      showToast('Error fetching business intelligence record', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSelectBusiness = async (b: BusinessEntity) => {
    return handleOpenBusinessById(b.id, b.name);
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
      showToast(`Successfully deleted ${selectedBusinessIds.length} business lead${selectedBusinessIds.length > 1 ? 's' : ''}.`, 'success');
      setSelectedBusinessIds([]);
      setBulkDeleteBizOpen(false);
    } catch {
      showToast('Error deleting selected businesses.', 'error');
    } finally {
      setBulkDeleteBizLoading(false);
    }
  };

  const filteredBusinesses = businesses
    .filter((b) => pipelineFilter === 'ALL' || b.status === pipelineFilter)
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

  const allBizSelected =
    filteredBusinesses.length > 0 &&
    filteredBusinesses.every((b) => selectedBusinessIds.includes(b.id));
  const someBizSelected =
    filteredBusinesses.some((b) => selectedBusinessIds.includes(b.id)) && !allBizSelected;

  const handleSelectAllBiz = () => {
    if (allBizSelected) {
      setSelectedBusinessIds([]);
    } else {
      setSelectedBusinessIds(filteredBusinesses.map((b) => b.id));
    }
  };

  const handleToggleSelectBiz = (id: string) => {
    setSelectedBusinessIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Trigger Website Audit & Deep Multi-Page Crawl
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
          `Deep audit complete! Crawled ${pagesCrawled} pages. Discovered ${emailsFound} emails & ${phonesFound} phones/WhatsApp.`,
          'success'
        );
        // Refresh businesses list with newly discovered phone/metadata
        if (data.business) {
          setBusinesses((prev) =>
            prev.map((biz) => (biz.id === businessId ? { ...biz, ...data.business } : biz))
          );
        }
        // Refresh contacts list
        fetch('/api/admin/outreach/contacts')
          .then((r) => r.json())
          .then((cData) => {
            if (cData.contacts) setContacts(cData.contacts);
          })
          .catch(() => {});
        // Refresh detail drawer
        if (selectedBusiness) {
          handleSelectBusiness(data.business || selectedBusiness);
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

  // Scout Data Loader & Handlers
  const loadScoutDrafts = async () => {
    setLoadingScoutDrafts(true);
    try {
      const res = await fetch('/api/admin/outreach/scout');
      const data = await res.json();
      if (data.success && Array.isArray(data.drafts)) {
        setScoutDrafts(data.drafts);
      }
    } catch {
      console.warn('Failed to load scout drafts');
    } finally {
      setLoadingScoutDrafts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'scout' && scoutDrafts.length === 0) {
      loadScoutDrafts();
    }
  }, [activeTab]);

  const handleRunScout = async () => {
    setIsRunningScout(true);
    try {
      const res = await fetch('/api/admin/outreach/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_scout' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Lead Scout discovery completed.', 'success');
        await loadScoutDrafts();
        const bRes = await fetch('/api/admin/outreach/businesses?limit=25');
        const bData = await bRes.json();
        if (bData.items) setBusinesses(bData.items);
      } else {
        showToast(data.error || 'Failed to run Lead Scout', 'error');
      }
    } catch {
      showToast('Network error while running Lead Scout', 'error');
    } finally {
      setIsRunningScout(false);
    }
  };

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
        showToast(data.message || `Deduplication complete. Removed ${data.duplicatesRemoved || 0} duplicate records.`, 'success');
        const bRes = await fetch('/api/admin/outreach/businesses?limit=25');
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

  const handleApproveScoutDraft = async (draftId: string) => {
    try {
      const res = await fetch('/api/admin/chief-of-staff/approve-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Proposal approved and staged for outreach!', 'success');
        setScoutDrafts((prev) =>
          prev.map((d) => (d.id === draftId ? { ...d, status: 'approved' } : d))
        );
        if (selectedScoutDraft && selectedScoutDraft.id === draftId) {
          setSelectedScoutDraft((prev: any) => (prev ? { ...prev, status: 'approved' } : null));
        }
      } else {
        showToast(data.error || 'Failed to approve proposal', 'error');
      }
    } catch {
      showToast('Network error while approving proposal', 'error');
    }
  };

  const handleRejectScoutDraft = async (draftId: string) => {
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draftId, sourceType: 'outreach', action: 'reject' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Proposal rejected and archived.', 'info');
        setScoutDrafts((prev) =>
          prev.map((d) => (d.id === draftId ? { ...d, status: 'rejected' } : d))
        );
        if (selectedScoutDraft && selectedScoutDraft.id === draftId) {
          setSelectedScoutDraft((prev: any) => (prev ? { ...prev, status: 'rejected' } : null));
        }
      } else {
        showToast(data.error || 'Failed to reject proposal', 'error');
      }
    } catch {
      showToast('Network error while rejecting proposal', 'error');
    }
  };

  const handleApproveAndSendFromOutreach = async (draftId: string) => {
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          sourceType: 'outreach',
          action: 'approve_and_send_outreach',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Client outreach email dispatched successfully with send-lock protection!', 'success');
        setScoutDrafts((prev) =>
          prev.map((d) => (d.id === draftId ? { ...d, status: 'approved' } : d))
        );
        await loadScoutDrafts();
      } else {
        showToast(data.error || 'Failed to dispatch proposal', 'error');
      }
    } catch {
      showToast('Network error while dispatching proposal', 'error');
    }
  };

  const handleSaveForLaterFromOutreach = async (draftId: string) => {
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          sourceType: 'outreach',
          action: 'save_for_later',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Proposal saved for later review.', 'info');
        await loadScoutDrafts();
      } else {
        showToast(data.error || 'Failed to save for later', 'error');
      }
    } catch {
      showToast('Network error saving proposal for later', 'error');
    }
  };

  // Reusable CRM & Business Intelligence Drawer
  const renderBusinessDetailDrawer = () => {
    if (!selectedBusiness) return null;
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isAuditing && <Loader2 size={13} className="hpa-spin" />}
                  <span>{isAuditing ? 'Auditing & Crawling Pages...' : 'Deep Audit & Crawl Pages'}</span>
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
                  {isGeneratingAi ? <Loader2 size={14} className="hpa-spin" /> : <Sparkles size={14} />}
                  <span>{isGeneratingAi ? 'Analyzing...' : 'Generate AI Draft'}</span>
                </button>
              </div>

              {isLoadingDetail ? (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading intelligence data...</p>
              ) : businessDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                  {/* Direct Outreach Channels (Phone & WhatsApp) */}
                  {(() => {
                    const phone = (businessDetail.business?.metadata as any)?.phone || (selectedBusiness.metadata as any)?.phone;
                    const phones = (businessDetail.business?.metadata as any)?.phones || (selectedBusiness.metadata as any)?.phones || [];
                    const whatsappUrl = (businessDetail.business?.metadata as any)?.whatsapp_url || getWhatsAppUrl(phone, selectedBusiness.name);
                    const isWa = isWhatsAppEligible(phone, (businessDetail.business?.metadata as any)?.whatsapp_url);
                    const crawledPages = (businessDetail.business?.metadata as any)?.crawled_pages || (selectedBusiness.metadata as any)?.crawled_pages || [];

                    return (
                      <div style={{ background: '#161622', border: '1px solid #2d2d42', borderRadius: '8px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isWa ? <WhatsAppIcon size={15} /> : <Phone size={14} />} Direct Outreach {isWa ? '(WhatsApp & Phone)' : '(Phone / Landline)'}
                          </span>
                          {crawledPages.length > 0 && (
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                              Crawled {crawledPages.length} {crawledPages.length === 1 ? 'page' : 'pages'}
                            </span>
                          )}
                        </div>

                        {phone ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Phone: </span>
                                <a href={`tel:${phone}`} style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}>
                                  {phone}
                                </a>
                              </div>
                              {isWa && whatsappUrl ? (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open WhatsApp chat with pre-filled pitch"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#25d366',
                                    color: '#ffffff',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                  }}
                                >
                                  <WhatsAppIcon size={14} /> Chat &amp; Pitch
                                </a>
                              ) : (
                                <a
                                  href={`tel:${phone}`}
                                  title={`Call ${phone}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(56, 189, 248, 0.15)',
                                    border: '1px solid rgba(56, 189, 248, 0.4)',
                                    color: '#38bdf8',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                  }}
                                >
                                  <Phone size={13} /> Call Direct
                                </a>
                              )}
                            </div>
                            {phones.length > 1 && (
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                Additional numbers: {phones.filter((p: string) => p !== phone).join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p style={{ color: '#9ca3af', margin: '0 0 8px 0', fontSize: '12px' }}>
                              No phone found yet. Click &quot;Deep Audit &amp; Crawl Pages&quot; to crawl subpages (/contact, /about) and auto-extract phone numbers and WhatsApp links.
                            </p>
                          </div>
                        )}

                        {crawledPages.length > 0 && (
                          <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                            Crawled routes: {crawledPages.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Verified Contacts */}
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#ff3366' }}>
                      Contacts ({businessDetail.contacts?.length || 0})
                    </h4>
                    {businessDetail.contacts?.length > 0 ? (
                      businessDetail.contacts.map((c: any) => (
                        <div key={c.id} style={{ background: '#07070d', border: '1px solid #1c1c2b', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{c.email}</div>
                            <span style={{ fontSize: '11px', color: c.verification_status === 'VALID' ? '#00f5a0' : '#f59e0b' }}>
                              Status: {c.verification_status}
                            </span>
                          </div>
                          {c.phone && (() => {
                            const isWa = isWhatsAppEligible(c.phone);
                            const waUrl = getWhatsAppUrl(c.phone, selectedBusiness.name);
                            return (
                              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                                <a href={`tel:${c.phone}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                                  {c.phone}
                                </a>
                                {isWa && waUrl ? (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open WhatsApp chat"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '20px',
                                      height: '20px',
                                      background: 'rgba(37, 211, 102, 0.15)',
                                      border: '1px solid rgba(37, 211, 102, 0.4)',
                                      color: '#25d366',
                                      borderRadius: '50%',
                                      textDecoration: 'none',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <WhatsAppIcon size={11} />
                                  </a>
                                ) : (
                                  <a
                                    href={`tel:${c.phone}`}
                                    title={`Call ${c.phone}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '20px',
                                      height: '20px',
                                      background: 'rgba(56, 189, 248, 0.12)',
                                      border: '1px solid rgba(56, 189, 248, 0.35)',
                                      color: '#38bdf8',
                                      borderRadius: '50%',
                                      textDecoration: 'none',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Phone size={10} />
                                  </a>
                                )}
                              </div>
                            );
                          })()}
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
    );
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Unified Lead Ecosystem Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid #1c1c2b',
          borderRadius: '12px',
          padding: '8px 14px',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Lead Ecosystem:
          </span>
          <Link
            href="/admin/leads"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#12121c',
              border: '1px solid #232338',
              color: '#9ca3af',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <Inbox size={13} />
            <span>📥 Inbound Inquiries (Website)</span>
          </Link>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(255, 51, 102, 0.18), rgba(225, 29, 72, 0.08))',
              border: '1px solid rgba(255, 51, 102, 0.4)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <Sparkles size={13} color="#ff3366" />
            <span>🚀 Outbound & AI Lead Scout (Active)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleDeduplicate}
            disabled={isDeduplicating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#161626',
              border: '1px solid #2d2d48',
              color: '#d1d5db',
              fontSize: '12px',
              fontWeight: 500,
              cursor: isDeduplicating ? 'not-allowed' : 'pointer',
            }}
            title="Scan database and remove duplicate business records"
          >
            <RefreshCw size={12} className={isDeduplicating ? 'hpa-spin' : ''} />
            <span>{isDeduplicating ? 'Purging...' : 'Purge Duplicates'}</span>
          </button>
        </div>
      </div>

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
          { key: 'discover', label: '1. Discover Leads', icon: Globe },
          {
            key: 'research',
            label: `2. Research Queue (${jobs.filter((j) => j.status === 'RUNNING' || j.status === 'PENDING').length + businesses.filter((b) => b.status === 'DISCOVERED').length})`,
            icon: Clock,
          },
          {
            key: 'qualified',
            label: `3. Qualified Leads (${businesses.filter((b) => b.status !== 'DISQUALIFIED' && b.status !== 'DISCOVERED').length || totalBusinesses})`,
            icon: Target,
          },
          {
            key: 'proposals',
            label: `4. Proposals & Outreach (${scoutDrafts.length})`,
            icon: Sparkles,
          },
          {
            key: 'pending_approval',
            label: `5. Pending Approval (${scoutDrafts.filter((d) => d.status === 'pending' || !d.status).length})`,
            icon: CheckCircle2,
          },
          {
            key: 'sent',
            label: `6. Sent & Follow-ups (${analytics.sentEmails + queuedEmailCount})`,
            icon: Send,
          },
          { key: 'analytics', label: '7. History & Analytics', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.key;
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

      {/* VIEW 7: HISTORY & ANALYTICS */}
      {(currentView === 'analytics' || activeTab === 'telemetry') && (
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
                  {isProcessingQueue ? <Loader2 size={15} className="hpa-spin" /> : <Send size={15} />}
                  <span>{isProcessingQueue ? 'Processing...' : 'Dispatch Queue Batch'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: DISCOVER LEADS */}
      {(currentView === 'discover' || activeTab === 'discovery') && (
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
                {isDiscovering ? <Loader2 size={16} className="hpa-spin" /> : <Globe size={16} />}
                <span>{isDiscovering ? 'Scanning & Deduplicating...' : 'Launch Discovery Scan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 2: RESEARCH QUEUE */}
      {currentView === 'research' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(14, 14, 22, 0.95))',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    display: 'flex',
                  }}
                >
                  <Clock size={20} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Prospect Research & Technical Investigation Queue
                </h2>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '8px 0 0 0', maxWidth: '780px', lineHeight: 1.6 }}>
                Active discovery jobs and freshly discovered prospects undergoing website crawling, technical audits, performance benchmarks, and contact discovery.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setActiveTab('discover')}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={15} />
                <span>Start New Discovery</span>
              </button>
            </div>
          </div>

          {/* Research Metric Counters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>
                Active Discovery Jobs
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
                {jobs.filter((j) => j.status === 'RUNNING' || j.status === 'PENDING').length}
              </div>
            </div>

            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase' }}>
                Fresh / In-Investigation
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', marginTop: '6px' }}>
                {businesses.filter((b) => b.status === 'DISCOVERED').length}
              </div>
            </div>

            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>
                Audited & Verified
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                {businesses.filter((b) => b.status === 'AUDITED').length}
              </div>
            </div>
          </div>

          {/* Active Jobs Table */}
          {jobs.length > 0 && (
            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                Discovery Background Tasks
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {jobs.slice(0, 5).map((j) => (
                  <div
                    key={j.id}
                    style={{
                      background: '#12121a',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '13px' }}>{j.provider.toUpperCase()} Scan:</strong>{' '}
                      <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                        {j.city}, {j.country_code} ({j.category})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background:
                            j.status === 'COMPLETED'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : j.status === 'RUNNING'
                              ? 'rgba(56, 189, 248, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                          color:
                            j.status === 'COMPLETED' ? '#10b981' : j.status === 'RUNNING' ? '#38bdf8' : '#ef4444',
                        }}
                      >
                        {j.status}
                      </span>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {j.total_inserted ?? j.total_found ?? 0} discovered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prospects in Queue List */}
          <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
              Prospects Ready for Technical Investigation
            </h3>

            {businesses.filter((b) => b.status === 'DISCOVERED').length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                No fresh un-investigated prospects. Run a discovery scan or check Qualified Leads.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {businesses
                  .filter((b) => b.status === 'DISCOVERED')
                  .slice(0, 12)
                  .map((b) => (
                    <div
                      key={b.id}
                      style={{
                        background: '#12121a',
                        border: '1px solid #1c1c2b',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{b.name}</h4>
                          <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            Fresh 📍
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          {b.category} • {b.city || b.country_code}
                        </div>
                        {b.website_url && (
                          <a
                            href={b.website_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#38bdf8', textDecoration: 'none', marginTop: '4px' }}
                          >
                            <span>{b.domain || b.website_url}</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleRunAudit(b.id)}
                          disabled={isAuditing}
                          style={{
                            flex: 1,
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <Search size={12} />
                          <span>Run Audit</span>
                        </button>

                        <button
                          onClick={() => handleGenerateAi(b.id)}
                          disabled={isGeneratingAi}
                          style={{
                            flex: 1,
                            background: 'rgba(168, 85, 247, 0.12)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            color: '#c084fc',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <Sparkles size={12} />
                          <span>AI Pitch</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: QUALIFIED LEADS */}
      {(currentView === 'qualified' || activeTab === 'leads') && (
        <div
          className="hpa-leads-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: selectedBusiness ? 'minmax(0, 1fr) 420px' : 'minmax(0, 1fr)',
            gap: '20px',
            minWidth: 0,
            width: '100%',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              background: '#0e0e16',
              border: '1px solid #1c1c2b',
              borderRadius: '12px',
              padding: '20px',
              minWidth: 0,
              overflow: 'hidden',
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

              {/* Status / Pipeline Filters & Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    gap: '5px',
                    whiteSpace: 'nowrap',
                  }}
                  title="Purge duplicate business records"
                >
                  <RefreshCw size={11} className={isDeduplicating ? 'hpa-spin' : ''} />
                  <span>{isDeduplicating ? 'Purging...' : 'Purge Duplicates'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('scout')}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 51, 102, 0.15), rgba(225, 29, 72, 0.05))',
                    border: '1px solid rgba(255, 51, 102, 0.35)',
                    color: '#ff3366',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Sparkles size={11} />
                  <span>⚡ View Scout Proposals</span>
                </button>
              </div>
            </div>

            {/* Bulk Action Floating Bar */}
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
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{selectedBusinessIds.length}</strong> {selectedBusinessIds.length === 1 ? 'business' : 'businesses'} selected
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedBusinessIds([])}
                    style={{
                      background: '#161622',
                      border: '1px solid #2d2d42',
                      color: '#cbd5e1',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteBizOpen(true)}
                    style={{
                      background: '#ef4444',
                      border: '1px solid #ef4444',
                      color: '#ffffff',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Selected ({selectedBusinessIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {businesses.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>No businesses in database yet. Run a discovery scan above!</p>
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
                          title="Select All"
                        />
                      </th>
                      <th style={{ padding: '10px' }}>Business</th>
                      <th style={{ padding: '10px' }}>Location</th>
                      <th style={{ padding: '10px' }}>Category</th>
                      <th style={{ padding: '10px' }}>Website</th>
                      <th style={{ padding: '10px' }}>Lead Stage</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.map((b) => {
                      const badge = getStatusBadgeStyle(b.status);
                      const isSelected = selectedBusinessIds.includes(b.id);
                      return (
                        <tr
                          key={b.id}
                          style={{
                            borderBottom: '1px solid #161622',
                            background: selectedBusiness?.id === b.id ? 'rgba(255, 51, 102, 0.08)' : isSelected ? 'rgba(255, 51, 102, 0.04)' : 'transparent',
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
                          <td style={{ padding: '12px 10px', fontWeight: 600, color: '#ffffff' }}>
                              <div>{b.name}</div>
                              {(() => {
                                const phone = (b.metadata as any)?.phone;
                                const waUrl = (b.metadata as any)?.whatsapp_url || getWhatsAppUrl(phone, b.name);
                                const isWa = isWhatsAppEligible(phone, (b.metadata as any)?.whatsapp_url);

                                if (!phone && !waUrl) return null;

                                return (
                                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 500 }}>
                                    {phone && (
                                      <a
                                        href={`tel:${phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        title={`Call ${phone}`}
                                        style={{ color: '#9ca3af', textDecoration: 'none' }}
                                      >
                                        {phone}
                                      </a>
                                    )}
                                    {isWa && waUrl ? (
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Open WhatsApp chat"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '22px',
                                          height: '22px',
                                          background: 'rgba(37, 211, 102, 0.15)',
                                          border: '1px solid rgba(37, 211, 102, 0.4)',
                                          color: '#25d366',
                                          borderRadius: '50%',
                                          textDecoration: 'none',
                                          flexShrink: 0,
                                        }}
                                      >
                                        <WhatsAppIcon size={12} />
                                      </a>
                                    ) : phone ? (
                                      <a
                                        href={`tel:${phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        title={`Call landline / toll-free: ${phone}`}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '22px',
                                          height: '22px',
                                          background: 'rgba(56, 189, 248, 0.12)',
                                          border: '1px solid rgba(56, 189, 248, 0.35)',
                                          color: '#38bdf8',
                                          borderRadius: '50%',
                                          textDecoration: 'none',
                                          flexShrink: 0,
                                        }}
                                      >
                                        <Phone size={11} />
                                      </a>
                                    ) : null}
                                  </div>
                                );
                              })()}
                            </td>
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
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingBizId(b.id);
                                  }}
                                  title="Delete Lead"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Trash2 size={13} />
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

          {/* Drawer: Selected Business Detail & AI Analysis */}
          {renderBusinessDetailDrawer()}
        </div>
      )}

      {/* VIEW 4: PROPOSALS & OUTREACH */}
      {(currentView === 'proposals' || activeTab === 'scout') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hero / Header Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 51, 102, 0.08), rgba(14, 14, 22, 0.95))',
              border: '1px solid rgba(255, 51, 102, 0.25)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: 'rgba(255, 51, 102, 0.2)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#ff3366',
                    display: 'flex',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Autonomous Lead Intelligence Scout
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  AI Chief of Staff Engine
                </span>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '8px 0 0 0', maxWidth: '780px', lineHeight: 1.6 }}>
                The Lead Scout autonomously scours global directories, analyzes prospect websites, scores commercial fit, identifies high-value development or modernization pain points, and drafts high-conversion outreach proposals.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleRunScout}
                disabled={isRunningScout}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isRunningScout ? 'not-allowed' : 'pointer',
                  opacity: isRunningScout ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(255, 51, 102, 0.25)',
                }}
              >
                {isRunningScout ? <Loader2 size={16} className="hpa-spin" /> : <Sparkles size={16} />}
                <span>{isRunningScout ? 'Scouting Leads...' : 'Run Lead Scout AI'}</span>
              </button>

              <button
                onClick={handleDeduplicate}
                disabled={isDeduplicating}
                style={{
                  background: '#161626',
                  color: '#e2e8f0',
                  border: '1px solid #2d2d48',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isDeduplicating ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={14} className={isDeduplicating ? 'hpa-spin' : ''} />
                <span>{isDeduplicating ? 'Purging...' : 'Clean Duplicates'}</span>
              </button>

              <button
                onClick={loadScoutDrafts}
                disabled={loadingScoutDrafts}
                style={{
                  background: '#12121a',
                  color: '#9ca3af',
                  border: '1px solid #1c1c2b',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontWeight: 500,
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                title="Refresh Proposals"
              >
                <RefreshCw size={14} className={loadingScoutDrafts ? 'hpa-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Scout Metric Counters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>
                Total Scout Proposals
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
                {scoutDrafts.length}
              </div>
            </div>

            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase' }}>
                Pending Review
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', marginTop: '6px' }}>
                {scoutDrafts.filter((d) => d.status === 'pending').length}
              </div>
            </div>

            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>
                Approved & Staged
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                {scoutDrafts.filter((d) => d.status === 'approved').length}
              </div>
            </div>

            <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#c084fc', textTransform: 'uppercase' }}>
                High-Fit Prospects (≥80)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc', marginTop: '6px' }}>
                {scoutDrafts.filter((d) => (d.metadata?.fitScore || 0) >= 80).length}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '1px solid #1c1c2b', paddingBottom: '12px' }}>
            {[
              { id: 'all', label: `All Proposals (${scoutDrafts.length})` },
              { id: 'pending', label: `Pending Review (${scoutDrafts.filter((d) => d.status === 'pending').length})` },
              { id: 'approved', label: `Approved (${scoutDrafts.filter((d) => d.status === 'approved').length})` },
              { id: 'rejected', label: `Archived (${scoutDrafts.filter((d) => d.status === 'rejected').length})` },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setScoutFilter(pill.id as any)}
                style={{
                  background: scoutFilter === pill.id ? 'rgba(255, 51, 102, 0.15)' : '#12121a',
                  border: scoutFilter === pill.id ? '1px solid #ff3366' : '1px solid #1c1c2b',
                  color: scoutFilter === pill.id ? '#ff3366' : '#9ca3af',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: scoutFilter === pill.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Proposals List */}
          {loadingScoutDrafts ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <Loader2 size={32} className="hpa-spin" style={{ margin: '0 auto 12px auto', color: '#ff3366' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Loading scout proposals from Chief of Staff brain...</p>
            </div>
          ) : scoutDrafts.filter((d) => scoutFilter === 'all' || d.status === scoutFilter).length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#0e0e16',
                border: '1px dashed #2d2d42',
                borderRadius: '12px',
                color: '#9ca3af',
              }}
            >
              <Sparkles size={36} style={{ color: '#ff3366', margin: '0 auto 12px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
                No scout proposals match the current filter
              </h3>
              <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>
                Trigger the Lead Scout to scan businesses and draft value-first outreach propositions.
              </p>
              <button
                onClick={handleRunScout}
                disabled={isRunningScout}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: isRunningScout ? 'not-allowed' : 'pointer',
                }}
              >
                {isRunningScout ? 'Running Scout...' : 'Launch Lead Scout Now'}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '16px',
              }}
            >
              {scoutDrafts
                .filter((d) => scoutFilter === 'all' || d.status === scoutFilter)
                .map((draft) => {
                  const meta = draft.metadata || {};
                  const fitScore = meta.fitScore || 85;
                  const companyName = meta.companyName || draft.title || 'Prospective Business';
                  const domain = meta.domain || '';
                  const status = draft.status || 'pending';

                  return (
                    <div
                      key={draft.id}
                      style={{
                        background: '#0e0e16',
                        border: status === 'approved'
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid #1c1c2b',
                        borderRadius: '12px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        position: 'relative',
                      }}
                    >
                      {/* Card Header */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                              {companyName}
                            </h3>
                            {domain && (
                              <a
                                href={domain.startsWith('http') ? domain : `https://${domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#38bdf8',
                                  fontSize: '12px',
                                  textDecoration: 'none',
                                  marginTop: '3px',
                                }}
                              >
                                <span>{domain.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '100px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: fitScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: fitScore >= 80 ? '#10b981' : '#f59e0b',
                              border: `1px solid ${fitScore >= 80 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            }}
                          >
                            <Target size={11} />
                            <span>{fitScore}% Fit</span>
                          </div>
                        </div>

                        {/* Meta Tags */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                          {meta.industry && (
                            <span
                              style={{
                                fontSize: '10px',
                                background: '#161622',
                                color: '#9ca3af',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid #232338',
                              }}
                            >
                              {meta.industry}
                            </span>
                          )}
                          {meta.country && (
                            <span
                              style={{
                                fontSize: '10px',
                                background: '#161622',
                                color: '#9ca3af',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid #232338',
                              }}
                            >
                              📍 {meta.country}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                              color: status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#fbbf24',
                              fontWeight: 600,
                            }}
                          >
                            {status === 'approved' ? 'Approved ✓' : status === 'rejected' ? 'Archived ✕' : 'Pending Review ⏳'}
                          </span>
                        </div>

                        {/* Value Prop & Identified Pain Point */}
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#ff3366', marginBottom: '4px' }}>
                            Identified Opportunity:
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#d1d5db', lineHeight: 1.5 }}>
                            {meta.identifiedOpportunity || draft.excerpt || 'Technical modernization and high-performance web upgrade.'}
                          </p>
                        </div>

                        {/* Proposed Pitch Excerpt */}
                        <div style={{ marginTop: '10px', background: '#07070d', borderRadius: '6px', padding: '10px', border: '1px solid #161624' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
                            Pitch Preview:
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {meta.suggestedPitch || draft.content || 'Hi team, we analyzed your platform and identified opportunities to accelerate speed and conversion...'}
                          </p>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #1c1c2b' }}>
                        <button
                          onClick={() => setSelectedScoutDraft(draft)}
                          style={{
                            background: '#161626',
                            border: '1px solid #2d2d48',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FileText size={12} />
                          <span>View Full Pitch</span>
                        </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRejectScoutDraft(draft.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#ef4444',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                title="Reject proposal"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApproveScoutDraft(draft.id)}
                                style={{
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  border: 'none',
                                  color: '#ffffff',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <CheckCircle2 size={12} />
                                <span>Approve</span>
                              </button>
                            </>
                          )}
                          {status === 'approved' && (
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} />
                              Ready for Dispatch
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Full Proposal Modal */}
          {selectedScoutDraft && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              onClick={() => setSelectedScoutDraft(null)}
            >
              <div
                style={{
                  background: '#0e0e16',
                  border: '1px solid #2d2d42',
                  borderRadius: '16px',
                  maxWidth: '680px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '24px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                      {selectedScoutDraft.metadata?.companyName || selectedScoutDraft.title}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                      Commercial Fit Score: {selectedScoutDraft.metadata?.fitScore || 85}% • Status: {selectedScoutDraft.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedScoutDraft(null)}
                    style={{
                      background: '#1c1c2b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#9ca3af',
                      padding: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff3366', textTransform: 'uppercase' }}>
                      Identified Opportunity:
                    </span>
                    <p style={{ margin: '4px 0 0 0', color: '#e2e8f0', background: '#07070d', padding: '10px', borderRadius: '8px', border: '1px solid #1c1c2b' }}>
                      {selectedScoutDraft.metadata?.identifiedOpportunity || selectedScoutDraft.excerpt}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                      Proposed Subject Line:
                    </span>
                    <p style={{ margin: '4px 0 0 0', color: '#ffffff', fontWeight: 600, background: '#07070d', padding: '10px', borderRadius: '8px', border: '1px solid #1c1c2b' }}>
                      {selectedScoutDraft.metadata?.suggestedSubject || selectedScoutDraft.title}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
                      Complete Outreach Pitch:
                    </span>
                    <div
                      style={{
                        margin: '4px 0 0 0',
                        color: '#d1d5db',
                        background: '#07070d',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #1c1c2b',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        fontFamily: 'inherit',
                      }}
                    >
                      {selectedScoutDraft.content || selectedScoutDraft.metadata?.suggestedPitch}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1c1c2b' }}>
                  <button
                    onClick={() => setSelectedScoutDraft(null)}
                    style={{
                      background: '#161622',
                      border: '1px solid #2d2d42',
                      color: '#9ca3af',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                  {selectedScoutDraft.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleRejectScoutDraft(selectedScoutDraft.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#ef4444',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveScoutDraft(selectedScoutDraft.id)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '8px 20px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Approve Proposal
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: PENDING APPROVAL */}
      {currentView === 'pending_approval' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Callout linking to central Approvals */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(14, 14, 22, 0.95))',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: 'rgba(168, 85, 247, 0.2)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#c084fc',
                    display: 'flex',
                  }}
                >
                  <CheckCircle2 size={20} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Proposals Awaiting Explicit Approval
                </h2>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '8px 0 0 0', maxWidth: '780px', lineHeight: 1.6 }}>
                Every cold outreach email and project proposal requires your explicit human authorization before dispatch. Sending acquires an atomic lock to guarantee zero duplicate emails.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href="/admin/approvals?filter=outreach"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                }}
              >
                <Sparkles size={15} />
                <span>Open in AI Approvals Hub</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Pending Proposals Cards */}
          {loadingScoutDrafts ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <Loader2 size={32} className="hpa-spin" style={{ margin: '0 auto 12px', color: '#c084fc' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Loading pending proposals...</p>
            </div>
          ) : scoutDrafts.filter((d) => d.status === 'pending' || !d.status).length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#0e0e16',
                border: '1px dashed #2d2d42',
                borderRadius: '12px',
                color: '#9ca3af',
              }}
            >
              <CheckCircle2 size={40} style={{ color: '#10b981', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
                All Lead Proposals Reviewed
              </h3>
              <p style={{ fontSize: '13px', margin: 0 }}>
                No pending proposals awaiting decision. New discoveries from Lead Scout will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
              {scoutDrafts
                .filter((d) => d.status === 'pending' || !d.status)
                .map((draft) => {
                  const meta = draft.metadata || {};
                  const fitScore = meta.fitScore || 85;
                  const companyName = meta.companyName || draft.title || 'Prospective Business';
                  const domain = meta.domain || '';

                  return (
                    <div
                      key={draft.id}
                      style={{
                        background: '#0e0e16',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '12px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                              {companyName}
                            </h4>
                            {domain && (
                              <a
                                href={`https://${domain.replace(/^https?:\/\//, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#38bdf8', textDecoration: 'none', marginTop: '2px' }}
                              >
                                <span>{domain}</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            Fit: {fitScore}/100
                          </span>
                        </div>

                        {meta.contactEmail && (
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                            <strong style={{ color: '#cbd5e1' }}>Contact:</strong> {meta.contactEmail}
                          </div>
                        )}

                        {/* Opportunity finding */}
                        <div style={{ marginTop: '10px', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', marginBottom: '3px' }}>
                            Identified Opportunity:
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#d1d5db', lineHeight: 1.4 }}>
                            {meta.identifiedOpportunity || draft.excerpt || 'Technical modernization and high-performance web upgrade.'}
                          </p>
                        </div>

                        {/* Pitch snippet */}
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '2px' }}>
                            Proposed Pitch Subject:
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>
                            {draft.title}
                          </p>
                        </div>
                      </div>

                      {/* 4 Clear Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          paddingTop: '10px',
                          borderTop: '1px solid #1c1c2b',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => handleApproveAndSendFromOutreach(draft.id)}
                          style={{
                            flex: 1,
                            minWidth: '120px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            color: '#ffffff',
                            padding: '7px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <Send size={12} />
                          <span>Approve & Send</span>
                        </button>

                        <button
                          onClick={() => setSelectedScoutDraft(draft)}
                          style={{
                            background: '#161626',
                            border: '1px solid #2d2d48',
                            color: '#e2e8f0',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Edit Pitch
                        </button>

                        <button
                          onClick={() => handleSaveForLaterFromOutreach(draft.id)}
                          style={{
                            background: '#161626',
                            border: '1px solid #2d2d48',
                            color: '#9ca3af',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Save Later
                        </button>

                        <button
                          onClick={() => handleRejectScoutDraft(draft.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB: CONTACTS DIRECTORY */}
      {activeTab === 'contacts' && (
        <div
          className="hpa-leads-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: selectedBusiness ? 'minmax(0, 1fr) 420px' : 'minmax(0, 1fr)',
            gap: '20px',
            minWidth: 0,
            width: '100%',
            alignItems: 'start',
          }}
        >
          <div style={{ background: '#0e0e16', border: '1px solid #1c1c2b', borderRadius: '12px', padding: '24px', minWidth: 0, overflow: 'hidden' }}>
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
              <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1c1c2b', color: '#9ca3af' }}>
                    <th style={{ padding: '12px 10px' }}>Contact Email</th>
                    <th style={{ padding: '12px 10px' }}>Phone / WhatsApp</th>
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
                        {c.phone ? (() => {
                          const isWa = isWhatsAppEligible(c.phone);
                          const waUrl = getWhatsAppUrl(c.phone, c.business_name);
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <a
                                href={`tel:${c.phone}`}
                                title={`Call ${c.phone}`}
                                style={{ color: '#ffffff', fontSize: '12px', textDecoration: 'none' }}
                              >
                                {c.phone}
                              </a>
                              {isWa && waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open WhatsApp chat"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '22px',
                                    height: '22px',
                                    background: 'rgba(37, 211, 102, 0.15)',
                                    border: '1px solid rgba(37, 211, 102, 0.4)',
                                    color: '#25d366',
                                    borderRadius: '50%',
                                    textDecoration: 'none',
                                    flexShrink: 0,
                                  }}
                                >
                                  <WhatsAppIcon size={12} />
                                </a>
                              ) : (
                                <a
                                  href={`tel:${c.phone}`}
                                  title={`Call ${c.phone}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '22px',
                                    height: '22px',
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                    color: '#38bdf8',
                                    borderRadius: '50%',
                                    textDecoration: 'none',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Phone size={11} />
                                </a>
                              )}
                            </div>
                          );
                        })() : (
                          <span style={{ color: '#6b7280', fontSize: '11px' }}>None</span>
                        )}
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
                            onClick={() => handleOpenBusinessById(c.business_id, c.business_name)}
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
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
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
        {renderBusinessDetailDrawer()}
      </div>
    )}

      {/* VIEW 6: SENT & FOLLOW-UPS */}
      {(currentView === 'sent' || activeTab === 'queue') && (
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

      {/* COMPLIANCE & SUPPRESSION */}
      {(currentView === 'analytics' || activeTab === 'compliance') && (
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

      {/* SAFETY SETTINGS */}
      {(currentView === 'analytics' || activeTab === 'settings') && (
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

      {/* Single Business Delete Modal */}
      <ConfirmModal
        isOpen={deletingBizId !== null}
        title="Delete Business Lead"
        message="Are you sure you want to delete this business record? All associated audit data, analyses, and queued outreach will be removed."
        confirmLabel="Yes, Delete Business"
        onConfirm={handleDeleteSingleBiz}
        onCancel={() => setDeletingBizId(null)}
        isLoading={deletingBizLoading}
      />

      {/* Bulk Business Delete Modal */}
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
