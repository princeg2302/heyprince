'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Play,
  RotateCw,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Settings,
  ExternalLink,
  Loader2,
  Trash2,
  ShieldCheck,
  Film,
  Layers,
  FileText,
  Volume2,
  Subtitles,
  UploadCloud,
  Check,
  X,
  Plus,
  Download,
} from 'lucide-react';
import {
  VideoStudioJob,
  VideoJobStatus,
  StorageDashboardSummary,
  VideoStudioSettings,
  StoryboardScene,
  QualityCheckItem,
} from '@/lib/video-studio/types';

const PIPELINE_STAGES: { key: VideoJobStatus; label: string; icon: any }[] = [
  { key: 'queued', label: 'Queued', icon: Clock },
  { key: 'researching', label: 'Research', icon: FileText },
  { key: 'scripting', label: 'Hindi Script', icon: FileText },
  { key: 'storyboarding', label: 'Storyboard', icon: Layers },
  { key: 'generating_visuals', label: 'Visual Scenes', icon: Film },
  { key: 'generating_voiceover', label: 'Hindi Voice', icon: Volume2 },
  { key: 'subtitle_generation', label: 'Subtitles', icon: Subtitles },
  { key: 'rendering', label: 'Encoding', icon: Video },
  { key: 'quality_check', label: 'Quality QA', icon: ShieldCheck },
  { key: 'uploading_to_r2', label: 'R2 Upload', icon: UploadCloud },
  { key: 'publishing_to_youtube', label: 'YouTube Post', icon: Play },
  { key: 'published', label: 'Published', icon: CheckCircle2 },
];

