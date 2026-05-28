import mongoose, { Document, Schema } from 'mongoose';

export interface IContent extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  topic: string;
  contentType: 'image' | 'video' | 'text' | 'carousel' | 'reel' | 'story';
  status: 'draft' | 'generating' | 'ready' | 'scheduled' | 'publishing' | 'published' | 'failed';
  language: string;
  tone: string;

  generatedText: string;
  hashtags: string[];
  mediaUrls: string[];
  thumbnailUrl: string;

  platformVariants: Array<{
    platform: string;
    text: string;
    hashtags: string[];
    mediaUrl: string;
    postId: string;
    postUrl: string;
    publishedAt: Date;
    status: string;
    error: string;
  }>;

  branding: {
    companyName: string;
    logoUrl: string;
    website: string;
    email: string;
    phone: string;
    watermarked: boolean;
  };

  scheduling: {
    scheduledAt: Date;
    timezone: string;
    recurring: boolean;
    cronExpression: string;
  };

  isAd: boolean;
  adSettings: {
    objective: string;
    budget: number;
    currency: string;
    targetAudience: string;
    duration: number;
    startDate: Date;
    endDate: Date;
    adId: string;
    campaignId: string;
    status: string;
  };

  analytics: {
    impressions: number;
    clicks: number;
    likes: number;
    shares: number;
    comments: number;
    reach: number;
    engagement: number;
  };

  metadata: {
    aiModel: string;
    generationTime: number;
    prompt: string;
    translatedFrom: string;
  };
}

const contentSchema = new Schema<IContent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    contentType: {
      type: String,
      enum: ['image', 'video', 'text', 'carousel', 'reel', 'story'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'generating', 'ready', 'scheduled', 'publishing', 'published', 'failed'],
      default: 'draft',
    },
    language: { type: String, default: 'en' },
    tone: { type: String, default: 'professional' },

    generatedText: { type: String, default: '' },
    hashtags: [{ type: String }],
    mediaUrls: [{ type: String }],
    thumbnailUrl: { type: String, default: '' },

    platformVariants: [
      {
        platform: { type: String, required: true },
        text: { type: String, default: '' },
        hashtags: [{ type: String }],
        mediaUrl: { type: String, default: '' },
        postId: { type: String, default: '' },
        postUrl: { type: String, default: '' },
        publishedAt: { type: Date },
        status: { type: String, default: 'pending' },
        error: { type: String, default: '' },
      },
    ],

    branding: {
      companyName: { type: String, default: '' },
      logoUrl: { type: String, default: '' },
      website: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      watermarked: { type: Boolean, default: false },
    },

    scheduling: {
      scheduledAt: { type: Date },
      timezone: { type: String, default: 'Asia/Kolkata' },
      recurring: { type: Boolean, default: false },
      cronExpression: { type: String, default: '' },
    },

    isAd: { type: Boolean, default: false },
    adSettings: {
      objective: { type: String, default: '' },
      budget: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      targetAudience: { type: String, default: '' },
      duration: { type: Number, default: 7 },
      startDate: { type: Date },
      endDate: { type: Date },
      adId: { type: String, default: '' },
      campaignId: { type: String, default: '' },
      status: { type: String, default: '' },
    },

    analytics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
    },

    metadata: {
      aiModel: { type: String, default: '' },
      generationTime: { type: Number, default: 0 },
      prompt: { type: String, default: '' },
      translatedFrom: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

contentSchema.index({ status: 1, 'scheduling.scheduledAt': 1 });
contentSchema.index({ userId: 1, createdAt: -1 });

export const Content = mongoose.model<IContent>('Content', contentSchema);
