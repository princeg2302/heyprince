export interface DailyNewsSettings {
  id: number;
  isEnabled: boolean;
  autoGenerate: boolean;
  autoPublishWebsite: boolean;
  autoPublishLinkedIn: boolean;
  scheduleCron: string;
  scheduleDisplay: string;
  topics: string[];
  lookbackHours: number;
  aiProvider: string;
  aiModel: string;
  updatedAt: string;
}

export interface DailyNewsSource {
  id: number;
  name: string;
  url: string;
  feedType: 'rss' | 'atom' | 'api';
  category: string;
  isActive: boolean;
  lastFetchedAt?: string | null;
  lastStatus: 'ok' | 'error' | 'pending';
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawNewsStory {
  sourceId?: number;
  sourceName: string;
  headline: string;
  url: string;
  summary: string;
  publishedAt?: Date | null;
  categories?: string[];
  guid?: string;
}

export interface NormalizedNewsItem {
  id?: number;
  sourceId?: number;
  sourceName: string;
  headline: string;
  url: string;
  urlHash: string;
  summary: string;
  publishedAt: string;
  discoveredAt: string;
  isUsed: boolean;
  usedInRunId?: number | null;
}

export interface GeneratedArticleSection {
  heading: string;
  quote?: string;
  proTip?: string;
  paragraphs: string[];
  bulletPoints?: string[];
}

export interface GeneratedContentPayload {
  title: string;
  slug: string;
  excerpt: string;
  readMins: string;
  categoryName: string;
  tags: string[];
  sections: GeneratedArticleSection[];
  sourcesUsed: {
    title: string;
    url: string;
    sourceName: string;
  }[];
  seoTitle: string;
  seoDescription: string;
  linkedinPost: string;
  rationale: string;
}

export type RunStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'partial_success'
  | 'failed'
  | 'skipped';

export type WebsiteStatus =
  | 'pending'
  | 'draft_saved'
  | 'published'
  | 'skipped'
  | 'failed';

export type LinkedInStatus =
  | 'pending'
  | 'published'
  | 'skipped'
  | 'failed'
  | 'needs_reconnect';

export interface DailyNewsRunRecord {
  id: number;
  runDate: string; // YYYY-MM-DD
  status: RunStatus;
  triggerType: 'scheduled' | 'manual_run' | 'preview';
  sourcesChecked: number;
  itemsDiscovered: number;
  duplicatesSkipped: number;
  selectedItems?: {
    headline: string;
    url: string;
    sourceName: string;
    publishedAt?: string;
  }[];
  articleTitle?: string;
  articleSlug?: string;
  articleExcerpt?: string;
  articleContent?: GeneratedContentPayload;
  linkedinCommentary?: string;
  postId?: number | null;
  websiteStatus: WebsiteStatus;
  linkedinStatus: LinkedInStatus;
  linkedinPostUrn?: string | null;
  linkedinShareUrl?: string | null;
  errorDetails?: {
    stage?: string;
    message?: string;
    timestamp?: string;
  } | null;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
}

export interface OrchestrationResult {
  success: boolean;
  runId?: number;
  runDate: string;
  status: RunStatus;
  websiteStatus: WebsiteStatus;
  linkedinStatus: LinkedInStatus;
  postId?: number | null;
  postSlug?: string;
  postUrl?: string;
  linkedinPostUrn?: string | null;
  linkedinShareUrl?: string | null;
  sourcesChecked: number;
  itemsDiscovered: number;
  duplicatesSkipped: number;
  generatedContent?: GeneratedContentPayload;
  error?: string;
  warnings?: string[];
}

