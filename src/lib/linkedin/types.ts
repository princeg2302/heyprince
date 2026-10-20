export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  personUrnOverride?: string;
  isConfigured: boolean;
}

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  id_token?: string;
}

export interface LinkedInConnectionRecord {
  id: number;
  admin_user_id?: number | null;
  person_urn: string;
  member_id?: string | null;
  name?: string | null;
  headline?: string | null;
  avatar_url?: string | null;
  access_token: string;
  refresh_token?: string | null;
  expires_at: string;
  refresh_expires_at?: string | null;
  scope: string;
  is_active: boolean;
  last_published_at?: string | null;
  organization_urn?: string | null;
  organization_name?: string | null;
  post_target?: 'personal' | 'organization' | 'both';
  created_at: string;
  updated_at: string;
}

export interface LinkedInShareRecord {
  id: number;
  post_id: number;
  linkedin_post_urn?: string | null;
  author_urn: string;
  status: 'published' | 'failed';
  commentary?: string | null;
  article_url: string;
  api_response?: any;
  error_message?: string | null;
  created_at: string;
}

export interface PublishArticleResult {
  success: boolean;
  postUrn?: string;
  postUrl?: string;
  endpointUsed?: 'rest/posts' | 'v2/ugcPosts';
  error?: string;
  details?: any;
  shares?: {
    target: 'personal' | 'organization';
    authorUrn: string;
    postUrn?: string;
    postUrl?: string;
    success: boolean;
    error?: string;
  }[];
}

