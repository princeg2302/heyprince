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

  const getStageIndex = (status: VideoJobStatus) => {
    return PIPELINE_STAGES.findIndex((s) => s.key === status);
  };

  const activeStageIdx = activeJob ? getStageIndex(activeJob.status) : -1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all text-sm font-medium ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
              : 'bg-zinc-900/90 text-zinc-200 border-zinc-700/60'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-black p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Video className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                HeyPrince AI Video Studio
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Veo & Remotion
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Autonomous cinematic video generation pipeline. Renders scenes with Google Veo and Remotion, synthesizes natural Hindi voiceover, synchronizes English subtitles, and strictly enforces Cloudflare R2 retention (maximum 5 published videos).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
              title="Refresh studio state"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setSettingsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setNewJobModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Production Job</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloudflare R2 Retention & Storage Dashboard Panel */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Cloudflare R2 Retention & Storage Dashboard
              </h2>
              <p className="text-xs text-zinc-400">
                Retention policy: Maximum {storageSummary?.maxRetentionLimit || 5} published video asset collections preserved. Older media pruned safely upon 6th publication.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEnforceRetention}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Enforce Retention Now</span>
            </button>
          </div>
        </div>

        {/* Storage Warning Banner */}
        {storageSummary?.hasStorageWarning && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Storage Alert:</span> {storageSummary.storageWarningMessage || 'Storage growth threshold reached.'}
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <span className="text-xs text-zinc-400 font-medium">R2 Storage Used</span>
            <div className="text-lg font-bold text-white mt-1">
              {storageSummary?.r2TotalFormatted || '0 B'}
            </div>
            <span className="text-[11px] text-zinc-500">Video Studio bucket</span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <span className="text-xs text-zinc-400 font-medium">Retained Collections</span>
            <div className="text-lg font-bold text-white mt-1">
              {storageSummary?.retainedVideosCount || 0} / {storageSummary?.maxRetentionLimit || 5}
            </div>
            <span className="text-[11px] text-zinc-500">Active R2 sets</span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <span className="text-xs text-zinc-400 font-medium">Estimated Per Video</span>
            <div className="text-lg font-bold text-white mt-1">
              {storageSummary?.estimatedStoragePerVideoFormatted || '0 B'}
            </div>
            <span className="text-[11px] text-zinc-500">Video, audio, subtitles</span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <span className="text-xs text-zinc-400 font-medium">Oldest Retained</span>
            <div className="text-sm font-semibold text-zinc-200 mt-1 truncate" title={storageSummary?.oldestRetainedVideo?.title || 'None'}>
              {storageSummary?.oldestRetainedVideo?.title || 'None'}
            </div>
            <span className="text-[11px] text-zinc-500">
              {storageSummary?.oldestRetainedVideo?.publishedAt
                ? new Date(storageSummary.oldestRetainedVideo.publishedAt).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <span className="text-xs text-zinc-400 font-medium">Last Cleanup</span>
            <div className="text-sm font-semibold text-zinc-200 mt-1">
              {storageSummary?.lastCleanupExecution
                ? storageSummary.lastCleanupExecution.prunedTitle || 'Completed'
                : 'Never'}
            </div>
            <span className="text-[11px] text-zinc-500">
              {storageSummary?.lastCleanupExecution
                ? `${storageSummary.lastCleanupExecution.bytesFreedFormatted} freed`
                : 'Awaiting 6th publish'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <span className="text-xs text-zinc-400 font-medium">Failed Cleanups</span>
            <div className={`text-lg font-bold mt-1 ${(storageSummary?.failedCleanupTasksCount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {storageSummary?.failedCleanupTasksCount || 0}
            </div>
            <span className="text-[11px] text-zinc-500">Safe retry queue</span>
          </div>
        </div>
      </div>

      {/* Active Video Production Pipeline Card */}
      {activeJob && (
        <div className="rounded-2xl border border-blue-500/30 bg-zinc-900/80 p-6 backdrop-blur-md shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                  <Film className="w-3.5 h-3.5" />
                  <span>In Production</span>
                </span>
                <span className="text-xs text-zinc-500 font-mono">Job ID: {activeJob.id.slice(0, 8)}...</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {activeJob.title}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Current Step: {activeJob.currentStep} • Voice: {activeJob.languageSettings.narration} • Subtitles: {activeJob.languageSettings.subtitles}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">
                Stage {activeStageIdx + 1} of {PIPELINE_STAGES.length}
              </span>
              <div className="w-32 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${activeJob.progressPercent || Math.round(((activeStageIdx + 1) / PIPELINE_STAGES.length) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-blue-400 font-mono">
                {activeJob.progressPercent || Math.round(((activeStageIdx + 1) / PIPELINE_STAGES.length) * 100)}%
              </span>
            </div>
          </div>

          {/* 12-Stage Visual Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCurrent = activeJob.status === stage.key;
              const isDone = activeStageIdx > idx || activeJob.status === 'published';
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.key}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20 ring-1 ring-blue-500/50'
                      : isDone
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-500'
                  }`}
                >
                  <StageIcon className={`w-4 h-4 ${isCurrent ? 'animate-bounce text-blue-400' : ''}`} />
                  <span className="text-[10px] font-semibold leading-tight line-clamp-1">
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Job Scenes Preview */}
          {activeJob.storyboard && activeJob.storyboard.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Rendered Scenes ({activeJob.storyboard.length} total)
                </span>
                <span className="text-xs text-zinc-500">
                  Total Duration: {activeJob.storyboard.reduce((acc: number, s: StoryboardScene) => acc + s.estimatedDurationSec, 0)}s
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeJob.storyboard.map((scene: StoryboardScene) => (
                  <div
                    key={`scene-${scene.sceneIndex}`}
                    className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Scene {scene.sceneIndex + 1}: {scene.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {scene.visualType} • {scene.estimatedDurationSec}s
                      </span>
                    </div>
                    <div className="text-zinc-400 line-clamp-2 italic">
                      Narration (Hindi): &quot;{scene.narrationHindi}&quot;
                    </div>
                    <div className="text-zinc-500 line-clamp-2">
                      Subtitle (English): &quot;{scene.narrationEnglish}&quot;
                    </div>
                    {scene.renderedClipUrl && (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3" /> Scene clip rendered
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Assurance Report Card */}
          {activeJob.qualityReport && (
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-zinc-200">
                    Mandatory 10-Point QA Checklist
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  Score: {activeJob.qualityReport.score}/100 • {activeJob.qualityReport.overallPassed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                {Object.values(activeJob.qualityReport.checks).map((check: QualityCheckItem) => (
                  <div
                    key={check.id}
                    className={`p-2 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                      check.passed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {check.passed ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                    <span className="truncate" title={check.name}>{check.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message if Failed */}
          {activeJob.failureReason && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Execution Failed:</span> {activeJob.failureReason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Video Jobs Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Video Production History</h2>
              <p className="text-xs text-zinc-400">
                Persistent video production logs, R2 retention states, and YouTube URLs.
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {jobs.length} total jobs
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-xs">Loading Video Studio records...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-3">
            <Video className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-sm">No video production jobs have been created yet.</p>
            <button
              onClick={() => setNewJobModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Video Job</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5">Title & Topic</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Voice & Subtitles</th>
                  <th className="px-6 py-3.5">Scenes</th>
                  <th className="px-6 py-3.5">QA Score</th>
                  <th className="px-6 py-3.5">R2 Retention</th>
                  <th className="px-6 py-3.5">YouTube</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {jobs.map((job) => {
                  const isJobFailed = job.status === 'failed';
                  const isPublished = job.status === 'published';
                  const isPruned = !job.r2Retained && Boolean(job.r2DeletedAt);

                  return (
                    <tr key={job.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-semibold text-white truncate" title={job.title}>
                          {job.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono truncate" title={job.id}>
                          {job.id}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isJobFailed
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse'
                          }`}
                        >
                          {isPublished && <CheckCircle2 className="w-3 h-3" />}
                          {isJobFailed && <AlertTriangle className="w-3 h-3" />}
                          {!isPublished && !isJobFailed && <Clock className="w-3 h-3" />}
                          <span className="capitalize">{job.status.replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-zinc-400">
                        <div className="font-medium text-zinc-300">
                          Narration: {job.languageSettings?.narration || 'hi-IN'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Subtitles: {job.languageSettings?.subtitles || 'en-US'}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-zinc-400">
                        {job.storyboard?.length || 0} scenes
                      </td>

                      <td className="px-6 py-4 font-mono">
                        {job.qualityReport?.score !== undefined ? (
                          <span className={job.qualityReport.overallPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {job.qualityReport.score}/100
                          </span>
                        ) : (
                          <span className="text-zinc-500">Pending</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isPruned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                            <Trash2 className="w-3 h-3" /> Pruned (Archived)
                          </span>
                        ) : job.r2Retained && job.r2VideoKey ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                            <Check className="w-3 h-3" /> Active in R2
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-600 font-mono">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {job.youtubeVideoId ? (
                          <a
                            href={job.youtubeVideoUrl || `https://youtube.com/watch?v=${job.youtubeVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            <span>Watch</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-600">Pending</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                            title="Inspect Storyboard & Quality QA"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {isJobFailed && (
                            <button
                              onClick={() => handleRetryJob(job.id)}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition"
                              title="Retry failed video job"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
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

      {/* New Video Production Job Modal */}
      {newJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Video className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Create Video Production Job</h3>
              </div>
              <button
                onClick={() => setNewJobModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Video Topic or Key Theme
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g., The Architecture of Autonomous AI Companies"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Source Post ID (Optional)
                </label>
                <input
                  type="number"
                  value={newPostId}
                  onChange={(e) => setNewPostId(e.target.value)}
                  placeholder="e.g., 42"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Link an existing HeyPrince blog post to base the script and metadata on.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNewJobModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>Start Production</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Studio Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Video Studio Configuration</h3>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">
                    R2 Max Published Videos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formSettings.maxPublishedVideos || 5}
                    onChange={(e) => setFormSettings({ ...formSettings, maxPublishedVideos: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Strict retention ceiling (default: 5 collections in R2).
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">
                    Video Provider
                  </label>
                  <input
                    type="text"
                    value={formSettings.videoProvider || 'hybrid'}
                    onChange={(e) => setFormSettings({ ...formSettings, videoProvider: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    e.g., hybrid, veo, remotion
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">
                    Default Hindi Voice ID
                  </label>
                  <input
                    type="text"
                    value={formSettings.voiceId || 'hi-IN-Standard-D'}
                    onChange={(e) => setFormSettings({ ...formSettings, voiceId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">
                    Aspect Ratio
                  </label>
                  <select
                    value={formSettings.aspectRatio || '16:9'}
                    onChange={(e) => setFormSettings({ ...formSettings, aspectRatio: e.target.value as '16:9' | '9:16' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Vertical Shorts)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storyboard & QA Inspection Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedJob.title}</h3>
                <p className="text-xs text-zinc-400">Job ID: {selectedJob.id} • Status: {selectedJob.status}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QA Checklist Details */}
            {selectedJob.qualityReport && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
                <div className="flex items-center justify-between font-semibold text-zinc-200">
                  <span>Mandatory 10-Point QA Checklist</span>
                  <span className={selectedJob.qualityReport.overallPassed ? 'text-emerald-400' : 'text-rose-400'}>
                    Score: {selectedJob.qualityReport.score}/100 ({selectedJob.qualityReport.overallPassed ? 'PASSED' : 'FAILED'})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {Object.values(selectedJob.qualityReport.checks).map((c: QualityCheckItem) => (
                    <div key={c.id} className="flex items-start justify-between gap-3 py-1 border-b border-zinc-800/40 last:border-0">
                      <div className="flex items-center gap-2">
                        {c.passed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
                        <span className="text-zinc-300 font-medium">{c.name}</span>
                      </div>
                      <span className="text-zinc-500 text-[11px]">{c.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Storyboard Scenes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Storyboard & Scenes ({selectedJob.storyboard?.length || 0})
              </h4>
              <div className="space-y-3">
                {selectedJob.storyboard?.map((s: StoryboardScene) => (
                  <div key={`modal-scene-${s.sceneIndex}`} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-zinc-200">
                      <span>Scene {s.sceneIndex + 1}: {s.title}</span>
                      <span className="font-mono text-[11px] text-blue-400">{s.visualType} • {s.estimatedDurationSec}s</span>
                    </div>
                    <p className="text-zinc-400 italic">
                      <strong className="text-zinc-300">Hindi Voiceover:</strong> {s.narrationHindi}
                    </p>
                    <p className="text-zinc-500">
                      <strong className="text-zinc-400">English Subtitle:</strong> {s.narrationEnglish}
                    </p>
                    {s.visualPrompt && (
                      <p className="text-[11px] text-zinc-600 font-mono">
                        Visual Prompt: {s.visualPrompt}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Media URLs */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2 text-xs font-mono">
              <div className="text-zinc-400 font-semibold">Artifact Destinations:</div>
              <div>R2 Public Key: <span className="text-zinc-300">{selectedJob.r2VideoKey || 'N/A'}</span></div>
              <div>R2 Status: <span className={!selectedJob.r2Retained && selectedJob.r2DeletedAt ? 'text-zinc-500' : 'text-emerald-400'}>{!selectedJob.r2Retained && selectedJob.r2DeletedAt ? 'Pruned (Retention Policy)' : 'Active in Bucket'}</span></div>
              <div>YouTube URL: <span className="text-blue-400">{selectedJob.youtubeVideoUrl || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