export default function VideoStudioClient() {
  const [jobs, setJobs] = useState<VideoStudioJob[]>([]);
  const [activeJob, setActiveJob] = useState<VideoStudioJob | null>(null);
  const [storageSummary, setStorageSummary] = useState<StorageDashboardSummary | null>(null);
  const [settings, setSettings] = useState<VideoStudioSettings | null>(null);
  const [selectedJob, setSelectedJob] = useState<VideoStudioJob | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    open: boolean;
    jobIds: string[];
    title?: string;
  }>({ open: false, jobIds: [] });

  // Job Selection
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  // New Job Form
  const [newTopic, setNewTopic] = useState('');
  const [newPostId, setNewPostId] = useState('');

  // Settings Form
  const [formSettings, setFormSettings] = useState<Partial<VideoStudioSettings>>({});

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [jobsRes, storageRes] = await Promise.all([
        fetch('/api/admin/video-studio/jobs?limit=25'),
        fetch('/api/admin/video-studio/storage'),
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (jobsData.success) {
          setJobs(jobsData.recentJobs || []);
          setActiveJob(jobsData.activeJob || null);
          setSettings(jobsData.settings || null);
          if (jobsData.settings) {
            setFormSettings(jobsData.settings);
          }
        }
      }

      if (storageRes.ok) {
        const storageData = await storageRes.json();
        if (storageData.success) {
          setStorageSummary(storageData.summary || null);
        }
      }
    } catch (err) {
      console.error('Error fetching Video Studio data:', err);
    } finally {
      if (!isSilent) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamic Polling: poll more frequently if a job is actively processing
  useEffect(() => {
    const isJobActive = Boolean(
      activeJob &&
      activeJob.status !== 'published' &&
      activeJob.status !== 'failed'
    );
    const intervalMs = isJobActive ? 4000 : 16000;

    const timer = setInterval(() => {
      fetchData(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeJob, fetchData]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/video-studio/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newTopic.trim() || undefined,
          postId: newPostId ? Number(newPostId) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to start video production job.', 'error');
        return;
      }
      showToast('Video production job started successfully.', 'success');
      setNewJobModalOpen(false);
      setNewTopic('');
      setNewPostId('');
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Error triggering job.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/video-studio/jobs/${jobId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to retry video job.', 'error');
        return;
      }
      showToast('Video production job retry initiated.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Error retrying job.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnforceRetention = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/video-studio/storage', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to enforce storage retention.', 'error');
        return;
      }
      showToast(data.message || 'Retention policy checked successfully.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Error executing retention.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/video-studio/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSettings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to save settings.', 'error');
        return;
      }
      showToast('Video Studio settings updated successfully.', 'success');
      setSettingsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Error saving settings.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedJobIds.length === jobs.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(jobs.map((j) => j.id));
    }
  };

  const toggleSelectJob = (id: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const executeDelete = async (jobIds: string[]) => {
    if (!jobIds.length) return;
    setActionLoading(true);
    try {
      let res: Response;
      if (jobIds.length === 1) {
        res = await fetch(`/api/admin/video-studio/jobs/${jobIds[0]}`, {
          method: 'DELETE',
        });
      } else {
        res = await fetch('/api/admin/video-studio/jobs', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobIds }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete video job(s).', 'error');
        return;
      }

      showToast(`Successfully deleted ${jobIds.length} video job(s).`, 'success');
      setSelectedJobIds((prev) => prev.filter((id) => !jobIds.includes(id)));
      setConfirmDeleteModal({ open: false, jobIds: [] });
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Error executing delete.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStageIndex = (status: VideoJobStatus) => {
    return PIPELINE_STAGES.findIndex((s) => s.key === status);
  };

  const activeStageIdx = activeJob ? getStageIndex(activeJob.status) : -1;

  return (
    <div className="hpa-content" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '12px',
            background:
              toastMessage.type === 'success'
                ? 'rgba(16, 185, 129, 0.95)'
                : toastMessage.type === 'error'
                ? 'rgba(239, 68, 68, 0.95)'
                : 'rgba(30, 41, 59, 0.95)',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            fontSize: '0.85rem',
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
          }}
        >
          {toastMessage.type === 'success' && <CheckCircle2 size={16} />}
          {toastMessage.type === 'error' && <AlertTriangle size={16} />}
          {toastMessage.type === 'info' && <Sparkles size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="hpa-card"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(10, 10, 18, 0.98) 100%)',
          border: '1px solid var(--hpa-border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Video size={20} />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                HeyPrince AI Video Studio
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                Veo & Remotion
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--hpa-text-muted)', lineHeight: 1.5 }}>
              Autonomous cinematic video generation pipeline. Renders scenes with Google Veo and Remotion, synthesizes natural Hindi voiceover, synchronizes English subtitles, and strictly enforces Cloudflare R2 retention (maximum 5 published videos).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="hpa-btn hpa-btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              title="Refresh studio state"
            >
              <RotateCw size={14} className={refreshing ? 'hpa-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setSettingsModalOpen(true)}
              className="hpa-btn hpa-btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setNewJobModalOpen(true)}
              className="hpa-btn hpa-btn-primary"
              style={{
                fontSize: '0.82rem',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#000000',
                borderColor: '#38bdf8',
                fontWeight: 700,
              }}
            >
              <Plus size={15} />
              <span>New Production Job</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloudflare R2 Retention & Storage Dashboard Panel */}
      <div
        className="hpa-card"
        style={{
          background: 'var(--hpa-surface)',
          border: '1px solid var(--hpa-border)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            borderBottom: '1px solid var(--hpa-border)',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 245, 160, 0.12)',
                border: '1px solid rgba(0, 245, 160, 0.3)',
                color: '#00f5a0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HardDrive size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Cloudflare R2 Retention & Storage Dashboard
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--hpa-text-muted)' }}>
                Retention policy: Maximum {storageSummary?.maxRetentionLimit || 5} published video asset collections preserved. Older media pruned safely upon 6th publication.
              </p>
            </div>
          </div>

          <button
            onClick={handleEnforceRetention}
            disabled={actionLoading}
            className="hpa-btn hpa-btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <Trash2 size={13} style={{ color: 'var(--hpa-text-dim)' }} />
            <span>Enforce Retention Now</span>
          </button>
        </div>

        {/* Storage Warning Banner */}
        {storageSummary?.hasStorageWarning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              background: 'rgba(251, 191, 36, 0.1)',
              color: '#fef08a',
              fontSize: '0.8rem',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontWeight: 700 }}>Storage Alert:</strong> {storageSummary.storageWarningMessage || 'Storage growth threshold reached.'}
            </div>
          </div>
        )}

        {/* Metrics Grid (Fully Responsive on Mobile/Tablet) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ background: 'var(--hpa-surface-2)', border: '1px solid var(--hpa-border)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              R2 Storage Used
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {storageSummary?.r2TotalFormatted || '0 B'}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>Video Studio bucket</span>
          </div>

          <div style={{ background: 'var(--hpa-surface-2)', border: '1px solid var(--hpa-border)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Retained Collections
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {storageSummary?.retainedVideosCount || 0} / {storageSummary?.maxRetentionLimit || 5}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>Active R2 media sets</span>
          </div>

          <div style={{ background: 'var(--hpa-surface-2)', border: '1px solid var(--hpa-border)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Est. Per Video
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {storageSummary?.estimatedStoragePerVideoFormatted || '0 B'}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>Video, audio, subtitles</span>
          </div>

          <div style={{ background: 'var(--hpa-surface-2)', border: '1px solid var(--hpa-border)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Oldest Retained
            </span>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--hpa-text)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={storageSummary?.oldestRetainedVideo?.title || 'None'}>
              {storageSummary?.oldestRetainedVideo?.title || 'None'}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>
              {storageSummary?.oldestRetainedVideo?.publishedAt
                ? new Date(storageSummary.oldestRetainedVideo.publishedAt).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>

          <div style={{ background: 'var(--hpa-surface-2)', border: '1px solid var(--hpa-border)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Last Cleanup
            </span>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--hpa-text)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {storageSummary?.lastCleanupExecution
                ? storageSummary.lastCleanupExecution.prunedTitle || 'Completed'
                : 'Never'}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>
              {storageSummary?.lastCleanupExecution
                ? `${storageSummary.lastCleanupExecution.bytesFreedFormatted} freed`
                : 'Awaiting 6th publish'}
            </span>
          </div>

          <div style={{ background: 'var(--hpa-surface-2)', border: '1px solid var(--hpa-border)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Failed Cleanups
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px', color: (storageSummary?.failedCleanupTasksCount || 0) > 0 ? '#f43f5e' : '#00f5a0' }}>
              {storageSummary?.failedCleanupTasksCount || 0}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>Safe retry queue</span>
          </div>
        </div>
      </div>

      {/* Active Video Production Pipeline Card */}
      {activeJob && (
        <div
          className="hpa-card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 24, 48, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              borderBottom: '1px solid var(--hpa-border)',
              paddingBottom: '14px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <Film size={12} />
                  <span>IN PRODUCTION</span>
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', fontFamily: 'var(--hpa-font-mono)' }}>
                  Job ID: {activeJob.id.slice(0, 14)}...
                </span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {activeJob.title}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--hpa-text-muted)' }}>
                Current Step: {activeJob.currentStep} | Voice: {activeJob.languageSettings?.narration || 'hi-IN'} | Subtitles: {activeJob.languageSettings?.subtitles || 'en-US'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--hpa-text-muted)', fontFamily: 'var(--hpa-font-mono)' }}>
                Stage {activeStageIdx + 1} of {PIPELINE_STAGES.length}
              </span>
              <div style={{ width: '100px', height: '8px', borderRadius: '100px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8 0%, #8b5cf6 100%)',
                    width: `${activeJob.progressPercent || Math.round(((activeStageIdx + 1) / PIPELINE_STAGES.length) * 100)}%`,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--hpa-font-mono)' }}>
                {activeJob.progressPercent || Math.round(((activeStageIdx + 1) / PIPELINE_STAGES.length) * 100)}%
              </span>
            </div>
          </div>

          {/* 12-Stage Visual Stepper (Responsive Grid) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCurrent = activeJob.status === stage.key;
              const isDone = activeStageIdx > idx || activeJob.status === 'published';
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.key}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '10px',
                    border: isCurrent
                      ? '1px solid #38bdf8'
                      : isDone
                      ? '1px solid rgba(0, 245, 160, 0.4)'
                      : '1px solid var(--hpa-border)',
                    background: isCurrent
                      ? 'rgba(56, 189, 248, 0.18)'
                      : isDone
                      ? 'rgba(0, 245, 160, 0.08)'
                      : 'var(--hpa-surface-2)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    color: isCurrent ? '#38bdf8' : isDone ? '#00f5a0' : 'var(--hpa-text-dim)',
                  }}
                >
                  <StageIcon size={14} className={isCurrent ? 'hpa-spin' : ''} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Storyboard Scene Preview Grid */}
          {activeJob.storyboard && activeJob.storyboard.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--hpa-border)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--hpa-text)' }}>
                  Rendered Scenes ({activeJob.storyboard.length} total)
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)' }}>
                  Total Duration: {activeJob.storyboard.reduce((acc: number, s: StoryboardScene) => acc + s.estimatedDurationSec, 0)}s
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '10px',
                }}
              >
                {activeJob.storyboard.map((scene: StoryboardScene) => (
                  <div
                    key={`scene-${scene.sceneIndex}`}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--hpa-surface-2)',
                      border: '1px solid var(--hpa-border)',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>Scene {scene.sceneIndex + 1}: {scene.title}</span>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          fontFamily: 'var(--hpa-font-mono)',
                        }}
                      >
                        {scene.visualType} | {scene.estimatedDurationSec}s
                      </span>
                    </div>
                    <div style={{ color: 'var(--hpa-text-muted)', marginBottom: '4px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      Hindi: &quot;{scene.narrationHindi}&quot;
                    </div>
                    <div style={{ color: 'var(--hpa-text-dim)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      English: &quot;{scene.narrationEnglish}&quot;
                    </div>
                    {scene.renderedClipUrl && (
                      <div style={{ marginTop: '6px', color: '#00f5a0', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Scene clip rendered
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Assurance Report Card */}
          {activeJob.qualityReport && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--hpa-surface-2)',
                border: '1px solid var(--hpa-border)',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={15} style={{ color: '#00f5a0' }} />
                  <strong style={{ color: '#ffffff' }}>Mandatory 10-Point QA Checklist</strong>
                </div>
                <span style={{ fontWeight: 800, color: activeJob.qualityReport.overallPassed ? '#00f5a0' : '#f43f5e' }}>
                  Score: {activeJob.qualityReport.score}/100 ({activeJob.qualityReport.overallPassed ? 'PASSED' : 'FAILED'})
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '6px',
                }}
              >
                {Object.values(activeJob.qualityReport.checks).map((check: QualityCheckItem) => (
                  <div
                    key={check.id}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: check.passed ? '1px solid rgba(0, 245, 160, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                      background: check.passed ? 'rgba(0, 245, 160, 0.06)' : 'rgba(244, 63, 94, 0.08)',
                      color: check.passed ? '#00f5a0' : '#f43f5e',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {check.passed ? <Check size={12} style={{ flexShrink: 0 }} /> : <X size={12} style={{ flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={check.name}>
                      {check.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failure Banner */}
          {activeJob.failureReason && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fca5a5',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <AlertTriangle size={15} style={{ color: '#f43f5e', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontWeight: 700 }}>Execution Failed:</strong> {activeJob.failureReason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Production History Table Card (Mobile & Tablet Responsive) */}
      <div
        className="hpa-card"
        style={{
          background: 'var(--hpa-surface)',
          border: '1px solid var(--hpa-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div className="hpa-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--hpa-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Film size={15} />
            </div>
            <div>
              <h2 className="hpa-card-title" style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>
                Video Production History
              </h2>
              <p className="hpa-card-sub" style={{ fontSize: '0.76rem', margin: '2px 0 0' }}>
                Persistent video production logs, R2 retention states, and YouTube URLs.
              </p>
            </div>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', fontFamily: 'var(--hpa-font-mono)' }}>
            {jobs.length} total jobs
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--hpa-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={24} className="hpa-spin" style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.82rem' }}>Loading Video Studio records...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="hpa-empty-state" style={{ padding: '40px 20px' }}>
            <div className="hpa-empty-icon">
              <Video size={24} />
            </div>
            <div className="hpa-empty-title">No video production jobs yet</div>
            <p className="hpa-empty-sub">Trigger your first autonomous production job to begin creating cinematic videos.</p>
            <button
              onClick={() => setNewJobModalOpen(true)}
              className="hpa-btn hpa-btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 16px' }}
            >
              <Plus size={14} />
              <span>Create First Video Job</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Bulk Selection Actions Toolbar */}
            {selectedJobIds.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  marginBottom: '14px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '0.82rem', fontWeight: 700 }}>
                  <span style={{ color: '#f43f5e' }}>{selectedJobIds.length}</span> of {jobs.length} video{selectedJobIds.length > 1 ? 's' : ''} selected
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedJobIds([])}
                    className="hpa-btn hpa-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => setConfirmDeleteModal({ open: true, jobIds: selectedJobIds })}
                    className="hpa-btn hpa-btn-danger"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      background: '#f43f5e',
                      color: '#ffffff',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Selected ({selectedJobIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="hpa-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table className="hpa-table" style={{ width: '100%', minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '38px', textAlign: 'center', padding: '10px 8px' }}>
                      <input
                        type="checkbox"
                        checked={jobs.length > 0 && selectedJobIds.length === jobs.length}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                        title="Select / Deselect all"
                      />
                    </th>
                    <th>Title & ID</th>
                    <th>Status</th>
                    <th>Voice & Subtitles</th>
                    <th>Scenes</th>
                    <th>QA Score</th>
                    <th>R2 Retention</th>
                    <th>YouTube</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const isJobFailed = job.status === 'failed';
                    const isPublished = job.status === 'published';
                    const isPruned = !job.r2Retained && Boolean(job.r2DeletedAt);
                    const isSelected = selectedJobIds.includes(job.id);

                    return (
                      <tr key={job.id} style={{ background: isSelected ? 'rgba(56, 189, 248, 0.06)' : undefined }}>
                        <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectJob(job.id)}
                            style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                          />
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          <div style={{ fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.title}>
                            {job.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)', fontFamily: 'var(--hpa-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.id}>
                            {job.id}
                          </div>
                        </td>

                      <td>
                        <span
                          className="hpa-pill"
                          style={{
                            background: isPublished
                              ? 'rgba(0, 245, 160, 0.12)'
                              : isJobFailed
                              ? 'rgba(244, 63, 94, 0.12)'
                              : 'rgba(56, 189, 248, 0.12)',
                            color: isPublished
                              ? '#00f5a0'
                              : isJobFailed
                              ? '#f43f5e'
                              : '#38bdf8',
                            borderColor: isPublished
                              ? 'rgba(0, 245, 160, 0.3)'
                              : isJobFailed
                              ? 'rgba(244, 63, 94, 0.3)'
                              : 'rgba(56, 189, 248, 0.3)',
                          }}
                        >
                          {isPublished && <CheckCircle2 size={11} />}
                          {isJobFailed && <AlertTriangle size={11} />}
                          {!isPublished && !isJobFailed && <Clock size={11} />}
                          <span style={{ textTransform: 'capitalize' }}>{job.status.replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      <td style={{ color: 'var(--hpa-text-muted)', fontSize: '0.78rem' }}>
                        <div>Narration: {job.languageSettings?.narration || 'hi-IN'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)' }}>
                          Subtitles: {job.languageSettings?.subtitles || 'en-US'}
                        </div>
                      </td>

                      <td style={{ fontFamily: 'var(--hpa-font-mono)', fontSize: '0.78rem' }}>
                        {job.storyboard?.length || 0} scenes
                      </td>

                      <td style={{ fontFamily: 'var(--hpa-font-mono)', fontSize: '0.78rem' }}>
                        {job.qualityReport?.score !== undefined ? (
                          <strong style={{ color: job.qualityReport.overallPassed ? '#00f5a0' : '#f43f5e' }}>
                            {job.qualityReport.score}/100
                          </strong>
                        ) : (
                          <span style={{ color: 'var(--hpa-text-dim)' }}>Pending</span>
                        )}
                      </td>

                      <td>
                        {isPruned ? (
                          <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={11} /> Pruned (Archived)
                          </span>
                        ) : job.r2Retained && job.r2VideoKey ? (
                          <span style={{ color: '#00f5a0', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={11} /> Active in R2
                          </span>
                        ) : (
                          <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.72rem' }}>N/A</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {job.youtubeVideoId && !job.youtubeVideoId.startsWith('hp_') ? (
                            <a
                              href={job.youtubeVideoUrl || `https://youtube.com/watch?v=${job.youtubeVideoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#38bdf8',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                              }}
                            >
                              <span>Watch</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : job.youtubeVideoId?.startsWith('hp_') ? (
                            <span
                              className="hpa-pill"
                              style={{
                                background: 'rgba(251, 191, 36, 0.1)',
                                color: '#fbbf24',
                                borderColor: 'rgba(251, 191, 36, 0.25)',
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                              }}
                              title="Simulated dev record: configure YOUTUBE_CLIENT_ID and YOUTUBE_REFRESH_TOKEN to auto-upload to your YouTube channel."
                            >
                              Simulated (Dev)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.74rem' }}>Pending</span>
                          )}

                          {/* Direct Download Button */}
                          {(job.renderedVideoUrl || job.r2VideoUrl || job.voiceoverAssets?.combinedAudioUrl) && (
                            <a
                              href={job.renderedVideoUrl || job.r2VideoUrl || job.voiceoverAssets?.combinedAudioUrl || '#'}
                              download={`${job.slug || job.id}.mp4`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(0, 245, 160, 0.1)',
                                border: '1px solid rgba(0, 245, 160, 0.3)',
                                color: '#00f5a0',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                              title="Download video or audio file"
                            >
                              <Download size={11} />
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="hpa-table-action-btn"
                            title="Inspect Storyboard & Quality QA"
                          >
                            <FileText size={13} />
                          </button>

                          {(job.renderedVideoUrl || job.r2VideoUrl || job.voiceoverAssets?.combinedAudioUrl) && (
                            <a
                              href={job.renderedVideoUrl || job.r2VideoUrl || job.voiceoverAssets?.combinedAudioUrl || '#'}
                              download={`${job.slug || job.id}.mp4`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hpa-table-action-btn"
                              title="Download video"
                              style={{ color: '#00f5a0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Download size={13} />
                            </a>
                          )}

                          {isJobFailed && (
                            <button
                              onClick={() => handleRetryJob(job.id)}
                              disabled={actionLoading}
                              className="hpa-table-action-btn danger"
                              title="Retry failed video job"
                            >
                              <RotateCw size={13} />
                            </button>
                          )}

                          <button
                            onClick={() => setConfirmDeleteModal({ open: true, jobIds: [job.id], title: job.title })}
                            disabled={actionLoading}
                            className="hpa-table-action-btn danger"
                            title="Delete video job"
                            style={{ color: '#f43f5e' }}
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
          </div>
        )}
      </div>

      {/* New Video Production Job Modal (Mobile & Tablet Responsive) */}
      {newJobModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="hpa-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--hpa-surface)',
              border: '1px solid var(--hpa-border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--hpa-border)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Create Video Production Job
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewJobModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--hpa-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--hpa-text)', fontWeight: 600, marginBottom: '6px' }}>
                  Video Topic or Key Theme
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g., The Architecture of Autonomous AI Companies"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--hpa-surface-2)',
                    border: '1px solid var(--hpa-border)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--hpa-text)', fontWeight: 600, marginBottom: '6px' }}>
                  Source Post ID (Optional)
                </label>
                <input
                  type="number"
                  value={newPostId}
                  onChange={(e) => setNewPostId(e.target.value)}
                  placeholder="e.g., 42"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--hpa-surface-2)',
                    border: '1px solid var(--hpa-border)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', marginTop: '4px', display: 'block' }}>
                  Link an existing HeyPrince blog post to base the script and metadata on.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '14px', borderTop: '1px solid var(--hpa-border)' }}>
                <button
                  type="button"
                  onClick={() => setNewJobModalOpen(false)}
                  className="hpa-btn hpa-btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="hpa-btn hpa-btn-primary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', color: '#000000', borderColor: '#38bdf8', fontWeight: 700 }}
                >
                  {actionLoading ? <Loader2 size={14} className="hpa-spin" /> : <Play size={14} />}
                  <span>Start Production</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Studio Settings Modal (Mobile & Tablet Responsive) */}
      {settingsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="hpa-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--hpa-surface)',
              border: '1px solid var(--hpa-border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--hpa-border)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Video Studio Configuration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--hpa-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--hpa-text)', fontWeight: 600, marginBottom: '6px' }}>
                    R2 Max Published Videos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formSettings.maxPublishedVideos || 5}
                    onChange={(e) => setFormSettings({ ...formSettings, maxPublishedVideos: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--hpa-surface-2)',
                      border: '1px solid var(--hpa-border)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)', marginTop: '4px', display: 'block' }}>
                    Strict retention ceiling (default: 5 collections in R2).
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--hpa-text)', fontWeight: 600, marginBottom: '6px' }}>
                    Video Provider
                  </label>
                  <input
                    type="text"
                    value={formSettings.videoProvider || 'hybrid'}
                    onChange={(e) => setFormSettings({ ...formSettings, videoProvider: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--hpa-surface-2)',
                      border: '1px solid var(--hpa-border)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--hpa-text-dim)', marginTop: '4px', display: 'block' }}>
                    e.g., hybrid, veo, remotion
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--hpa-text)', fontWeight: 600, marginBottom: '6px' }}>
                    Default Hindi Voice ID
                  </label>
                  <input
                    type="text"
                    value={formSettings.voiceId || 'hi-IN-Standard-D'}
                    onChange={(e) => setFormSettings({ ...formSettings, voiceId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--hpa-surface-2)',
                      border: '1px solid var(--hpa-border)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--hpa-text)', fontWeight: 600, marginBottom: '6px' }}>
                    Aspect Ratio
                  </label>
                  <select
                    value={formSettings.aspectRatio || '16:9'}
                    onChange={(e) => setFormSettings({ ...formSettings, aspectRatio: e.target.value as '16:9' | '9:16' })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--hpa-surface-2)',
                      border: '1px solid var(--hpa-border)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="16:9">16:9 (Landscape Desktop)</option>
                    <option value="9:16">9:16 (Vertical Mobile Shorts)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '14px', borderTop: '1px solid var(--hpa-border)' }}>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="hpa-btn hpa-btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="hpa-btn hpa-btn-primary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', color: '#000000', borderColor: '#38bdf8', fontWeight: 700 }}
                >
                  {actionLoading ? <Loader2 size={14} className="hpa-spin" /> : <Check size={14} />}
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storyboard & QA Inspection Modal (Mobile & Tablet Responsive) */}
      {selectedJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="hpa-card"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '88vh',
              overflowY: 'auto',
              background: 'var(--hpa-surface)',
              border: '1px solid var(--hpa-border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--hpa-border)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{selectedJob.title}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--hpa-text-dim)', fontFamily: 'var(--hpa-font-mono)' }}>
                  Job ID: {selectedJob.id} | Status: {selectedJob.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                style={{ background: 'none', border: 'none', color: 'var(--hpa-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Audio & Video Playback Preview */}
            {selectedJob.voiceoverAssets?.combinedAudioUrl && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--hpa-surface-2)',
                  border: '1px solid var(--hpa-border)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Volume2 size={15} style={{ color: '#00f5a0' }} />
                    Master Hindi Voiceover Audio
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', fontFamily: 'var(--hpa-font-mono)' }}>
                    {selectedJob.voiceoverAssets.totalDurationMs ? `${(selectedJob.voiceoverAssets.totalDurationMs / 1000).toFixed(1)}s` : ''}
                  </span>
                </div>
                <audio
                  controls
                  src={selectedJob.voiceoverAssets.combinedAudioUrl}
                  style={{ width: '100%', height: '36px', borderRadius: '8px', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <a
                    href={selectedJob.renderedVideoUrl || selectedJob.r2VideoUrl || selectedJob.voiceoverAssets.combinedAudioUrl}
                    download={`${selectedJob.slug || selectedJob.id}.mp4`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hpa-btn hpa-btn-primary"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      background: 'linear-gradient(135deg, #00f5a0 0%, #059669 100%)',
                      color: '#000000',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <Download size={13} />
                    <span>Download Media Asset</span>
                  </a>
                </div>
              </div>
            )}

            {/* QA Checklist Details */}
            {selectedJob.qualityReport && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--hpa-surface-2)',
                  border: '1px solid var(--hpa-border)',
                  fontSize: '0.78rem',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>Mandatory 10-Point QA Checklist</span>
                  <span style={{ fontWeight: 800, color: selectedJob.qualityReport.overallPassed ? '#00f5a0' : '#f43f5e' }}>
                    Score: {selectedJob.qualityReport.score}/100 ({selectedJob.qualityReport.overallPassed ? 'PASSED' : 'FAILED'})
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.values(selectedJob.qualityReport.checks).map((c: QualityCheckItem) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.passed ? <Check size={12} style={{ color: '#00f5a0' }} /> : <X size={12} style={{ color: '#f43f5e' }} />}
                        <span style={{ color: 'var(--hpa-text)' }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--hpa-text-dim)', textAlign: 'right' }}>{c.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Storyboard Scenes */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--hpa-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Storyboard & Scenes ({selectedJob.storyboard?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedJob.storyboard?.map((s: StoryboardScene) => (
                  <div
                    key={`modal-scene-${s.sceneIndex}`}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--hpa-surface-2)',
                      border: '1px solid var(--hpa-border)',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>Scene {s.sceneIndex + 1}: {s.title}</span>
                      <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: 'var(--hpa-font-mono)' }}>
                        {s.visualType} | {s.estimatedDurationSec}s
                      </span>
                    </div>
                    <p style={{ margin: '0 0 4px', color: 'var(--hpa-text-muted)', fontStyle: 'italic' }}>
                      <strong style={{ color: '#ffffff' }}>Hindi:</strong> {s.narrationHindi}
                    </p>
                    <p style={{ margin: 0, color: 'var(--hpa-text-dim)' }}>
                      <strong style={{ color: 'var(--hpa-text)' }}>English:</strong> {s.narrationEnglish}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Media Artifacts */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--hpa-surface-2)',
                border: '1px solid var(--hpa-border)',
                fontSize: '0.74rem',
                fontFamily: 'var(--hpa-font-mono)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ color: 'var(--hpa-text-muted)', fontWeight: 700 }}>Artifact Destinations:</div>
              <div>R2 Public Key: <span style={{ color: '#ffffff' }}>{selectedJob.r2VideoKey || 'N/A'}</span></div>
              <div>
                R2 Retention:{' '}
                <span style={{ color: !selectedJob.r2Retained && selectedJob.r2DeletedAt ? 'var(--hpa-text-dim)' : '#00f5a0' }}>
                  {!selectedJob.r2Retained && selectedJob.r2DeletedAt ? 'Pruned (Retention Policy)' : 'Active in Bucket'}
                </span>
              </div>
              <div>
                YouTube Destination:{' '}
                {selectedJob.youtubeVideoId && !selectedJob.youtubeVideoId.startsWith('hp_') ? (
                  <a
                    href={selectedJob.youtubeVideoUrl || `https://youtube.com/watch?v=${selectedJob.youtubeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8', textDecoration: 'underline' }}
                  >
                    {selectedJob.youtubeVideoUrl}
                  </a>
                ) : selectedJob.youtubeVideoId?.startsWith('hp_') ? (
                  <span style={{ color: '#fbbf24' }}>
                    Simulated Dev Record (Requires YOUTUBE_CLIENT_ID & YOUTUBE_REFRESH_TOKEN in Vercel for live upload)
                  </span>
                ) : (
                  <span style={{ color: 'var(--hpa-text-dim)' }}>Pending upload</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal (Mobile & Tablet Responsive) */}
      {confirmDeleteModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="hpa-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--hpa-surface)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: '#f43f5e' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {confirmDeleteModal.jobIds.length === 1 ? 'Delete Video Job' : `Delete ${confirmDeleteModal.jobIds.length} Video Jobs`}
              </h3>
            </div>
            <p style={{ color: 'var(--hpa-text-muted)', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 16px' }}>
              {confirmDeleteModal.title ? (
                <>Are you sure you want to permanently delete <strong>{confirmDeleteModal.title}</strong>?</>
              ) : (
                <>Are you sure you want to permanently delete these <strong>{confirmDeleteModal.jobIds.length}</strong> video jobs?</>
              )}
              <br />
              All associated R2 video files, audio tracks, subtitles, and scenes will also be removed. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteModal({ open: false, jobIds: [] })}
                className="hpa-btn hpa-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDelete(confirmDeleteModal.jobIds)}
                disabled={actionLoading}
                className="hpa-btn hpa-btn-danger"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {actionLoading ? <Loader2 size={14} className="hpa-spin" /> : <Trash2 size={14} />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
