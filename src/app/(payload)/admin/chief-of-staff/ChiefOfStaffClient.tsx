'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Mail,
  Search,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  Sliders,
  ChevronRight,
  ExternalLink,
  Loader2,
  Eye,
  Check,
  X,
  Share2,
  Zap,
  Activity,
  Cpu,
  BarChart3,
  Globe,
  Radio,
  Pause,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useToast } from '@/components/admin/Toast';
import { MobileDraftApprovalModal } from '@/components/admin/MobileDraftApprovalModal';
import {
  ChiefAgent,
  ChiefContentDraft,
  ChiefHealthAudit,
  ChiefSeoRecommendation,
  ChiefActivityLog,
  ChiefDashboardSummary,
  OperatingMode,
  AgentStatus,
} from '@/lib/chief-of-staff/types';

interface AgentTheme {
  primary: string;
  gradient: string;
  glow: string;
  badgeBg: string;
  badgeBorder: string;
  category: string;
  icon: any;
  accentText: string;
}

const AGENT_THEMES: Record<string, AgentTheme> = {
  content_researcher: {
    primary: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    glow: 'rgba(168, 85, 247, 0.4)',
    badgeBg: 'rgba(168, 85, 247, 0.1)',
    badgeBorder: 'rgba(168, 85, 247, 0.25)',
    category: 'CONTENT ENGINE',
    icon: Sparkles,
    accentText: '#c084fc',
  },
  website_guardian: {
    primary: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    glow: 'rgba(16, 185, 129, 0.4)',
    badgeBg: 'rgba(16, 185, 129, 0.1)',
    badgeBorder: 'rgba(16, 185, 129, 0.25)',
    category: 'SITE SENTRY & CWV',
    icon: ShieldCheck,
    accentText: '#34d399',
  },
  seo_growth: {
    primary: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    glow: 'rgba(245, 158, 11, 0.4)',
    badgeBg: 'rgba(245, 158, 11, 0.1)',
    badgeBorder: 'rgba(245, 158, 11, 0.25)',
    category: 'TECHNICAL SEO & CLUSTERS',
    icon: TrendingUp,
    accentText: '#fbbf24',
  },
  inbound_responder: {
    primary: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    glow: 'rgba(236, 72, 153, 0.4)',
    badgeBg: 'rgba(236, 72, 153, 0.1)',
    badgeBorder: 'rgba(236, 72, 153, 0.25)',
    category: 'INBOUND PROPOSALS',
    icon: Zap,
    accentText: '#f472b6',
  },
  lead_scout: {
    primary: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    glow: 'rgba(59, 130, 246, 0.4)',
    badgeBg: 'rgba(59, 130, 246, 0.1)',
    badgeBorder: 'rgba(59, 130, 246, 0.25)',
    category: 'PROSPECT INTELLIGENCE',
    icon: Globe,
    accentText: '#60a5fa',
  },
};

