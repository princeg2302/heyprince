export type SocialPlatform = 'threads' | 'twitter' | 'whatsapp';

export interface SocialPublishParams {
  postId: number;
  customText?: string;
  imageUrl?: string;
  articleUrl?: string;
  target?: string;
}

export interface SocialPublishResult {
  success: boolean;
  platform: SocialPlatform;
  externalPostId?: string;
  externalPostUrl?: string;
  error?: string;
  details?: any;
}

export interface MultiPlatformPublishResult {
  success: boolean;
  postId: number;
  results: SocialPublishResult[];
  publishedCount: number;
  failedCount: number;
  skippedCount: number;
}

export interface PlatformConfigStatus {
  platform: SocialPlatform;
  name: string;
  isConfigured: boolean;
  accountIdentifier?: string;
  missingKeys: string[];
}

export interface SocialShareRecord {
  id: number;
  post_id: number;
  platform: SocialPlatform;
  external_post_id?: string | null;
  external_post_url?: string | null;
  status: 'published' | 'failed' | 'skipped';
  content_text?: string | null;
  article_url?: string | null;
  image_url?: string | null;
  api_response?: any;
  error_message?: string | null;
  created_at: string;
}
