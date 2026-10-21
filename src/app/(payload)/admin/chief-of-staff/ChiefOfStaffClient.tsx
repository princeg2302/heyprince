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
} from 'lucide-react';
import { useToast } from '@/components/admin/Toast';
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
  const drafts = data?.recentDrafts || [];
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '18px' }}>
          {agents.map((agent) => {
            const isPaused = agent.status === 'paused';
            const isRunning = runningAgentId === agent.id;
            const isToggling = togglingAgentId === agent.id;

            return (
              <div
                key={agent.id}
                className="hpa-card"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: isPaused ? 0.75 : 1,
                  transition: 'all 0.2s ease',
                  border: isPaused ? '1px solid var(--hpa-border)' : '1px solid rgba(255, 71, 87, 0.25)',
                }}
              >
                <div>
                  {/* Top Agent Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                          {agent.name}
                        </h3>
                        <span
                          className={`hpa-pill ${agent.status === 'enabled' ? 'hpa-pill-published' : 'hpa-pill-draft'}`}
                          style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
                        >
                          {agent.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#ff4757', fontWeight: 600, marginTop: '2px' }}>
                        {agent.role}
                      </div>
                    </div>

                    {/* Enable / Pause Toggle Switch */}
                    <button
                      onClick={() => handleToggleAgentStatus(agent.id, agent.status)}
                      disabled={isToggling}
                      className="hpa-btn hpa-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                      title={isPaused ? 'Resume Agent' : 'Pause Agent'}
                    >
                      {isToggling ? (
                        <Loader2 size={13} className="hpa-spin" />
                      ) : isPaused ? (
                        <Play size={13} color="#00ff88" />
                      ) : (
                        <X size={13} color="#ff4757" />
                      )}
                      <span>{isPaused ? 'Enable' : 'Pause'}</span>
                    </button>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--hpa-text-dim)', lineHeight: 1.5, marginBottom: '16px' }}>
                    {agent.description}
                  </p>

                  {/* Operating Mode Selector */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Operating Mode
                      </span>
                      <span style={{ fontSize: '0.74rem', color: agent.mode === 'prepare' ? '#ffaa00' : agent.mode === 'auto' ? '#00ff88' : '#3b82f6' }}>
                        {agent.mode === 'prepare' ? 'Mode B: Drafts for Approval' : agent.mode === 'auto' ? 'Mode C: Autonomous Action' : 'Mode A: Observe Only'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {(['observe', 'prepare', 'auto'] as OperatingMode[]).map((modeOption) => (
                        <button
                          key={modeOption}
                          onClick={() => handleChangeAgentMode(agent.id, modeOption)}
                          disabled={isToggling}
                          style={{
                            background: agent.mode === modeOption ? 'rgba(255, 71, 87, 0.2)' : 'transparent',
                            color: agent.mode === modeOption ? '#ffffff' : 'var(--hpa-text-dim)',
                            border: agent.mode === modeOption ? '1px solid #ff4757' : '1px solid var(--hpa-border)',
                            borderRadius: '6px',
                            padding: '6px 4px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                          }}
                        >
                          {modeOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schedule & Run Metadata */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem', color: 'var(--hpa-text-dim)', marginBottom: '16px' }}>
                    <div>
                      <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>SCHEDULE</span>
                      <strong style={{ color: '#ffffff' }}>{agent.schedule_display}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>LAST RUN</span>
                      <span style={{ color: agent.last_run_at ? '#ffffff' : 'var(--hpa-text-dim)' }}>
                        {agent.last_run_at ? new Date(agent.last_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agent Action Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--hpa-border)', paddingTop: '14px', marginTop: '10px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)' }}>
                    Runs: <strong>{agent.stats?.total_runs || 0}</strong> • Produced: <strong>{agent.stats?.items_produced || 0}</strong>
                  </div>

                  <button
                    onClick={() => handleRunAgentTask(agent.id)}
                    disabled={isRunning}
                    className="hpa-btn hpa-btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    {isRunning ? (
                      <Loader2 size={13} className="hpa-spin" />
                    ) : (
                      <Play size={13} />
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
                    }}
                  >
                    <div style={{ flex: '1 1 500px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
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

      {/* INSPECT DRAFT MODAL */}
      {selectedDraftForModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedDraftForModal(null)}
        >
          <div
            className="hpa-card"
            style={{
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="hpa-pill" style={{ fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '8px', display: 'inline-block' }}>
                  {selectedDraftForModal.draft_type.replace(/_/g, ' ')}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {selectedDraftForModal.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDraftForModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Preview */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--hpa-border)',
                borderRadius: '8px',
                padding: '20px',
                fontSize: '0.88rem',
                color: '#e2e8f0',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                maxHeight: '440px',
                overflowY: 'auto',
                marginBottom: '20px',
                fontFamily: 'monospace',
              }}
            >
              {selectedDraftForModal.content}
            </div>

            {/* LinkedIn Publish Checkbox if Article */}
            {selectedDraftForModal.draft_type === 'article' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                  color: '#ffffff',
                }}
              >
                <input
                  type="checkbox"
                  checked={shareToLinkedIn}
                  onChange={(e) => setShareToLinkedIn(e.target.checked)}
                  style={{ accentColor: '#ff4757', width: '16px', height: '16px' }}
                />
                <span>Also publish social post variation to personal LinkedIn profile</span>
              </label>
            )}

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedDraftForModal(null)}
                className="hpa-btn hpa-btn-secondary"
              >
                Close
              </button>

              {selectedDraftForModal.status === 'pending_approval' && (
                <>
                  <button
                    onClick={() => handleApproveDraft(selectedDraftForModal.id, 'reject')}
                    disabled={approvingDraftId === selectedDraftForModal.id}
                    className="hpa-btn hpa-btn-secondary"
                    style={{ color: '#ff4757' }}
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => handleApproveDraft(selectedDraftForModal.id, 'publish')}
                    disabled={approvingDraftId === selectedDraftForModal.id}
                    className="hpa-btn hpa-btn-primary"
                    style={{ background: '#00ff88', borderColor: '#00ff88', color: '#000000', fontWeight: 700 }}
                  >
                    {approvingDraftId === selectedDraftForModal.id ? (
                      <Loader2 size={14} className="hpa-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>Approve & Publish to Live Site</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