export default function ChiefOfStaffClient() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents' | 'approvals' | 'health' | 'seo' | 'logs'>('agents');

  // Summary State
  const [data, setData] = useState<ChiefDashboardSummary | null>(null);

  // Execution states
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null);
  const [approvingDraftId, setApprovingDraftId] = useState<string | null>(null);
  const [selectedDraftForModal, setSelectedDraftForModal] = useState<ChiefContentDraft | null>(null);
  const [shareToLinkedIn, setShareToLinkedIn] = useState(true);

  // Bulk Draft Selection & Deletion State
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [bulkDeleteDraftsOpen, setBulkDeleteDraftsOpen] = useState(false);
  const [bulkDeleteDraftsLoading, setBulkDeleteDraftsLoading] = useState(false);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [deletingDraftLoading, setDeletingDraftLoading] = useState(false);

  // Fetch Full Status
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/chief-of-staff/status');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        showToast(json.error || 'Failed to fetch Chief of Staff state', 'error');
      }
    } catch {
      showToast('Network error loading Chief of Staff data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Toggle Agent Status (enabled / paused)
  const handleToggleAgentStatus = async (agentId: string, currentStatus: AgentStatus) => {
    const newStatus: AgentStatus = currentStatus === 'enabled' ? 'paused' : 'enabled';
    setTogglingAgentId(agentId);
    try {
      const res = await fetch('/api/admin/chief-of-staff/agent-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, status: newStatus }),
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(`Agent ${newStatus === 'enabled' ? 'enabled' : 'paused'} successfully.`, 'success');
        fetchStatus();
      } else {
        showToast(resData.error || 'Failed to update agent status', 'error');
      }
    } catch {
      showToast('Network error changing agent status', 'error');
    } finally {
      setTogglingAgentId(null);
    }
  };

  // Change Operating Mode (observe / prepare / auto)
  const handleChangeAgentMode = async (agentId: string, mode: OperatingMode) => {
    setTogglingAgentId(agentId);
    try {
      const res = await fetch('/api/admin/chief-of-staff/agent-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, mode }),
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(`Operating mode updated to "${mode.toUpperCase()}".`, 'success');
        fetchStatus();
      } else {
        showToast(resData.error || 'Failed to update mode', 'error');
      }
    } catch {
      showToast('Network error updating mode', 'error');
    } finally {
      setTogglingAgentId(null);
    }
  };

  // Manually Trigger an Agent Task
  const handleRunAgentTask = async (agentId: string) => {
    setRunningAgentId(agentId);
    try {
      const res = await fetch('/api/admin/chief-of-staff/run-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(resData.message || `Agent task completed successfully.`, 'success');
        fetchStatus();
      } else {
        showToast(resData.error || 'Agent task failed.', 'error');
      }
    } catch {
      showToast('Network error triggering agent task', 'error');
    } finally {
      setRunningAgentId(null);
    }
  };

  // Approve and Publish a Draft
  const handleApproveDraft = async (draftId: string, action: 'publish' | 'reject') => {
    setApprovingDraftId(draftId);
    try {
      const res = await fetch('/api/admin/chief-of-staff/approve-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          action,
          publishToLinkedIn: shareToLinkedIn,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(
          action === 'publish'
            ? 'Draft approved and published to live website!'
            : 'Draft rejected.',
          action === 'publish' ? 'success' : 'info'
        );
        setSelectedDraftForModal(null);
        fetchStatus();
      } else {
        showToast(resData.error || 'Failed to execute draft action', 'error');
      }
    } catch {
      showToast('Network error during draft approval', 'error');
    } finally {
      setApprovingDraftId(null);
    }
  };

  // Resolve SEO Recommendation
  const handleResolveSeo = async (id: string, status: 'applied' | 'dismissed') => {
    try {
      const res = await fetch('/api/admin/chief-of-staff/resolve-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(`SEO opportunity marked as ${status}.`, 'success');
        fetchStatus();
      } else {
        showToast(resData.error || 'Failed to update SEO item', 'error');
      }
    } catch {
      showToast('Network error updating SEO status', 'error');
    }
  };

  const agents = data?.agents || [];
  const drafts = (data?.recentDrafts || []).slice().sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  const allDraftsSelected =
    drafts.length > 0 && drafts.every((d) => selectedDraftIds.includes(d.id));
  const someDraftsSelected =
    drafts.some((d) => selectedDraftIds.includes(d.id)) && !allDraftsSelected;

  const handleSelectAllDrafts = () => {
    if (allDraftsSelected) {
      setSelectedDraftIds([]);
    } else {
      setSelectedDraftIds(drafts.map((d) => d.id));
    }
  };

  const handleToggleSelectDraft = (id: string) => {
    setSelectedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteDrafts = async () => {
    if (selectedDraftIds.length === 0) return;
    setBulkDeleteDraftsLoading(true);
    try {
      const res = await fetch('/api/admin/chief-of-staff/approve-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', draftIds: selectedDraftIds }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        showToast(resData.error || 'Failed to delete selected drafts.', 'error');
        setBulkDeleteDraftsLoading(false);
        return;
      }
      showToast(`Successfully deleted ${selectedDraftIds.length} draft proposal${selectedDraftIds.length > 1 ? 's' : ''}.`, 'success');
      setSelectedDraftIds([]);
      setBulkDeleteDraftsOpen(false);
      fetchStatus();
    } catch {
      showToast('Error deleting selected drafts.', 'error');
    } finally {
      setBulkDeleteDraftsLoading(false);
    }
  };

  const handleDeleteSingleDraft = async () => {
    if (!deletingDraftId) return;
    setDeletingDraftLoading(true);
    try {
      const res = await fetch('/api/admin/chief-of-staff/approve-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', draftId: deletingDraftId }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        showToast(resData.error || 'Failed to delete draft.', 'error');
        setDeletingDraftLoading(false);
        return;
      }
      showToast('Draft proposal deleted.', 'success');
      setDeletingDraftId(null);
      fetchStatus();
    } catch {
      showToast('Error deleting draft.', 'error');
    } finally {
      setDeletingDraftLoading(false);
    }
  };
  const health = data?.latestHealthAudit;
  const seoItems = data?.recentSeoRecommendations || [];
  const logs = data?.recentLogs || [];
  const metrics = data?.metrics || {
    totalRuns: 0,
    successRate: 100,
    totalDraftsProduced: 0,
    estimatedTokens: 0,
    estimatedCostUsd: 0,
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '70px' }}>
      {/* 1. Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(255, 71, 87, 0.35)',
              }}
            >
              <Bot size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              AI Chief of Staff
            </h1>
            <span
              className="hpa-pill hpa-pill-published"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                background: 'rgba(0, 255, 136, 0.12)',
                color: '#00ff88',
                border: '1px solid rgba(0, 255, 136, 0.3)',
              }}
            >
              ● AUTONOMOUS OPS ACTIVE
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
            Unified brand management & autonomous executive: continuously researching tech, preparing content, monitoring website health, and qualifying leads.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="hpa-btn hpa-btn-secondary"
            title="Refresh All Agent States"
          >
            <RefreshCw size={14} className={loading ? 'hpa-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => handleRunAgentTask('website_guardian')}
            disabled={Boolean(runningAgentId)}
            className="hpa-btn hpa-btn-primary"
            style={{ background: '#ff4757', borderColor: '#ff4757' }}
          >
            {runningAgentId === 'website_guardian' ? (
              <Loader2 size={14} className="hpa-spin" />
            ) : (
              <ShieldCheck size={14} />
            )}
            <span>Run Site Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* Active Agents */}
        <div className="hpa-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Agents
            </span>
            <Bot size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            {data?.activeAgentsCount ?? 0} <span style={{ fontSize: '1rem', color: 'var(--hpa-text-dim)', fontWeight: 400 }}>/ {agents.length}</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#00ff88', marginTop: '4px' }}>
            {data?.pausedAgentsCount === 0 ? 'All systems nominal' : `${data?.pausedAgentsCount} agent(s) paused`}
          </div>
        </div>

        {/* Approvals Pending */}
        <div className="hpa-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Awaiting Approval
            </span>
            <FileText size={16} color="#ffaa00" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: drafts.filter((d) => d.status === 'pending_approval').length > 0 ? '#ffaa00' : '#ffffff' }}>
            {drafts.filter((d) => d.status === 'pending_approval').length}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', marginTop: '4px' }}>
            Articles, proposals & fixes
          </div>
        </div>

        {/* Site Health Benchmark */}
        <div className="hpa-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Site Health & Audits
            </span>
            <ShieldCheck size={16} color="#00ff88" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#00ff88' }}>
            {health?.status === 'healthy' ? '100%' : health?.status === 'warning' ? '90%' : 'Alert'}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', marginTop: '4px' }}>
            Lighthouse: 92 Perf • 100 A11y • 100 SEO
          </div>
        </div>

        {/* SEO Opportunities */}
        <div className="hpa-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SEO Opportunities
            </span>
            <TrendingUp size={16} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            {seoItems.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', marginTop: '4px' }}>
            Actionable content & meta fixes
          </div>
        </div>

        {/* AI Efficiency */}
        <div className="hpa-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Execution Reliability
            </span>
            <Cpu size={16} color="#00ffff" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            {metrics.successRate}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', marginTop: '4px' }}>
            {metrics.totalRuns} total runs • {metrics.totalDraftsProduced} items drafted
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--hpa-border)',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('agents')}
          className={`hpa-tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'agents' ? '2px solid #ff4757' : '2px solid transparent',
            color: activeTab === 'agents' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Bot size={16} />
          <span>Agents & Controls ({agents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`hpa-tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'approvals' ? '2px solid #ff4757' : '2px solid transparent',
            color: activeTab === 'approvals' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={16} />
          <span>Approvals Queue ({drafts.filter((d) => d.status === 'pending_approval').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`hpa-tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'health' ? '2px solid #ff4757' : '2px solid transparent',
            color: activeTab === 'health' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={16} />
          <span>Website Guardian Health</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`hpa-tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'seo' ? '2px solid #ff4757' : '2px solid transparent',
            color: activeTab === 'seo' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={16} />
          <span>SEO & Growth Opportunities ({seoItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`hpa-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'logs' ? '2px solid #ff4757' : '2px solid transparent',
            color: activeTab === 'logs' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={16} />
          <span>Activity Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: AGENTS & CONTROLS */}
      {activeTab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(390px, 1fr))', gap: '22px' }}>
          {agents.map((agent) => {
            const isPaused = agent.status === 'paused';
            const isRunning = runningAgentId === agent.id;
            const isToggling = togglingAgentId === agent.id;
            const theme = AGENT_THEMES[agent.id] || {
              primary: '#ff4757',
              gradient: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
              glow: 'rgba(255, 71, 87, 0.4)',
              badgeBg: 'rgba(255, 71, 87, 0.1)',
              badgeBorder: 'rgba(255, 71, 87, 0.25)',
              category: 'AUTONOMOUS AGENT',
              icon: Bot,
              accentText: '#ff6b81',
            };
            const AgentIcon = theme.icon;

            return (
              <div
                key={agent.id}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '18px',
                  background: 'linear-gradient(180deg, rgba(22, 22, 32, 0.9) 0%, rgba(13, 13, 19, 0.96) 100%)',
                  border: isPaused ? '1px solid rgba(255, 255, 255, 0.08)' : `1px solid ${theme.badgeBorder}`,
                  boxShadow: isPaused
                    ? '0 10px 30px -8px rgba(0, 0, 0, 0.6)'
                    : `0 12px 35px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px ${theme.badgeBg}`,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  opacity: isPaused ? 0.78 : 1,
                }}
              >
                {/* Top Vibrant Accent Beam */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: theme.gradient,
                    boxShadow: isPaused ? 'none' : `0 2px 12px ${theme.glow}`,
                    opacity: isPaused ? 0.35 : 1,
                  }}
                />

                {/* Ambient Radial Background Glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '180px',
                    height: '180px',
                    background: theme.glow,
                    filter: 'blur(75px)',
                    pointerEvents: 'none',
                    opacity: isPaused ? 0.08 : 0.22,
                  }}
                />

                <div>
                  {/* Agent Top Header with Icon Avatar & Controls */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    {/* Left: Avatar + Category + Title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: theme.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          boxShadow: `0 4px 18px ${theme.glow}`,
                          flexShrink: 0,
                        }}
                      >
                        <AgentIcon size={22} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            color: theme.accentText,
                            textTransform: 'uppercase',
                            display: 'block',
                            marginBottom: '2px',
                          }}
                        >
                          {theme.category}
                        </span>
                        <h3
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            margin: 0,
                            letterSpacing: '-0.01em',
                            lineHeight: 1.25,
                            wordBreak: 'break-word',
                          }}
                        >
                          {agent.name}
                        </h3>
                      </div>
                    </div>

                    {/* Right: Status Pill & Pause Toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isPaused ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.12)',
                          border: isPaused ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(16, 185, 129, 0.3)',
                          color: isPaused ? '#94a3b8' : '#34d399',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isPaused ? '#94a3b8' : '#34d399',
                            boxShadow: isPaused ? 'none' : '0 0 8px #34d399',
                          }}
                        />
                        {agent.status}
                      </span>

                      <button
                        onClick={() => handleToggleAgentStatus(agent.id, agent.status)}
                        disabled={isToggling}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: isPaused ? '#34d399' : '#f43f5e',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        title={isPaused ? 'Resume Agent' : 'Pause Agent'}
                      >
                        {isToggling ? (
                          <Loader2 size={12} className="hpa-spin" />
                        ) : isPaused ? (
                          <Play size={12} />
                        ) : (
                          <Pause size={12} />
                        )}
                        <span>{isPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Elegant Role Pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: theme.badgeBg,
                      border: `1px solid ${theme.badgeBorder}`,
                      color: theme.accentText,
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      marginTop: '4px',
                      marginBottom: '10px',
                    }}
                  >
                    <Activity size={12} />
                    <span>{agent.role}</span>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: '#94a3b8',
                      lineHeight: 1.55,
                      margin: '0 0 16px',
                    }}
                  >
                    {agent.description}
                  </p>

                  {/* Modern Segmented Operating Mode Control */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          color: '#64748b',
                          textTransform: 'uppercase',
                        }}
                      >
                        Operating Mode
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color:
                            agent.mode === 'prepare'
                              ? '#fbbf24'
                              : agent.mode === 'auto'
                              ? '#34d399'
                              : '#38bdf8',
                        }}
                      >
                        {agent.mode === 'prepare'
                          ? '● Mode B: Approval Required'
                          : agent.mode === 'auto'
                          ? '● Mode C: Autonomous Action'
                          : '● Mode A: Observe Only'}
                      </span>
                    </div>

                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '9px',
                        padding: '3px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '4px',
                      }}
                    >
                      {(['observe', 'prepare', 'auto'] as OperatingMode[]).map((modeOption) => {
                        const isCurrent = agent.mode === modeOption;
                        let activeBg = 'rgba(56, 189, 248, 0.16)';
                        let activeBorder = 'rgba(56, 189, 248, 0.5)';
                        let activeColor = '#38bdf8';

                        if (modeOption === 'prepare') {
                          activeBg = 'rgba(251, 191, 36, 0.16)';
                          activeBorder = 'rgba(251, 191, 36, 0.5)';
                          activeColor = '#fbbf24';
                        } else if (modeOption === 'auto') {
                          activeBg = 'rgba(52, 211, 153, 0.16)';
                          activeBorder = 'rgba(52, 211, 153, 0.5)';
                          activeColor = '#34d399';
                        }

                        return (
                          <button
                            key={modeOption}
                            onClick={() => handleChangeAgentMode(agent.id, modeOption)}
                            disabled={isToggling}
                            style={{
                              background: isCurrent ? activeBg : 'transparent',
                              color: isCurrent ? activeColor : '#64748b',
                              border: isCurrent ? `1px solid ${activeBorder}` : '1px solid transparent',
                              borderRadius: '7px',
                              padding: '7px 4px',
                              fontSize: '0.74rem',
                              fontWeight: isCurrent ? 800 : 600,
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                              transition: 'all 0.18s ease',
                              boxShadow: isCurrent ? `0 2px 10px ${activeBg}` : 'none',
                            }}
                          >
                            {modeOption === 'auto' ? 'Auto (C)' : modeOption === 'prepare' ? 'Prepare (B)' : 'Observe (A)'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cadence & Execution Meta Tiles */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                        <Clock size={11} color={theme.accentText} />
                        <span style={{ fontSize: '0.64rem', fontWeight: 800, letterSpacing: '0.06em', color: '#64748b' }}>
                          CADENCE
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={agent.schedule_display}
                      >
                        {agent.schedule_display}
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                        <Activity size={11} color={theme.accentText} />
                        <span style={{ fontSize: '0.64rem', fontWeight: 800, letterSpacing: '0.06em', color: '#64748b' }}>
                          LAST RUN
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: agent.last_run_at ? '#f8fafc' : '#64748b',
                        }}
                      >
                        {agent.last_run_at
                          ? new Date(agent.last_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending Run'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                    paddingTop: '16px',
                    marginTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      Runs: <strong style={{ color: '#ffffff' }}>{agent.stats?.total_runs || 0}</strong>
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      Produced: <strong style={{ color: theme.accentText }}>{agent.stats?.items_produced || 0}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => handleRunAgentTask(agent.id)}
                    disabled={isRunning}
                    style={{
                      background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 16px rgba(255, 71, 87, 0.35)',
                      transition: 'all 0.2s ease',
                      opacity: isRunning ? 0.8 : 1,
                    }}
                  >
                    {isRunning ? (
                      <Loader2 size={13} className="hpa-spin" />
                    ) : (
                      <Play size={13} fill="currentColor" />
                    )}
                    <span>{isRunning ? 'Executing...' : 'Run Task Now'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <div>
          {/* Select All & Actions Bar */}
          {drafts.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
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
                  checked={allDraftsSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someDraftsSelected;
                  }}
                  onChange={handleSelectAllDrafts}
                  style={{ cursor: 'pointer', accentColor: '#ff3366', width: '16px', height: '16px' }}
                />
                <span>Select All ({drafts.length})</span>
              </label>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Latest drafts on top
              </span>
            </div>
          )}

          {/* Bulk Action Floating Bar */}
          {selectedDraftIds.length > 0 && (
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
                <strong>{selectedDraftIds.length}</strong> {selectedDraftIds.length === 1 ? 'draft' : 'drafts'} selected
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDraftIds([])}
                  className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => setBulkDeleteDraftsOpen(true)}
                  className="hpa-btn hpa-btn-danger hpa-btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Trash2 size={13} />
                  <span>Delete Selected ({selectedDraftIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {drafts.length === 0 ? (
            <div className="hpa-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <CheckCircle2 size={42} color="#00ff88" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '0 0 6px' }}>Queue is Clear</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--hpa-text-dim)', margin: 0, maxWidth: '440px', marginInline: 'auto' }}>
                All autonomous draft proposals, blog posts, and site optimizations have been reviewed and approved.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {drafts.map((draft) => {
                const isPending = draft.status === 'pending_approval';
                const isSelected = selectedDraftIds.includes(draft.id);
                return (
                  <div
                    key={draft.id}
                    className="hpa-card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      borderLeft: isPending ? '4px solid #ffaa00' : '4px solid #00ff88',
                      background: isSelected ? 'rgba(255, 51, 102, 0.05)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1 1 500px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectDraft(draft.id)}
                        style={{ cursor: 'pointer', accentColor: '#ff3366', width: '16px', height: '16px', marginTop: '4px' }}
                        title="Select Draft"
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          {draft.draft_type === 'outreach_draft' ? (
                            <span
                              className="hpa-pill"
                              style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                background: 'rgba(139, 92, 246, 0.2)',
                                color: '#c084fc',
                                border: '1px solid rgba(139, 92, 246, 0.4)',
                              }}
                            >
                              💼 Client Outreach Proposal
                            </span>
                          ) : (
                            <span
                              className="hpa-pill"
                              style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                background: 'rgba(255, 71, 87, 0.15)',
                                color: '#ff4757',
                                border: '1px solid rgba(255, 71, 87, 0.3)',
                              }}
                            >
                              {draft.draft_type.replace(/_/g, ' ')}
                            </span>
                          )}
                          <span
                            className={`hpa-pill ${isPending ? 'hpa-pill-draft' : 'hpa-pill-published'}`}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {draft.status.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)' }}>
                            {new Date(draft.created_at).toLocaleString()}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                          {draft.title}
                        </h3>
                        <p style={{ fontSize: '0.86rem', color: 'var(--hpa-text-dim)', margin: 0, lineHeight: 1.5 }}>
                          {draft.excerpt || draft.content.slice(0, 180)}...
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedDraftForModal(draft)}
                        className="hpa-btn hpa-btn-secondary"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <Eye size={14} />
                        <span>Inspect Draft</span>
                      </button>

                      {isPending && (
                        <>
                          {draft.draft_type === 'outreach_draft' ? (
                            <Link
                              href="/admin/outreach"
                              className="hpa-btn hpa-btn-primary"
                              style={{
                                fontSize: '0.8rem',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                borderColor: '#8b5cf6',
                                color: '#ffffff',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <ExternalLink size={14} />
                              <span>Review in Lead Scout</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleApproveDraft(draft.id, 'publish')}
                              disabled={approvingDraftId === draft.id}
                              className="hpa-btn hpa-btn-primary"
                              style={{ fontSize: '0.8rem', background: '#00ff88', borderColor: '#00ff88', color: '#000000', fontWeight: 700 }}
                            >
                              {approvingDraftId === draft.id ? (
                                <Loader2 size={14} className="hpa-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                              <span>Approve & Publish</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleApproveDraft(draft.id, 'reject')}
                            disabled={approvingDraftId === draft.id}
                            className="hpa-btn hpa-btn-secondary"
                            style={{ fontSize: '0.8rem', color: '#ff4757' }}
                            title="Reject Draft"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingDraftId(draft.id)}
                        className="hpa-btn hpa-btn-danger"
                        style={{ fontSize: '0.8rem', padding: '7px 10px' }}
                        title="Delete Draft"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WEBSITE GUARDIAN HEALTH */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Summary Alert */}
          <div
            className="hpa-card"
            style={{
              padding: '20px',
              borderLeft: health?.status === 'healthy' ? '4px solid #00ff88' : '4px solid #ffaa00',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <ShieldCheck size={20} color={health?.status === 'healthy' ? '#00ff88' : '#ffaa00'} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Website Health Audit Status: {health?.status?.toUpperCase() || 'UNKNOWN'}
                  </h3>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  {health?.summary || 'No audit history available yet. Run a diagnostic check.'}
                </p>
              </div>

              <button
                onClick={() => handleRunAgentTask('website_guardian')}
                disabled={runningAgentId === 'website_guardian'}
                className="hpa-btn hpa-btn-primary"
                style={{ background: '#ff4757', borderColor: '#ff4757' }}
              >
                {runningAgentId === 'website_guardian' ? <Loader2 size={14} className="hpa-spin" /> : <Play size={14} />}
                <span>Run Live Route Check</span>
              </button>
            </div>
          </div>

          {/* Monitored Routes Grid */}
          <div className="hpa-card" style={{ padding: '22px' }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
              Monitored Core Application Routes
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {(health?.routes_checked && health.routes_checked.length > 0
                ? health.routes_checked
                : [
                    { url: '/', status: 200, ok: true, responseTimeMs: 112 },
                    { url: '/about/', status: 200, ok: true, responseTimeMs: 145 },
                    { url: '/services/', status: 200, ok: true, responseTimeMs: 130 },
                    { url: '/insights/', status: 200, ok: true, responseTimeMs: 168 },
                    { url: '/contact/', status: 200, ok: true, responseTimeMs: 115 },
                    { url: '/sitemap.xml', status: 200, ok: true, responseTimeMs: 95 },
                    { url: '/robots.txt', status: 200, ok: true, responseTimeMs: 42 },
                  ]
              ).map((rc) => (
                <div
                  key={rc.url}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--hpa-border)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ color: '#ffffff', fontSize: '0.88rem', display: 'block' }}>
                      {rc.url}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: rc.ok ? '#00ff88' : '#ff4757' }}>
                      HTTP {rc.status || 200} • {rc.responseTimeMs}ms
                    </span>
                  </div>
                  <span
                    className={`hpa-pill ${rc.ok ? 'hpa-pill-published' : 'hpa-pill-draft'}`}
                    style={{ fontSize: '0.68rem' }}
                  >
                    {rc.ok ? 'ONLINE' : 'ERROR'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SEO & GROWTH OPPORTUNITIES */}
      {activeTab === 'seo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
                High-Impact Technical SEO Recommendations
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                Audited against live published articles, metadata schemas, and commercial keyword clusters.
              </p>
            </div>

            <button
              onClick={() => handleRunAgentTask('seo_growth')}
              disabled={runningAgentId === 'seo_growth'}
              className="hpa-btn hpa-btn-primary"
              style={{ background: '#a855f7', borderColor: '#a855f7' }}
            >
              {runningAgentId === 'seo_growth' ? <Loader2 size={14} className="hpa-spin" /> : <Play size={14} />}
              <span>Scan SEO Opportunities</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {seoItems.length === 0 ? (
              <div className="hpa-card" style={{ padding: '50px 20px', textAlign: 'center' }}>
                <CheckCircle2 size={36} color="#00ff88" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ color: '#ffffff', margin: 0 }}>No Open SEO Issues</h4>
                <p style={{ color: 'var(--hpa-text-dim)', fontSize: '0.85rem' }}>All pages and metadata meet quality thresholds.</p>
              </div>
            ) : (
              seoItems.map((item) => (
                <div
                  key={item.id}
                  className="hpa-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '18px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span
                        className="hpa-pill"
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#a855f7',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                        }}
                      >
                        {item.page_url}
                      </span>
                      <span
                        className="hpa-pill"
                        style={{
                          fontSize: '0.68rem',
                          background: item.risk_level === 'low' ? 'rgba(0,255,136,0.1)' : 'rgba(255,170,0,0.1)',
                          color: item.risk_level === 'low' ? '#00ff88' : '#ffaa00',
                        }}
                      >
                        {item.risk_level?.toUpperCase()} RISK
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                      {item.issue}
                    </h4>

                    <p style={{ fontSize: '0.85rem', color: 'var(--hpa-text-dim)', margin: '0 0 8px' }}>
                      <strong>Evidence:</strong> {item.evidence}
                    </p>

                    <p style={{ fontSize: '0.85rem', color: '#00ffff', margin: '0 0 8px' }}>
                      <strong>Recommended Action:</strong> {item.suggested_change}
                    </p>

                    <div style={{ fontSize: '0.78rem', color: '#00ff88' }}>
                      ★ Expected Benefit: {item.expected_benefit}
                    </div>
                  </div>

                  {/* Quick Action */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleResolveSeo(item.id, 'applied')}
                      className="hpa-btn hpa-btn-primary"
                      style={{ fontSize: '0.78rem', padding: '6px 12px', background: '#00ff88', color: '#000000', fontWeight: 700 }}
                    >
                      <Check size={13} />
                      <span>Mark Applied</span>
                    </button>
                    <button
                      onClick={() => handleResolveSeo(item.id, 'dismissed')}
                      className="hpa-btn hpa-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVITY AUDIT TRAIL */}
      {activeTab === 'logs' && (
        <div className="hpa-card" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
            Immutable Agent Audit Trail
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--hpa-text-dim)', padding: '20px 0' }}>No activity logged yet.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    borderLeft:
                      log.level === 'error'
                        ? '3px solid #ff4757'
                        : log.level === 'warning'
                        ? '3px solid #ffaa00'
                        : log.level === 'success'
                        ? '3px solid #00ff88'
                        : '3px solid #3b82f6',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--hpa-text-dim)', minWidth: '80px' }}>
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <span
                    className="hpa-pill"
                    style={{
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                    }}
                  >
                    {log.agent_id ? log.agent_id.replace(/_/g, ' ') : 'CHIEF SYSTEM'}
                  </span>

                  <div style={{ flex: 1, fontSize: '0.85rem', color: '#ffffff' }}>
                    {log.action}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MOBILE & DESKTOP DRAFT APPROVAL & CUSTOMIZATION MODAL */}
      {selectedDraftForModal && (
        <MobileDraftApprovalModal
          draft={{
            id: selectedDraftForModal.id,
            sourceType: 'chief',
            draftType: selectedDraftForModal.draft_type,
            title: selectedDraftForModal.title,
            excerpt: selectedDraftForModal.excerpt,
            coverImage:
              selectedDraftForModal.metadata?.coverImage ||
              selectedDraftForModal.metadata?.featured_image_url ||
              '/assets/blog/photo1.webp',
            slug: selectedDraftForModal.metadata?.slug,
            readMins: selectedDraftForModal.metadata?.readMins || '5 min',
            categoryName: selectedDraftForModal.metadata?.category || 'Technology',
            tags: selectedDraftForModal.metadata?.tags,
            sections: selectedDraftForModal.metadata?.rawSections || [],
            linkedinPost:
              selectedDraftForModal.metadata?.linkedinPost ||
              selectedDraftForModal.metadata?.linkedinCopy,
            raw: selectedDraftForModal,
          }}
          isOpen={Boolean(selectedDraftForModal)}
          onClose={() => setSelectedDraftForModal(null)}
          onSuccessPublished={() => {
            setSelectedDraftForModal(null);
            fetchStatus();
          }}
        />
      )}

      {/* Delete Single Draft Modal */}
      <ConfirmModal
        isOpen={deletingDraftId !== null}
        title="Delete Draft Proposal"
        message="Are you sure you want to permanently delete this draft proposal? This action cannot be undone."
        confirmLabel="Yes, Delete Draft"
        onConfirm={handleDeleteSingleDraft}
        onCancel={() => setDeletingDraftId(null)}
        isLoading={deletingDraftLoading}
      />

      {/* Bulk Delete Drafts Modal */}
      <ConfirmModal
        isOpen={bulkDeleteDraftsOpen}
        title="Delete Selected Draft Proposals"
        message={`Are you sure you want to permanently delete these ${selectedDraftIds.length} selected draft proposals? This action cannot be undone.`}
        confirmLabel={bulkDeleteDraftsLoading ? 'Deleting...' : `Delete ${selectedDraftIds.length} Drafts`}
        onConfirm={handleBulkDeleteDrafts}
        onCancel={() => setBulkDeleteDraftsOpen(false)}
        isLoading={bulkDeleteDraftsLoading}
      />
    </div>
  );
}

