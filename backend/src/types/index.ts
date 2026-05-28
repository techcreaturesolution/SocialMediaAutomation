export type ContentType = 'image' | 'video' | 'text' | 'carousel' | 'reel' | 'story';

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';

export type ContentStatus = 'draft' | 'generating' | 'ready' | 'scheduled' | 'publishing' | 'published' | 'failed';

export type Language =
  | 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja'
  | 'ko' | 'ar' | 'ru' | 'it' | 'nl' | 'tr' | 'pl' | 'sv'
  | 'da' | 'no' | 'fi' | 'th' | 'vi' | 'id' | 'ms' | 'tl'
  | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'ur';

export type AdObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'conversions' | 'app_installs';

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

export interface GenerateContentRequest {
  topic: string;
  contentType: ContentType;
  platforms: Platform[];
  language: Language;
  tone: 'professional' | 'casual' | 'humorous' | 'educational' | 'inspirational';
  includeHashtags: boolean;
  includeBranding: boolean;
  scheduleAt?: string;
  adSettings?: {
    objective: AdObjective;
    budget: number;
    currency: string;
    targetAudience: string;
    duration: number;
  };
}

export interface GeneratedContent {
  text: string;
  hashtags: string[];
  mediaUrl?: string;
  thumbnailUrl?: string;
  platformVariants: Record<Platform, {
    text: string;
    mediaUrl?: string;
    hashtags: string[];
  }>;
}

export interface PublishResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface TrendingTopic {
  title: string;
  description: string;
  category: string;
  trendScore: number;
  source: string;
  relatedKeywords: string[];
}
