// ============================================================================
// HeyPrince AI Video Studio Type Definitions
// ============================================================================

export type VideoJobStatus =
  | 'queued'
  | 'researching'
  | 'scripting'
  | 'storyboarding'
  | 'generating_visuals'
  | 'generating_voiceover'
  | 'subtitle_generation'
  | 'rendering'
  | 'quality_check'
  | 'uploading_to_r2'
  | 'publishing_to_youtube'
  | 'published'
  | 'failed';

export type VisualType = 'ai_clip' | 'remotion' | 'svg_canvas' | 'motion_graphics';

export interface StoryboardScene {
  sceneIndex: number;
  title: string;
  visualType: VisualType;
  visualPrompt: string;
  animationConfig?: {
    template?: string;
    chartType?: 'bar' | 'line' | 'architecture' | 'code_walkthrough';
    colors?: string[];
    motionIntensity?: 'smooth' | 'dynamic' | 'cinematic';
  };
  narrationHindi: string;
  narrationEnglish: string;
  estimatedDurationSec: number;
  actualAudioDurationMs?: number;
  audioUrl?: string;
  renderedClipUrl?: string;
  r2ClipKey?: string;
  subtitleTiming?: {
    startTime: string; // "00:00:01,000"
    endTime: string;   // "00:00:05,200"
    startMs: number;
    endMs: number;
  };
}

export interface VideoScriptPayload {
  title: string;
  slug: string;
  hookHindi: string;
  hookEnglish: string;
  targetAudience: string;
  estimatedTotalSeconds: number;
  scenes: StoryboardScene[];
  seoMetadata: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    hindiTitle?: string;
    hindiDescription?: string;
  };
}

export interface VoiceoverConfig {
  provider: 'google_tts' | 'elevenlabs' | 'openai' | 'mock';
  voiceId: string;
  languageCode: string;
  speakingRate: number;
  pitch: number;
}

export interface SubtitleAssets {
  srtContent: string;
  vttContent: string;
  srtR2Key?: string;
  vttR2Key?: string;
  srtUrl?: string;
  vttUrl?: string;
}

export interface QualityCheckItem {
  id: string;
  name: string;
  passed: boolean;
  score?: number; // 0-100
  details: string;
  critical: boolean;
}

export interface VideoQualityReport {
  overallPassed: boolean;
  score: number; // 0-100
  checks: {
    storyboardSceneCoverage: QualityCheckItem;
    noMissingOrBlackFrames: QualityCheckItem;
    noMissingVoiceSegments: QualityCheckItem;
    noCorruptedMedia: QualityCheckItem;
    subtitleSynchronization: QualityCheckItem;
    audioVideoDurationAlignment: QualityCheckItem;
    correctResolutionAndAspect: QualityCheckItem;
    thumbnailExists: QualityCheckItem;
    ffmpegDecodability: QualityCheckItem;
    r2UploadAndRetrieval: QualityCheckItem;
  };
  durationSeconds: number;
  resolution: string;
  aspectRatio: string;
  fileSizeBytes: number;
  testedAt: string;
}

export interface VideoStudioJob {
  id: string;
  title: string;
  slug: string;
  status: VideoJobStatus;
  currentStep: string;
  progressPercent: number;

  languageSettings: {
    narration: string; // e.g. "hi-IN"
    subtitles: string; // e.g. "en-US"
    metadata: string;  // e.g. "en-US"
  };

  scriptPayload?: VideoScriptPayload | null;
  storyboard?: StoryboardScene[] | null;
  voiceoverConfig?: VoiceoverConfig | null;

  voiceoverAssets?: {
    combinedAudioUrl?: string;
    combinedAudioR2Key?: string;
    sceneAudioKeys?: string[];
    totalDurationMs?: number;
  } | null;

  subtitleAssets?: SubtitleAssets | null;
  visualAssets?: {
    sceneClips?: string[];
    sceneClipR2Keys?: string[];
  } | null;

  thumbnailUrl?: string | null;
  renderedVideoUrl?: string | null;

  r2VideoUrl?: string | null;
  r2VideoKey?: string | null;
  r2AssetKeys: string[];
  r2Retained: boolean;
  r2DeletedAt?: string | null;
  r2TotalBytes: number;

  youtubeVideoId?: string | null;
  youtubeVideoUrl?: string | null;
  youtubePublishStatus: 'pending' | 'published' | 'failed';

  qualityReport?: VideoQualityReport | null;
  qualityPassed: boolean;
  failureReason?: string | null;
  retryCount: number;
  maxRetries: number;

  postId?: number | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoStudioSettings {
  id: string;
  isEnabled: boolean;
  maxPublishedVideos: number;
  defaultNarrationLang: string;
  defaultSubtitleLang: string;
  voiceProvider: string;
  voiceId: string;
  voiceSpeed: number;
  videoProvider: string;
  burnSubtitles: boolean;
  renderFps: number;
  aspectRatio: '16:9' | '9:16';
  dailyScheduleCron: string;
  updatedAt: string;
}

export interface VideoStudioRetentionLog {
  id: number;
  triggeringJobId: string;
  prunedJobId: string;
  prunedVideoTitle: string;
  objectsDeleted: string[];
  bytesFreed: number;
  status: 'success' | 'partial_failure' | 'failed';
  errorMessage?: string | null;
  createdAt: string;
}

export interface StorageDashboardSummary {
  r2TotalBytes: number;
  r2TotalFormatted: string;
  retainedVideosCount: number;
  maxRetentionLimit: number;
  oldestRetainedVideo: {
    id: string;
    title: string;
    publishedAt: string;
    totalBytes: number;
    formattedSize: string;
  } | null;
  estimatedStoragePerVideoBytes: number;
  estimatedStoragePerVideoFormatted: string;
  lastCleanupExecution: {
    timestamp: string;
    status: string;
    prunedTitle: string;
    bytesFreedFormatted: string;
  } | null;
  failedCleanupTasksCount: number;
  hasStorageWarning: boolean;
  storageWarningMessage?: string;
  recentRetentionLogs: VideoStudioRetentionLog[];
}
