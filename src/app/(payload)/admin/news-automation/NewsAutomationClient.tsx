'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Newspaper,
  RefreshCw,
  Play,
  Eye,
  Settings,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  RotateCw,
  Sliders,
  Shield,
  Layers,
  FileText,
  AlertTriangle,
  Loader2,
  X,
  Radio,
} from 'lucide-react';
import { useToast } from '@/components/admin/Toast';
import {
  DailyNewsSettings,
  DailyNewsSource,
  DailyNewsRunRecord,
  GeneratedContentPayload,
} from '@/lib/daily-news/types';

export default function NewsAutomationClient() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'runs' | 'sources' | 'settings'>('runs');

  // State
  const [settings, setSettings] = useState<DailyNewsSettings | null>(null);
  const [sources, setSources] = useState<DailyNewsSource[]>([]);
  const [recentRuns, setRecentRuns] = useState<DailyNewsRunRecord[]>([]);
  const [aiInfo, setAiInfo] = useState<{ isConfigured: boolean; provider: string; model: string } | null>(null);
  const [linkedInInfo, setLinkedInInfo] = useState<{
    isConnected: boolean;
    personUrn: string | null;
    name: string | null;
    avatarUrl: string | null;
    needsPersonUrn?: boolean;
  } | null>(null);
  const [stats, setStats] = useState<{
    totalRuns: number;
    successfulRuns: number;
    publishedArticles: number;
    linkedinShares: number;
    totalItemsDiscovered: number;
    activeSourcesCount: number;
  }>({
    totalRuns: 0,
    successfulRuns: 0,
    publishedArticles: 0,
    linkedinShares: 0,
    totalItemsDiscovered: 0,
    activeSourcesCount: 0,
  });

  // Action states
  const [runningNow, setRunningNow] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<GeneratedContentPayload | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [togglingSourceId, setTogglingSourceId] = useState<number | null>(null);
  const [deletingSourceId, setDeletingSourceId] = useState<number | null>(null);

  // New source form modal
  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceCategory, setSourceCategory] = useState('Artificial Intelligence');
  const [testingFeed, setTestingFeed] = useState(false);
  const [testFeedResult, setTestFeedResult] = useState<string | null>(null);
  const [savingSource, setSavingSource] = useState(false);

  // Saving settings
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/news-automation/status');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSources(data.sources || []);
        setRecentRuns(data.recentRuns || []);
        setAiInfo(data.ai);
        setLinkedInInfo(data.linkedin);
        if (data.stats) setStats(data.stats);
      } else {
        showToast(data.error || 'Failed to load status', 'error');
      }
    } catch {
      showToast('Network error loading Daily News status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Quick toggle helper
  const handleToggle = async (key: keyof DailyNewsSettings, val: any) => {
    if (!settings) return;
    setTogglingKey(String(key));
    const newSettings = { ...settings, [key]: val };
    setSettings(newSettings);
    try {
      const res = await fetch('/api/admin/news-automation/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: val }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Automation setting updated.', 'success');
      } else {
        showToast(data.error || 'Failed to update setting', 'error');
        fetchStatus();
      }
    } catch {
      showToast('Network error updating setting', 'error');
      fetchStatus();
    } finally {
      setTogglingKey(null);
    }
  };

  // Trigger manual execution
  const handleRunNow = async () => {
    if (!confirm('Run the full daily news collection, AI generation, and publishing pipeline now?')) return;
    setRunningNow(true);
    try {
      const res = await fetch('/api/admin/news-automation/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Daily News pipeline finished: ${data.status} (Website: ${data.websiteStatus}, LinkedIn: ${data.linkedinStatus})`,
          data.status === 'success' ? 'success' : 'info'
        );
        fetchStatus();
      } else {
        showToast(`Run failed: ${data.error || 'Unknown error'}`, 'error');
        fetchStatus();
      }
    } catch {
      showToast('Network error while running automation', 'error');
    } finally {
      setRunningNow(false);
    }
  };

  // Trigger preview draft
  const handlePreviewDraft = async () => {
    setPreviewing(true);
    try {
      const res = await fetch('/api/admin/news-automation/preview', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.generatedContent) {
        setPreviewData(data.generatedContent);
        setPreviewModalOpen(true);
        showToast('Preview draft generated from real news sources.', 'success');
        fetchStatus();
      } else {
        showToast(`Preview failed: ${data.error || 'No content returned'}`, 'error');
      }
    } catch {
      showToast('Network error while generating preview draft', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  // Retry LinkedIn publishing
  const handleRetryLinkedIn = async (runId: number) => {
    setRetryingId(runId);
    try {
      const res = await fetch('/api/admin/news-automation/retry-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Article published to LinkedIn successfully!', 'success');
        fetchStatus();
      } else {
        showToast(data.error || 'LinkedIn retry failed', 'error');
        fetchStatus();
      }
    } catch {
      showToast('Network error during LinkedIn retry', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  // Test RSS Feed
  const handleTestFeed = async () => {
    if (!sourceUrl.trim()) {
      showToast('Please enter an RSS feed URL first.', 'error');
      return;
    }
    setTestingFeed(true);
    setTestFeedResult(null);
    try {
      const res = await fetch('/api/admin/news-automation/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          name: sourceName || 'Test Source',
          url: sourceUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestFeedResult(`✅ Success: Feed active! Found ${data.storiesFound} recent stories.`);
        showToast(`Feed verified: ${data.storiesFound} stories found!`, 'success');
      } else {
        setTestFeedResult(`❌ Error: ${data.error || 'Could not reach feed.'}`);
        showToast(`Feed check failed: ${data.error}`, 'error');
      }
    } catch {
      setTestFeedResult('❌ Error: Network timeout connecting to feed.');
    } finally {
      setTestingFeed(false);
    }
  };

  // Add RSS Source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim() || !sourceUrl.trim()) return;
    setSavingSource(true);
    try {
      const res = await fetch('/api/admin/news-automation/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sourceName.trim(),
          url: sourceUrl.trim(),
          category: sourceCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('RSS News Source added successfully.', 'success');
        setSourceName('');
        setSourceUrl('');
        setTestFeedResult(null);
        setNewSourceOpen(false);
        fetchStatus();
      } else {
        showToast(data.error || 'Failed to add source', 'error');
      }
    } catch {
      showToast('Network error adding source', 'error');
    } finally {
      setSavingSource(false);
    }
  };

  // Toggle Source active
  const handleToggleSource = async (id: number, currentActive: boolean) => {
    setTogglingSourceId(id);
    try {
      const res = await fetch('/api/admin/news-automation/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { isActive: !currentActive } }),
      });
      if (res.ok) {
        showToast(`Source ${!currentActive ? 'enabled' : 'disabled'}.`, 'success');
        fetchStatus();
      }
    } catch {
      showToast('Failed to update source state', 'error');
    } finally {
      setTogglingSourceId(null);
    }
  };

  // Delete Source
  const handleDeleteSource = async (id: number, name: string) => {
    if (!confirm(`Delete RSS source "${name}"?`)) return;
    setDeletingSourceId(id);
    try {
      const res = await fetch(`/api/admin/news-automation/sources?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Source deleted.', 'success');
        fetchStatus();
      }
    } catch {
      showToast('Failed to delete source', 'error');
    } finally {
      setDeletingSourceId(null);
    }
  };

  // Save Settings Form
  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/news-automation/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showToast('All automation settings saved successfully.', 'success');
        fetchStatus();
      } else {
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch {
      showToast('Network error saving settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Sparkles size={18} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Daily AI News Automation
            </h1>
            <span
              className={`hpa-pill ${settings?.isEnabled ? 'hpa-pill-published' : 'hpa-pill-draft'}`}
              style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
            >
              {settings?.isEnabled ? 'Active' : 'Paused'}
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
            Automated discovery of recent tech news &rarr; Humanized engineering analysis &rarr; 1-click publishing to Website and personal LinkedIn.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="hpa-btn hpa-btn-secondary"
            title="Refresh status"
          >
            <RefreshCw size={14} className={loading ? 'hpa-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handlePreviewDraft}
            disabled={previewing || runningNow}
            className="hpa-btn hpa-btn-secondary"
          >
            {previewing ? <Loader2 size={14} className="hpa-spin" /> : <Eye size={14} />}
            <span>{previewing ? 'Evaluating News...' : 'Preview Draft'}</span>
          </button>

          <button
            onClick={handleRunNow}
            disabled={runningNow || previewing}
            className="hpa-btn hpa-btn-primary"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              borderColor: 'transparent',
            }}
          >
            {runningNow ? <Loader2 size={14} className="hpa-spin" /> : <Play size={14} />}
            <span>{runningNow ? 'Processing Pipeline...' : 'Run Automation Now'}</span>
          </button>
        </div>
      </div>

      {/* Live Pipeline Execution In-Progress Banner */}
      {(runningNow || previewing) && (
        <div className="hpa-pipeline-banner hpa-loading-glow">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
                }}
              >
                <Loader2 size={22} className="hpa-spin" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {runningNow ? 'Autonomous Daily News Pipeline Active' : 'Synthesizing Live Preview Draft'}
                  </h3>
                  <span
                    className="hpa-pill hpa-pill-published"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', letterSpacing: '0.5px' }}
                  >
                    Processing Live
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', margin: '3px 0 0 0' }}>
                  {runningNow
                    ? 'Scanning 6 configured RSS feeds → Filtering & deduplicating → Synthesizing via Google Gemini → Creating website post & LinkedIn share'
                    : 'Fetching recent RSS stories and evaluating content via Google Gemini (Dry-Run mode)...'}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="hp-pulse-dot" style={{ display: 'inline-block' }} />
              <span>Please do not close this window</span>
            </div>
          </div>

          {/* Shimmer progress bar */}
          <div
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="hpa-shimmer-bar" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      )}

      {/* Analytics KPI Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div className="hpa-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase' }}>
            Total Pipeline Runs
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {stats.totalRuns}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#10b981', marginTop: '2px' }}>
            {stats.successfulRuns} successful
          </div>
        </div>

        <div className="hpa-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase' }}>
            Website Articles Created
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {stats.publishedArticles}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
            On /insights/[slug]
          </div>
        </div>

        <div className="hpa-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase' }}>
            LinkedIn Posts Shared
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0a66c2', marginTop: '4px' }}>
            {stats.linkedinShares}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
            Personal member feed
          </div>
        </div>

        <div className="hpa-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase' }}>
            Stories Discovered
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
            {stats.totalItemsDiscovered}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
            Deduplicated in DB
          </div>
        </div>

        <div className="hpa-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase' }}>
            Active RSS Feeds
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>
            {stats.activeSourcesCount} / {sources.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
            Trusted sources
          </div>
        </div>
      </div>

      {/* Main Switchboard & Integration Status Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Automation Toggles Card */}
        <div className="hpa-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sliders size={18} style={{ color: 'var(--hpa-primary)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Publishing Safeguards & Toggles
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Master Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                background: settings?.isEnabled ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: settings?.isEnabled ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>Master Daily Automation</strong>
                <p style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  Enable or pause all scheduled runs
                </p>
              </div>
              <button
                onClick={() => handleToggle('isEnabled', !settings?.isEnabled)}
                disabled={togglingKey !== null}
                className={`hpa-btn hpa-btn-sm ${settings?.isEnabled ? 'hpa-btn-primary' : 'hpa-btn-secondary'}`}
              >
                {togglingKey === 'isEnabled' ? (
                  <>
                    <Loader2 size={12} className="hpa-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{settings?.isEnabled ? 'Enabled' : 'Paused'}</span>
                )}
              </button>
            </div>

            {/* Auto-generate Post */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>AI Article Generation</span>
                <p style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  Evaluate top news & produce original humanized content
                </p>
              </div>
              <button
                onClick={() => handleToggle('autoGenerate', !settings?.autoGenerate)}
                disabled={togglingKey !== null}
                className={`hpa-btn hpa-btn-sm ${settings?.autoGenerate ? 'hpa-btn-primary' : 'hpa-btn-secondary'}`}
              >
                {togglingKey === 'autoGenerate' ? (
                  <>
                    <Loader2 size={12} className="hpa-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{settings?.autoGenerate ? 'ON' : 'OFF'}</span>
                )}
              </button>
            </div>

            {/* Auto-publish Website */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>Auto-Publish to Website</span>
                <p style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  If OFF, creates a Reviewable Draft in Posts
                </p>
              </div>
              <button
                onClick={() => handleToggle('autoPublishWebsite', !settings?.autoPublishWebsite)}
                disabled={togglingKey !== null}
                className={`hpa-btn hpa-btn-sm ${settings?.autoPublishWebsite ? 'hpa-btn-primary' : 'hpa-btn-secondary'}`}
              >
                {togglingKey === 'autoPublishWebsite' ? (
                  <>
                    <Loader2 size={12} className="hpa-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{settings?.autoPublishWebsite ? 'Live' : 'Draft Mode'}</span>
                )}
              </button>
            </div>

            {/* Auto-publish LinkedIn */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>Auto-Publish to LinkedIn</span>
                <p style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  Post commentary to your authorized personal profile
                </p>
              </div>
              <button
                onClick={() => handleToggle('autoPublishLinkedIn', !settings?.autoPublishLinkedIn)}
                disabled={togglingKey !== null}
                className={`hpa-btn hpa-btn-sm ${settings?.autoPublishLinkedIn ? 'hpa-btn-primary' : 'hpa-btn-secondary'}`}
              >
                {togglingKey === 'autoPublishLinkedIn' ? (
                  <>
                    <Loader2 size={12} className="hpa-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{settings?.autoPublishLinkedIn ? 'Active' : 'Disabled'}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Schedule & Integration Status Card */}
        <div className="hpa-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={18} style={{ color: '#38bdf8' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Schedule & Integration Services
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem' }}>
            {/* Daily Schedule Banner */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Target Daily Time:</span>
                <strong style={{ color: '#38bdf8' }}>9:00 AM IST (3:30 AM UTC)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Vercel Cron Expression:</span>
                <code style={{ color: '#ffffff' }}>30 3 * * *</code>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', marginTop: '6px' }}>
                💡 Enforced via <code>vercel.json</code>. Vercel Hobby schedules run with slight queue variation.
              </div>
            </div>

            {/* AI Provider Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#ffffff' }}>AI Provider</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)' }}>
                  Model: <code style={{ color: 'var(--hpa-primary)' }}>{aiInfo?.model || 'gemini-2.5-flash'}</code>
                </div>
              </div>
              <div>
                {aiInfo?.isConfigured ? (
                  <span className="hpa-pill hpa-pill-published" style={{ fontSize: '0.72rem' }}>
                    <CheckCircle2 size={11} style={{ marginRight: '4px' }} />
                    Configured ({aiInfo.provider})
                  </span>
                ) : (
                  <span className="hpa-pill hpa-pill-draft" style={{ fontSize: '0.72rem' }}>
                    <AlertTriangle size={11} style={{ marginRight: '4px' }} />
                    Key Missing
                  </span>
                )}
              </div>
            </div>

            {/* LinkedIn Account Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#0a66c2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    overflow: 'hidden',
                  }}
                >
                  {linkedInInfo?.avatarUrl ? (
                    <img src={linkedInInfo.avatarUrl} alt="IN" style={{ width: '100%', height: '100%' }} />
                  ) : (
                    'in'
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>
                    {linkedInInfo?.name || 'Personal LinkedIn'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)' }}>
                    {linkedInInfo?.personUrn ? linkedInInfo.personUrn : 'Not Authorized'}
                  </div>
                </div>
              </div>

              <Link
                href="/admin/settings"
                className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                title="Manage LinkedIn OAuth"
              >
                <span>{linkedInInfo?.isConnected ? 'Manage' : 'Connect'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--hpa-border)',
          marginBottom: '20px',
          gap: '4px',
        }}
      >
        <button
          onClick={() => setActiveTab('runs')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'runs' ? '2px solid var(--hpa-primary)' : '2px solid transparent',
            color: activeTab === 'runs' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Layers size={15} />
          <span>Execution History & Runs ({recentRuns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'sources' ? '2px solid var(--hpa-primary)' : '2px solid transparent',
            color: activeTab === 'sources' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Radio size={15} />
          <span>Trusted RSS Sources ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid var(--hpa-primary)' : '2px solid transparent',
            color: activeTab === 'settings' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Settings size={15} />
          <span>Topics & AI Models</span>
        </button>
      </div>

      {/* TAB 1: EXECUTION RUNS HISTORY */}
      {activeTab === 'runs' && (
        <div className="hpa-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Recent Daily News Executions
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                Every run is tracked with separate stages for discovery, content generation, website post, and LinkedIn share.
              </p>
            </div>
            <button onClick={fetchStatus} disabled={loading} className="hpa-btn hpa-btn-secondary hpa-btn-sm">
              <RefreshCw size={12} className={loading ? 'hpa-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Log'}</span>
            </button>
          </div>

          {recentRuns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--hpa-text-dim)' }}>
              <Newspaper size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.88rem' }}>No daily runs recorded yet.</p>
              <p style={{ fontSize: '0.78rem' }}>Click &quot;Run Automation Now&quot; or &quot;Preview Draft&quot; to test your first news execution.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="hpa-table" style={{ width: '100%', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Trigger</th>
                    <th>Stories Discovered</th>
                    <th>Generated Article</th>
                    <th>Website Status</th>
                    <th>LinkedIn Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((r) => {
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{r.runDate}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)' }}>
                            {new Date(r.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <span
                            className="hpa-pill"
                            style={{
                              fontSize: '0.7rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--hpa-text-dim)',
                            }}
                          >
                            {r.triggerType}
                          </span>
                        </td>
                        <td>
                          <div style={{ color: '#ffffff' }}>{r.itemsDiscovered} found</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>
                            {r.sourcesChecked} sources checked • {r.duplicatesSkipped} duplicates skipped
                          </div>
                        </td>
                        <td>
                          {r.articleTitle ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#ffffff', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.articleTitle}
                              </div>
                              {r.articleSlug && (
                                <Link
                                  href={`/insights/${r.articleSlug}/`}
                                  target="_blank"
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--hpa-primary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <span>View Article</span>
                                  <ExternalLink size={10} />
                                </Link>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--hpa-text-dim)' }}>None</span>
                          )}
                        </td>
                        <td>
                          {r.websiteStatus === 'published' ? (
                            <span className="hpa-pill hpa-pill-published" style={{ fontSize: '0.7rem' }}>
                              Published
                            </span>
                          ) : r.websiteStatus === 'draft_saved' ? (
                            <span className="hpa-pill hpa-pill-draft" style={{ fontSize: '0.7rem' }}>
                              Draft Saved
                            </span>
                          ) : r.websiteStatus === 'failed' ? (
                            <span className="hpa-pill hpa-pill-danger" style={{ fontSize: '0.7rem' }}>
                              Failed
                            </span>
                          ) : (
                            <span className="hpa-pill" style={{ fontSize: '0.7rem' }}>
                              {r.websiteStatus}
                            </span>
                          )}
                        </td>
                        <td>
                          {r.linkedinStatus === 'published' ? (
                            <span className="hpa-pill hpa-pill-published" style={{ fontSize: '0.7rem', background: 'rgba(10, 102, 194, 0.15)', borderColor: '#0a66c2', color: '#38bdf8' }}>
                              Shared
                            </span>
                          ) : r.linkedinStatus === 'failed' || r.linkedinStatus === 'needs_reconnect' ? (
                            <span className="hpa-pill hpa-pill-danger" style={{ fontSize: '0.7rem' }}>
                              {r.linkedinStatus === 'needs_reconnect' ? 'Needs Reconnect' : 'Failed'}
                            </span>
                          ) : (
                            <span className="hpa-pill" style={{ fontSize: '0.7rem' }}>
                              {r.linkedinStatus}
                            </span>
                          )}
                        </td>
                        <td>
                          {/* Retry button if LinkedIn failed and post exists */}
                          {r.postId && r.linkedinStatus !== 'published' && (
                            <button
                              onClick={() => handleRetryLinkedIn(r.id)}
                              disabled={retryingId === r.id}
                              className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                              title="Publish this article to LinkedIn now"
                              style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                            >
                              {retryingId === r.id ? (
                                <Loader2 size={11} className="hpa-spin" />
                              ) : (
                                <Share2 size={11} />
                              )}
                              <span>{retryingId === r.id ? 'Publishing...' : 'Publish IN'}</span>
                            </button>
                          )}
                          {r.errorDetails && (
                            <div
                              style={{
                                fontSize: '0.7rem',
                                color: '#ef4444',
                                marginTop: '4px',
                                maxWidth: '180px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={r.errorDetails.message}
                            >
                              {r.errorDetails.message}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRUSTED RSS SOURCES */}
      {activeTab === 'sources' && (
        <div className="hpa-card" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Configured RSS & News Feeds
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                Every source is checked daily within the configured lookback window. You can add, toggle, or test feeds.
              </p>
            </div>
            <button onClick={() => setNewSourceOpen(true)} className="hpa-btn hpa-btn-primary hpa-btn-sm">
              <Plus size={13} />
              <span>Add New RSS Feed</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="hpa-table" style={{ width: '100%', fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th>Feed Name</th>
                  <th>Category</th>
                  <th>Feed URL</th>
                  <th>Status</th>
                  <th>Last Fetched</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => (
                  <tr key={src.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{src.name}</div>
                    </td>
                    <td>
                      <span className="hpa-pill" style={{ fontSize: '0.72rem' }}>
                        {src.category}
                      </span>
                    </td>
                    <td>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: 'var(--hpa-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          maxWidth: '260px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>{src.url}</span>
                        <ExternalLink size={10} />
                      </a>
                    </td>
                    <td>
                      {src.lastStatus === 'ok' ? (
                        <span className="hpa-pill hpa-pill-published" style={{ fontSize: '0.7rem' }}>
                          Healthy
                        </span>
                      ) : src.lastStatus === 'error' ? (
                        <span
                          className="hpa-pill hpa-pill-danger"
                          style={{ fontSize: '0.7rem' }}
                          title={src.errorMessage || 'Feed error'}
                        >
                          Error
                        </span>
                      ) : (
                        <span className="hpa-pill" style={{ fontSize: '0.7rem' }}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.75rem' }}>
                        {src.lastFetchedAt
                          ? new Date(src.lastFetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleSource(src.id, src.isActive)}
                        disabled={togglingSourceId === src.id}
                        className={`hpa-btn hpa-btn-sm ${src.isActive ? 'hpa-btn-secondary' : ''}`}
                        style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                      >
                        {togglingSourceId === src.id ? (
                          <>
                            <Loader2 size={11} className="hpa-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>{src.isActive ? 'Active' : 'Disabled'}</span>
                        )}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteSource(src.id, src.name)}
                        disabled={deletingSourceId === src.id}
                        className="hpa-btn hpa-btn-danger hpa-btn-sm"
                        style={{ padding: '3px 6px' }}
                        title="Delete source"
                      >
                        {deletingSourceId === src.id ? (
                          <Loader2 size={12} className="hpa-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURATION & AI MODELS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveAllSettings} className="hpa-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
            Automation Pipeline Settings & Topics
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '20px' }}>
            {/* AI Model Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '6px' }}>
                AI Generation Model
              </label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="hpa-input"
                style={{ width: '100%' }}
              >
                <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Recommended - Ultra-fast & factual)</option>
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
              </select>
            </div>

            {/* Lookback Window */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '6px' }}>
                Recent News Lookback Window (Hours)
              </label>
              <input
                type="number"
                min="6"
                max="72"
                value={settings.lookbackHours}
                onChange={(e) => setSettings({ ...settings, lookbackHours: parseInt(e.target.value, 10) || 24 })}
                className="hpa-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Schedule Display */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '6px' }}>
                Target Posting Schedule (Cron)
              </label>
              <input
                type="text"
                value={settings.scheduleCron}
                onChange={(e) => setSettings({ ...settings, scheduleCron: e.target.value })}
                className="hpa-input"
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', marginTop: '4px' }}>
                Vercel Cron: <code>30 3 * * *</code> (9:00 AM IST)
              </div>
            </div>
          </div>

          {/* Topics List */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '6px' }}>
              Covered Technology Topics (Comma-separated)
            </label>
            <input
              type="text"
              value={settings.topics.join(', ')}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  topics: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                })
              }
              className="hpa-input"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="hpa-btn hpa-btn-primary"
          >
            {savingSettings ? <Loader2 size={14} className="hpa-spin" /> : <Check size={14} />}
            <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      )}

      {/* MODAL: ADD RSS FEED */}
      {newSourceOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="hpa-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={18} style={{ color: 'var(--hpa-primary)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Add Trusted RSS News Source
                </h3>
              </div>
              <button
                onClick={() => setNewSourceOpen(false)}
                className="hpa-btn hpa-btn-secondary hpa-btn-icon"
                style={{ padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSource}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '4px' }}>
                  Source Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI Engineering Blog"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  required
                  className="hpa-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '4px' }}>
                  Feed URL (RSS or Atom XML)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="https://example.com/feed.xml"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    required
                    className="hpa-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleTestFeed}
                    disabled={testingFeed || !sourceUrl.trim()}
                    className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                  >
                    {testingFeed ? <Loader2 size={12} className="hpa-spin" /> : <RefreshCw size={12} />}
                    <span>Test</span>
                  </button>
                </div>
                {testFeedResult && (
                  <div
                    style={{
                      fontSize: '0.76rem',
                      marginTop: '6px',
                      color: testFeedResult.startsWith('✅') ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {testFeedResult}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={sourceCategory}
                  onChange={(e) => setSourceCategory(e.target.value)}
                  className="hpa-input"
                  style={{ width: '100%' }}
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Web Development & Frameworks">Web Development & Frameworks</option>
                  <option value="Software Architecture">Software Architecture</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Tech Startups & Business">Tech Startups & Business</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setNewSourceOpen(false)}
                  className="hpa-btn hpa-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSource}
                  className="hpa-btn hpa-btn-primary"
                >
                  {savingSource ? <Loader2 size={14} className="hpa-spin" /> : <Plus size={14} />}
                  <span>Add Source</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW GENERATED POST DRAFT */}
      {previewModalOpen && previewData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="hpa-card"
            style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--hpa-border)', paddingBottom: '14px' }}>
              <div>
                <span className="hpa-pill hpa-pill-draft" style={{ fontSize: '0.72rem', marginBottom: '6px' }}>
                  Simulated Dry-Run Preview
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {previewData.title}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', marginTop: '4px' }}>
                  Slug: <code>{previewData.slug}</code> • Read: {previewData.readMins} • Category: {previewData.categoryName}
                </div>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="hpa-btn hpa-btn-secondary hpa-btn-icon"
                style={{ padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Cover Image Preview */}
            {(previewData as any).coverImage && (
              <div
                style={{
                  marginBottom: '18px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  maxHeight: '240px',
                  position: 'relative',
                }}
              >
                <img
                  src={(previewData as any).coverImage}
                  alt={previewData.title}
                  style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    color: '#ffffff',
                  }}
                >
                  Feature Cover Image (Saved in Media Vault)
                </span>
              </div>
            )}

            {/* Excerpt */}
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                marginBottom: '20px',
                fontSize: '0.86rem',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.5,
              }}
            >
              <strong>Executive Summary:</strong> {previewData.excerpt}
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
              {previewData.sections.map((sec, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--hpa-primary)', margin: '0 0 8px 0' }}>
                    {sec.heading}
                  </h4>
                  {sec.paragraphs.map((p, pIdx) => {
                    const imgMatch = p.trim().match(/^!\[([^\]]*)\]\(([^)"\s]+)(?:\s+"([^"]*)")?\)$/);
                    if (imgMatch) {
                      return (
                        <div key={pIdx} style={{ margin: '12px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={imgMatch[2]} alt={imgMatch[1]} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                          <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)', padding: '6px 10px', background: 'rgba(0,0,0,0.3)' }}>
                            ✦ {imgMatch[3] || imgMatch[1]} (Saved in Media Vault)
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p key={pIdx} style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: '0 0 8px 0' }}>
                        {p}
                      </p>
                    );
                  })}
                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '0.84rem', color: 'rgba(255,255,255,0.85)' }}>
                      {sec.bulletPoints.map((b, bIdx) => (
                        <li key={bIdx} style={{ marginBottom: '4px' }}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {sec.quote && (
                    <blockquote style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: '12px', fontStyle: 'italic', color: '#c4b5fd', margin: '8px 0' }}>
                      {sec.quote}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>

            {/* LinkedIn Post Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(10, 102, 194, 0.08)',
                border: '1px solid rgba(10, 102, 194, 0.3)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#38bdf8' }}>
                <Share2 size={16} />
                <strong style={{ fontSize: '0.9rem' }}>Synchronized LinkedIn Post Commentary</strong>
              </div>
              <pre
                style={{
                  fontSize: '0.82rem',
                  color: '#ffffff',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {previewData.linkedinPost}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="hpa-btn hpa-btn-secondary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

