export type ContentType = 'image' | 'video' | 'text' | 'carousel' | 'reel' | 'story';
export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';
export type ContentStatus = 'draft' | 'generating' | 'ready' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyBranding: CompanyBranding;
  socialAccounts: Record<string, boolean>;
  preferences: UserPreferences;
}

export interface CompanyBranding {
  name: string;
  logoUrl: string;
  website: string;
  email: string;
  phone: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
}

export interface UserPreferences {
  defaultLanguage: string;
  defaultTone: string;
  autoPublish: boolean;
  defaultPlatforms: string[];
}

export interface Content {
  _id: string;
  title: string;
  topic: string;
  contentType: ContentType;
  status: ContentStatus;
  language: string;
  tone: string;
  generatedText: string;
  hashtags: string[];
  mediaUrls: string[];
  thumbnailUrl: string;
  platformVariants: PlatformVariant[];
  branding: {
    companyName: string;
    logoUrl: string;
    website: string;
    email: string;
    phone: string;
    watermarked: boolean;
  };
  isAd: boolean;
  adSettings?: AdSettings;
  analytics: ContentAnalytics;
  metadata?: {
    aiModel: string;
    generationTime: number;
    prompt: string;
    translatedFrom: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlatformVariant {
  platform: string;
  text: string;
  hashtags: string[];
  mediaUrl: string;
  postId: string;
  postUrl: string;
  publishedAt?: string;
  status: string;
  error: string;
}

export interface AdSettings {
  objective: string;
  budget: number;
  currency: string;
  targetAudience: string;
  duration: number;
  startDate: string;
  endDate: string;
}

export interface ContentAnalytics {
  impressions: number;
  clicks: number;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  engagement: number;
}

export interface Schedule {
  _id: string;
  contentId: string | Content;
  platforms: string[];
  scheduledAt: string;
  timezone: string;
  status: string;
  recurring: boolean;
  cronExpression: string;
  results: Array<{
    platform: string;
    success: boolean;
    postUrl: string;
    error: string;
  }>;
}

export interface TrendingTopic {
  title: string;
  description: string;
  trendScore: number;
  suggestedHashtags: string[];
}

export interface DashboardStats {
  stats: {
    totalContent: number;
    published: number;
    scheduled: number;
    failed: number;
  };
  platformStats: Array<{
    _id: string;
    total: number;
    published: number;
  }>;
  recentContent: Content[];
}

export interface Language {
  code: string;
  name: string;
}
