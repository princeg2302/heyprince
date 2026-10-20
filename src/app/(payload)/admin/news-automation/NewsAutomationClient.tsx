'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Newspaper,
  RefreshCw,
  Play,
  Eye,
  Edit2,
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
  Smile,
  Globe,
  Calendar,
  Filter,
  MapPin,
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
  const [activeTab, setActiveTab] = useState<'runs' | 'sources' | 'editorial' | 'settings'>('runs');

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
  const [runningMeme, setRunningMeme] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<GeneratedContentPayload | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [publishingDraftId, setPublishingDraftId] = useState<number | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [togglingSourceId, setTogglingSourceId] = useState<number | null>(null);
  const [deletingSourceId, setDeletingSourceId] = useState<number | null>(null);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<'tech_news' | 'office_humour_meme' | 'custom_topic' | 'auto'>('tech_news');
  const [modalCustomTopic, setModalCustomTopic] = useState('');
  const [customTopicPrompt, setCustomTopicPrompt] = useState('');
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [previewingCustom, setPreviewingCustom] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<{ id: number; name: string } | null>(null);

  // Global RSS Filters
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  // New source form modal
  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceCategory, setSourceCategory] = useState('Artificial Intelligence');
  const [newSourceRegion, setNewSourceRegion] = useState('Global');
  const [newSourceLanguage, setNewSourceLanguage] = useState('en');
  const [newSourceTopic, setNewSourceTopic] = useState('Artificial Intelligence');
  const [newSourcePriority, setNewSourcePriority] = useState(1);
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

  // Open manual execution confirmation modal
  const handleOpenRunConfirm = () => {
    setRunConfirmOpen(true);
  };

  // Trigger manual execution after modal confirmation
  const handleConfirmRunNow = async () => {
    setRunConfirmOpen(false);
    setRunningNow(true);
    try {
      const res = await fetch('/api/admin/news-automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: selectedContentType === 'auto' ? undefined : selectedContentType,
          customTopic: selectedContentType === 'custom_topic' ? modalCustomTopic.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Pipeline finished: ${data.status} (Website: ${data.websiteStatus}, LinkedIn: ${data.linkedinStatus})`,
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

  // Generate post from custom prompt / festival topic
  const handleGenerateCustomPost = async (asPreview = false) => {
    if (!customTopicPrompt.trim()) {
      showToast('Please enter a topic or instruction (e.g. "Aaj India me Dussehra hai").', 'info');
      return;
    }

    if (asPreview) {
      setPreviewingCustom(true);
      try {
        const res = await fetch('/api/admin/news-automation/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'custom_topic',
            customTopic: customTopicPrompt.trim(),
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error || `Server responded with ${res.status}: ${res.statusText}`, 'error');
          return;
        }
        const data = await res.json();
        if (data.success && data.generatedContent) {
          setPreviewData(data.generatedContent);
          setPreviewModalOpen(true);
          showToast('Custom article preview draft generated!', 'success');
          fetchStatus();
        } else {
          showToast(`Preview failed: ${data.error || 'Unknown error'}`, 'error');
        }
      } catch (err: any) {
        console.error('[CustomPreview] Error:', err);
        showToast(err?.message ? `Preview failed: ${err.message}` : 'Network error while generating preview', 'error');
      } finally {
        setPreviewingCustom(false);
      }
    } else {
      setGeneratingCustom(true);
      try {
        const res = await fetch('/api/admin/news-automation/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'custom_topic',
            customTopic: customTopicPrompt.trim(),
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error || `Server responded with ${res.status}: ${res.statusText}`, 'error');
          return;
        }
        const data = await res.json();
        if (data.success) {
          showToast(
            `Article published! Website: ${data.websiteStatus}, LinkedIn: ${data.linkedinStatus}`,
            'success'
          );
          setCustomTopicPrompt('');
          fetchStatus();
        } else {
          showToast(`Generation failed: ${data.error || 'Unknown error'}`, 'error');
        }
      } catch (err: any) {
        console.error('[CustomGeneration] Error:', err);
        showToast(err?.message ? `Execution failed: ${err.message}` : 'Network error while executing custom generation', 'error');
      } finally {
        setGeneratingCustom(false);
      }
    }
  };

  // Trigger quick meme generation
  const handleRunMemeNow = async () => {
    setRunningMeme(true);
    try {
      const res = await fetch('/api/admin/news-automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'office_humour_meme' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Indian Office Humour Meme published! Website: ${data.websiteStatus}, LinkedIn: ${data.linkedinStatus}`,
          'success'
        );
        fetchStatus();
      } else {
        showToast(`Meme generation error: ${data.error || 'Failed'}`, 'error');
      }
    } catch {
      showToast('Network error during meme generation', 'error');
    } finally {
      setRunningMeme(false);
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

  // Publish draft or preview run to live CMS and LinkedIn
  const handlePublishDraft = async (runId: number) => {
    setPublishingDraftId(runId);
    try {
      const res = await fetch('/api/admin/news-automation/publish-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Article published to CMS and personal LinkedIn successfully!', 'success');
        fetchStatus();
      } else {
        showToast(data.error || 'Failed to publish draft run', 'error');
      }
    } catch {
      showToast('Network error publishing draft', 'error');
    } finally {
      setPublishingDraftId(null);
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
          region: newSourceRegion,
          language: newSourceLanguage,
          topic: newSourceTopic,
          priority: newSourcePriority,
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

  // Open delete source confirmation modal
  const handleOpenDeleteSource = (id: number, name: string) => {
    setSourceToDelete({ id, name });
  };

  // Delete Source after modal confirmation
  const handleConfirmDeleteSource = async () => {
    if (!sourceToDelete) return;
    const { id, name } = sourceToDelete;
    setDeletingSourceId(id);
    try {
      const res = await fetch(`/api/admin/news-automation/sources?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`RSS source "${name}" deleted.`, 'success');
        setSourceToDelete(null);
        fetchStatus();
      } else {
        showToast('Failed to delete source', 'error');
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
            onClick={handleOpenRunConfirm}
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

      {/* Executive Health & Diagnostics Section (Phase 1 & Phase 2 Requirements) */}
      {recentRuns.length > 0 && (() => {
        const lastRun = recentRuns[0];
        const lastRunDate = lastRun.startedAt || lastRun.createdAt;
        const lastRunIST = lastRunDate
          ? new Date(lastRunDate).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              dateStyle: 'medium',
              timeStyle: 'medium',
            }) + ' IST'
          : 'None';

        const isHealthy = lastRun.status === 'success';
        const hasWarning = lastRun.status === 'partial_success';
        const isFailed = lastRun.status === 'failed';

        return (
          <div
            className="hpa-card"
            style={{
              padding: '20px',
              marginBottom: '20px',
              border: isFailed
                ? '1px solid rgba(244, 63, 94, 0.35)'
                : hasWarning
                ? '1px solid rgba(245, 158, 11, 0.35)'
                : '1px solid rgba(34, 197, 94, 0.25)',
              background: isFailed
                ? 'linear-gradient(180deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 17, 23, 0.8) 100%)'
                : hasWarning
                ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 17, 23, 0.8) 100%)'
                : 'linear-gradient(180deg, rgba(34, 197, 94, 0.06) 0%, rgba(15, 17, 23, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--hpa-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={18} style={{ color: isFailed ? '#fb7185' : hasWarning ? '#f59e0b' : '#22c55e' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Automation Pipeline Health &amp; Diagnostics
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`hpa-pill ${isFailed ? 'hpa-pill-danger' : hasWarning ? 'hpa-pill-draft' : 'hpa-pill-published'}`} style={{ fontSize: '0.74rem' }}>
                  {isFailed ? 'Attention Required' : hasWarning ? 'Partial Success' : 'System Operational'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Last Execution (IST)</span>
                <div style={{ fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>{lastRunIST}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
                  Trigger: <code>{lastRun.triggerType}</code> • Status: <strong style={{ color: isFailed ? '#fb7185' : hasWarning ? '#f59e0b' : '#22c55e' }}>{lastRun.status}</strong>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Next Scheduled Execution (IST)</span>
                <div style={{ fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>Everyday at 9:00 AM IST</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
                  Vercel UTC Cron: <code>30 3 * * *</code> (Asia/Kolkata)
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Last Website Publication</span>
                <div style={{ marginTop: '2px' }}>
                  {lastRun.articleSlug ? (
                    <a
                      href={`https://heyprince.in/insights/${lastRun.articleSlug}/`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#38bdf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>{lastRun.articleTitle?.slice(0, 32)}...</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--hpa-text-dim)' }}>Draft Saved in CMS</span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
                  Status: <code>{lastRun.websiteStatus}</code>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Last LinkedIn Result</span>
                <div style={{ marginTop: '2px' }}>
                  {lastRun.linkedinShareUrl ? (
                    <a
                      href={lastRun.linkedinShareUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0a66c2', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>View LinkedIn Post</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--hpa-text-dim)' }}>
                      {lastRun.linkedinStatus === 'needs_reconnect' ? '⚠️ Reconnection Needed' : lastRun.linkedinStatus}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
                  Status: <code>{lastRun.linkedinStatus}</code>
                </div>
              </div>
            </div>

            {/* Error Diagnostics Banner if failed */}
            {lastRun.errorDetails && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  fontSize: '0.78rem',
                  color: '#fecdd3',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#fb7185', marginBottom: '2px' }}>
                  <AlertCircle size={13} />
                  <span>Diagnostic Blocker (Stage: {lastRun.errorDetails.stage || 'Pipeline'}):</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#ffffff' }}>
                  {lastRun.errorDetails.message}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
          overflowX: 'auto',
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
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Layers size={15} />
          <span>Execution History &amp; Runs ({recentRuns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'sources' ? '2px solid var(--hpa-primary)' : '2px solid transparent',
            color: activeTab === 'sources' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Globe size={15} />
          <span>Worldwide RSS Feeds ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('editorial')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'editorial' ? '2px solid var(--hpa-primary)' : '2px solid transparent',
            color: activeTab === 'editorial' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Calendar size={15} />
          <span>Editorial Mix &amp; Desi Memes</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid var(--hpa-primary)' : '2px solid transparent',
            color: activeTab === 'settings' ? '#ffffff' : 'var(--hpa-text-dim)',
            padding: '10px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Settings size={15} />
          <span>Topics &amp; AI Models</span>
        </button>
      </div>

      {/* TAB 1: EXECUTION RUNS HISTORY */}
      {activeTab === 'runs' && (
        <>
          {/* Custom Topic / Event Prompt Box */}
          <div
            className="hpa-card"
            style={{
              padding: '22px',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.09) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Custom Topic / Festival AI Generator
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--hpa-text-dim)', margin: '2px 0 0 0' }}>
                    Write any topic or prompt in Hindi, English, or Hinglish (e.g. &apos;Aaj India me Dussehra hai, uske baare me post karo&apos;). Gemini will write the article, generate the AI cover image, and publish to website &amp; LinkedIn.
                  </p>
                </div>
              </div>

              <span
                className="hpa-pill hpa-pill-published"
                style={{ fontSize: '0.72rem', padding: '3px 9px', letterSpacing: '0.4px', textTransform: 'uppercase' }}
              >
                On-Demand AI
              </span>
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', fontWeight: 600 }}>
                Quick Ideas:
              </span>
              {[
                { label: '🏹 Dussehra & Tech Debt', prompt: 'Aaj India me Dussehra hai, slaying technical debt aur software engineering excellence ke nazariye se insightful post banao' },
                { label: '🪔 Diwali & Clean Architecture', prompt: 'Diwali celebration: bringing light to dark legacy codebases, clean architecture, and engineering craftsmanship' },
                { label: '🇮🇳 Republic Day & Indian Tech', prompt: 'Republic Day: The rise of Indian engineering powerhouses, deep tech startups, and digital public infrastructure' },
                { label: '🤖 Autonomous AI Agents', prompt: 'The reality of autonomous AI coding agents in 2026: architecture, tool calling, and developer velocity' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setCustomTopicPrompt(chip.prompt)}
                  className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                  style={{
                    fontSize: '0.73rem',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Textarea Input */}
            <div style={{ marginBottom: '12px' }}>
              <textarea
                value={customTopicPrompt}
                onChange={(e) => setCustomTopicPrompt(e.target.value)}
                placeholder="e.g. Aaj India me Dussehra hai, uske baare me post karo (ya koi bhi specific festival / tech announcement)..."
                rows={2}
                disabled={generatingCustom || previewingCustom}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(10, 12, 20, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  lineHeight: '1.45',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Action Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                🚀 Generates structured markdown + AI WebP cover image + personal &amp; company LinkedIn commentary.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleGenerateCustomPost(true)}
                  disabled={generatingCustom || previewingCustom || !customTopicPrompt.trim()}
                  className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                  style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                >
                  {previewingCustom ? <Loader2 size={13} className="hpa-spin" /> : <Eye size={13} />}
                  <span>{previewingCustom ? 'Synthesizing...' : 'Preview Draft'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateCustomPost(false)}
                  disabled={generatingCustom || previewingCustom || !customTopicPrompt.trim()}
                  className="hpa-btn hpa-btn-primary hpa-btn-sm"
                  style={{
                    padding: '7px 16px',
                    fontSize: '0.8rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    borderColor: 'transparent',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {generatingCustom ? <Loader2 size={13} className="hpa-spin" /> : <Sparkles size={13} />}
                  <span>{generatingCustom ? 'Generating & Publishing...' : 'Generate & Publish Post'}</span>
                </button>
              </div>
            </div>
          </div>

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
                              <div style={{ fontWeight: 600, color: '#ffffff', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.articleTitle}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {r.articleContent && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewData(r.articleContent as any);
                                      setPreviewModalOpen(true);
                                    }}
                                    style={{
                                      background: 'rgba(56, 189, 248, 0.1)',
                                      border: '1px solid rgba(56, 189, 248, 0.3)',
                                      color: '#38bdf8',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                    title="View full generated article draft and LinkedIn post"
                                  >
                                    <Eye size={11} />
                                    <span>Read Draft</span>
                                  </button>
                                )}
                                {r.postId && (
                                  <Link
                                    href={`/admin/posts/${r.postId}/edit`}
                                    style={{
                                      fontSize: '0.72rem',
                                      color: '#a855f7',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      textDecoration: 'none',
                                    }}
                                    title="Edit this post in the CMS editor"
                                  >
                                    <Edit2 size={11} />
                                    <span>Edit in CMS</span>
                                  </Link>
                                )}
                                {r.articleSlug && r.websiteStatus === 'published' && (
                                  <Link
                                    href={`/insights/${r.articleSlug}/`}
                                    target="_blank"
                                    style={{
                                      fontSize: '0.72rem',
                                      color: 'var(--hpa-primary)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <span>View Live</span>
                                    <ExternalLink size={10} />
                                  </Link>
                                )}
                              </div>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {/* Publish Draft to CMS & LinkedIn button if run has content but no post_id yet */}
                            {!r.postId && r.articleContent && (
                              <button
                                onClick={() => handlePublishDraft(r.id)}
                                disabled={publishingDraftId === r.id}
                                className="hpa-btn hpa-btn-primary hpa-btn-sm"
                                title="Publish this draft to website CMS &amp; LinkedIn"
                                style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                              >
                                {publishingDraftId === r.id ? (
                                  <Loader2 size={11} className="hpa-spin" />
                                ) : (
                                  <Sparkles size={11} />
                                )}
                                <span>{publishingDraftId === r.id ? 'Publishing...' : 'Publish to CMS'}</span>
                              </button>
                            )}

                            {/* Edit in CMS link if post already exists */}
                            {r.postId && (
                              <Link
                                href={`/admin/posts/${r.postId}/edit`}
                                className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                                title="Edit this post in the CMS editor"
                                style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                              >
                                <Edit2 size={11} />
                                <span>Edit</span>
                              </Link>
                            )}

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
                                <span>{retryingId === r.id ? 'Sharing...' : 'Share IN'}</span>
                              </button>
                            )}
                          </div>
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
        </>
      )}

      {/* TAB 2: WORLDWIDE RSS SOURCES */}
      {activeTab === 'sources' && (() => {
        const filteredSources = sources.filter((src) => {
          if (regionFilter !== 'all' && src.region !== regionFilter) return false;
          if (topicFilter !== 'all' && src.topic !== topicFilter) return false;
          return true;
        });

        const getRegionFlag = (reg?: string) => {
          switch (reg) {
            case 'India':
              return '🇮🇳 India';
            case 'USA':
              return '🇺🇸 USA';
            case 'UK':
              return '🇬🇧 UK';
            case 'Australia':
              return '🇦🇺 Australia';
            case 'Germany & Europe':
              return '🇩🇪 Europe';
            case 'Worldwide':
            case 'Global':
            default:
              return '🌐 Global';
          }
        };

        return (
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
                  Worldwide RSS &amp; Verified Primary Feeds ({filteredSources.length} of {sources.length})
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  Active coverage across India, USA, UK, Australia, Germany &amp; Europe, DeepMind, OpenAI, and Elon Musk enterprises.
                </p>
              </div>
              <button onClick={() => setNewSourceOpen(true)} className="hpa-btn hpa-btn-primary hpa-btn-sm">
                <Plus size={13} />
                <span>Add New RSS Feed</span>
              </button>
            </div>

            {/* Region Filter Bar */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '16px',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--hpa-text-dim)', marginRight: '4px' }}>
                <Filter size={13} />
                <span>Filter Region:</span>
              </div>
              {['all', 'India', 'USA', 'UK', 'Australia', 'Germany & Europe', 'Worldwide'].map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setRegionFilter(reg)}
                  className={`hpa-btn hpa-btn-sm ${regionFilter === reg ? 'hpa-btn-primary' : 'hpa-btn-secondary'}`}
                  style={{ fontSize: '0.74rem', padding: '3px 10px' }}
                >
                  {reg === 'all' ? 'All Regions' : getRegionFlag(reg)}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="hpa-table" style={{ width: '100%', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Feed Name</th>
                    <th>Region &amp; Language</th>
                    <th>Category</th>
                    <th>Feed URL</th>
                    <th>Status</th>
                    <th>Last Fetched</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSources.map((src) => (
                    <tr key={src.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{src.name}</div>
                        {src.topic && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>{src.topic}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="hpa-pill" style={{ fontSize: '0.72rem' }}>
                            {getRegionFlag(src.region)}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--hpa-text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {src.language || 'EN'}
                          </span>
                        </div>
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
                            maxWidth: '220px',
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
                          onClick={() => handleOpenDeleteSource(src.id, src.name)}
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
        );
      })()}

      {/* TAB 3: EDITORIAL MIX & DESI OFFICE HUMOUR MEMES */}
      {activeTab === 'editorial' && settings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Weekly Content Mix Strategy Card */}
          <div className="hpa-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Calendar size={18} style={{ color: 'var(--hpa-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Weekly Editorial Mix &amp; Content Strategy
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '18px', lineHeight: 1.5 }}>
              Maintain audience engagement by distributing daily posts across serious technical breakdowns, deep architectural reviews, relatable Indian office memes, and industry events.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd' }}>Daily Tech News &amp; AI</span>
                  <span className="hpa-pill hpa-pill-published" style={{ fontSize: '0.7rem' }}>50% (3-4/wk)</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  Mon, Wed, Fri: High-impact AI announcements, model releases, and web development tooling.
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c084fc' }}>Deep Architecture</span>
                  <span className="hpa-pill" style={{ fontSize: '0.7rem' }}>20% (1/wk)</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  Tuesday: Microservices, database scaling, frontend performance, and production post-mortems.
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fcd34d' }}>Desi Office Memes</span>
                  <span className="hpa-pill hpa-pill-draft" style={{ fontSize: '0.7rem' }}>20% (1-2/wk)</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  Thursday: Relatable Indian IT workplace humour (Friday prod deploy, Bangalore traffic, chai breaks).
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6ee7b7' }}>Events &amp; Launches</span>
                  <span className="hpa-pill" style={{ fontSize: '0.7rem' }}>10% (Weekend)</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  Sat/Sun: Tech conferences, product launches, developer tools showcases, and hackathons.
                </p>
              </div>
            </div>

            {/* Content Type Selector for Next Run */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--hpa-border)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Content Generation Mode for Scheduled 9 AM Runs:
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { id: 'tech_news', label: 'Tech News & AI (Default)', desc: 'Fact-checked industry news' },
                  { id: 'office_humour_meme', label: 'Desi Office Humour Meme', desc: 'Custom SVG card + Indian IT humor' },
                  { id: 'auto', label: 'Auto (Follow Weekly Mix)', desc: 'Rotates based on day of week' },
                ].map((item) => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: (settings.currentContentType || 'tech_news') === item.id ? 'rgba(37, 99, 235, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: (settings.currentContentType || 'tech_news') === item.id ? '1px solid #3b82f6' : '1px solid var(--hpa-border)',
                      cursor: 'pointer',
                      flex: 1,
                      minWidth: '200px',
                    }}
                  >
                    <input
                      type="radio"
                      name="contentType"
                      value={item.id}
                      checked={(settings.currentContentType || 'tech_news') === item.id}
                      onChange={() => handleToggle('currentContentType' as any, item.id)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>{item.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)' }}>{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Instant Desi Meme Generator Card */}
          <div
            className="hpa-card"
            style={{
              padding: '24px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.06) 0%, rgba(15, 17, 23, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Instant Desi Office Humour Meme Publisher
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', margin: '3px 0 0' }}>
                    Generate an original graphic card + relatable breakdown + LinkedIn share in 1 click
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunMemeNow}
                disabled={runningMeme || runningNow}
                className="hpa-btn hpa-btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  borderColor: 'transparent',
                  padding: '10px 18px',
                  fontWeight: 700,
                  boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
                }}
              >
                {runningMeme ? <Loader2 size={14} className="hpa-spin" /> : <Play size={14} />}
                <span>{runningMeme ? 'Rendering & Publishing...' : 'Generate & Publish Meme Now'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>What this does:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--hpa-text-dim)', fontSize: '0.8rem' }}>
                <li style={{ marginBottom: '4px' }}>
                  Selects an authentic Indian tech workplace trope: <em>Chai-sutta break standups, Friday 5 PM prod releases, Bangalore Silk Board traffic vs WFH, client requirement pivots, or Jira sprint story estimates</em>.
                </li>
                <li style={{ marginBottom: '4px' }}>
                  Renders a crisp 1200x675 SVG graphic meme card with punchy typography and modern gradient palette.
                </li>
                <li style={{ marginBottom: '4px' }}>
                  Uploads the SVG to Supabase Storage (<code>media/memes/</code>) and catalogs it in your Media Vault.
                </li>
                <li style={{ marginBottom: '4px' }}>
                  Inserts a full post into your Posts CMS at <code>/insights/[slug]/</code> with a relatable humanized essay on corporate tech life.
                </li>
                <li>
                  Shares a witty, engaging post to your personal LinkedIn feed with relevant hashtags (<code>#IndianTech #DeveloperLife #TechHumour</code>).
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURATION & AI MODELS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveAllSettings} className="hpa-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
            Automation Pipeline Settings &amp; Topics
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
                <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Active &amp; Recommended — Verified 200 OK)</option>
                <option value="gemini-3.1-pro-preview">Google Gemini 3.1 Pro Preview (Deep Reasoning)</option>
                <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Deprecated by Google)</option>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '4px' }}>
                    Region
                  </label>
                  <select
                    value={newSourceRegion}
                    onChange={(e) => setNewSourceRegion(e.target.value)}
                    className="hpa-input"
                    style={{ width: '100%' }}
                  >
                    <option value="Global">🌐 Global / Worldwide</option>
                    <option value="India">🇮🇳 India</option>
                    <option value="USA">🇺🇸 USA</option>
                    <option value="UK">🇬🇧 UK</option>
                    <option value="Australia">🇦🇺 Australia</option>
                    <option value="Germany & Europe">🇩🇪 Germany &amp; Europe</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginBottom: '4px' }}>
                    Language
                  </label>
                  <select
                    value={newSourceLanguage}
                    onChange={(e) => setNewSourceLanguage(e.target.value)}
                    className="hpa-input"
                    style={{ width: '100%' }}
                  >
                    <option value="en">English (en)</option>
                    <option value="de">German (de)</option>
                    <option value="hi">Hindi (hi)</option>
                  </select>
                </div>
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

      {/* MODAL: RUN PIPELINE CONFIRMATION */}
      {runConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
          }}
          onClick={() => !runningNow && setRunConfirmOpen(false)}
        >
          <div
            className="hpa-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              position: 'relative',
              borderRadius: '18px',
              background: 'linear-gradient(180deg, #161926 0%, #0d0f17 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.85), 0 0 45px rgba(59, 130, 246, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                    Execute Daily AI News Pipeline
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', margin: '3px 0 0' }}>
                    Autonomous tech discovery, synthesis, and publishing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRunConfirmOpen(false)}
                disabled={runningNow}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--hpa-text-dim)',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.55, marginBottom: '16px' }}>
              You are about to trigger the full automated intelligence cycle. The pipeline will autonomously execute the following production stages:
            </p>

            {/* Stage breakdown cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }}>
                  <Radio size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                    1. RSS News Ingestion &amp; Deduplication
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                    Gathers stories from {stats.activeSourcesCount} active feeds (TechCrunch, Ars Technica, The Verge, etc.) with URL deduplication.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ color: '#a855f7', marginTop: '2px', flexShrink: 0 }}>
                  <Sparkles size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                    2. Grounded AI Humanized Post Generation
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                    Synthesizes the #1 tech development into an original ~500-word engineering breakdown ({settings?.aiModel || 'Gemini 3.8 Flash'}).
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }}>
                  <Layers size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                    3. Visual Assets &amp; Media Vault Cataloging
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                    Creates 1 cover image + 2 architectural diagrams, saving them into Supabase Storage and your Media Vault.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }}>
                  <Share2 size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                    4. Website &amp; LinkedIn Publishing
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                    Publishes live to <code>/insights/[slug]</code> and {settings?.autoPublishLinkedIn ? 'shares synchronized commentary to personal LinkedIn.' : 'skips LinkedIn (auto-publish toggle is off).'}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Type Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Select Content Type to Generate:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: selectedContentType === 'custom_topic' ? '12px' : '0' }}>
                {[
                  { id: 'tech_news', label: 'Tech News & AI (Default)' },
                  { id: 'custom_topic', label: 'Custom Topic / Festival Prompt' },
                  { id: 'office_humour_meme', label: 'Desi Office Humour Meme' },
                  { id: 'auto', label: 'Auto (Follow Weekly Mix)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedContentType(item.id as any)}
                    className={`hpa-btn hpa-btn-sm ${selectedContentType === item.id ? 'hpa-btn-primary' : 'hpa-btn-secondary'}`}
                    style={{ fontSize: '0.76rem', padding: '6px 12px' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {selectedContentType === 'custom_topic' && (
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#93c5fd', marginBottom: '4px', fontWeight: 600 }}>
                    Enter Topic or Prompt (Hinglish/English):
                  </label>
                  <textarea
                    value={modalCustomTopic}
                    onChange={(e) => setModalCustomTopic(e.target.value)}
                    placeholder="e.g. Aaj India me Dussehra hai, technical debt & software architecture ke nazariye se post banao..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Timing Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: '0.76rem',
                color: '#93c5fd',
                marginBottom: '20px',
              }}
            >
              <Clock size={14} style={{ flexShrink: 0 }} />
              <span>Takes approximately <strong>15–25 seconds</strong> to finish AI generation, visual rendering, and publishing.</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRunConfirmOpen(false)}
                className="hpa-btn hpa-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRunNow}
                className="hpa-btn hpa-btn-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.84rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  borderColor: 'transparent',
                  boxShadow: '0 4px 18px rgba(99, 102, 241, 0.45)',
                }}
              >
                <Play size={14} />
                <span>Start Pipeline Execution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE RSS SOURCE CONFIRMATION */}
      {sourceToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
          }}
          onClick={() => !deletingSourceId && setSourceToDelete(null)}
        >
          <div
            className="hpa-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              position: 'relative',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, #181418 0%, #0f0d11 100%)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.85), 0 0 40px rgba(244, 63, 94, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#fb7185',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Delete RSS News Source?
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--hpa-text-dim)', margin: '3px 0 0' }}>
                  Permanent source removal
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.55, marginBottom: '20px' }}>
              Are you sure you want to remove <strong>&quot;{sourceToDelete.name}&quot;</strong> from your trusted RSS feed list? Discovered articles already archived in your database will not be affected.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSourceToDelete(null)}
                disabled={deletingSourceId !== null}
                className="hpa-btn hpa-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSource}
                disabled={deletingSourceId !== null}
                className="hpa-btn hpa-btn-danger"
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                {deletingSourceId !== null ? <Loader2 size={13} className="hpa-spin" /> : <Trash2 size={13} />}
                <span>Delete Source</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

