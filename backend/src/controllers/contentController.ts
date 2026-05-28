import { Response } from 'express';
import { Content } from '../models/Content';
import { Schedule } from '../models/Schedule';
import { AuthRequest } from '../middleware/auth';
import { aiContentService } from '../services/AIContentService';
import { imageGenerationService } from '../services/ImageGenerationService';
import { videoGenerationService } from '../services/VideoGenerationService';
import { translationService } from '../services/TranslationService';
import { publishingService } from '../services/PublishingService';
import { logger } from '../utils/logger';
import { Platform, Language } from '../types';

export const generateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  let contentId: string | null = null;
  try {
    const user = req.user!;
    const {
      topic, contentType, platforms, language, tone,
      includeHashtags, includeBranding, scheduleAt, isAd, adSettings,
    } = req.body;

    const startTime = Date.now();

    const content = new Content({
      userId: user._id,
      title: topic,
      topic,
      contentType,
      status: 'generating',
      language: language || 'en',
      tone: tone || 'professional',
      isAd: isAd || false,
    });
    await content.save();
    contentId = content._id.toString();

    let aiResult;
    if (isAd && adSettings) {
      const adContent = await aiContentService.generateAdContent({
        topic,
        objective: adSettings.objective,
        targetAudience: adSettings.targetAudience,
        companyName: user.companyBranding.name,
        platforms,
        language: language || 'en',
      });
      aiResult = {
        title: adContent.headline,
        mainText: adContent.primaryText,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, '#ad', '#sponsored'],
        platformVariants: Object.fromEntries(
          Object.entries(adContent.platformVariants).map(([k, v]) => [
            k,
            { text: `${v.headline}\n\n${v.text}\n\n${v.cta}`, hashtags: [] },
          ])
        ),
      };
    } else {
      aiResult = await aiContentService.generateTextContent({
        topic,
        contentType,
        platforms,
        language: language || 'en',
        tone: tone || 'professional',
        companyName: user.companyBranding.name,
        companyTagline: user.companyBranding.tagline,
      });
    }

    if (language && language !== 'en') {
      const translated = await translationService.translateContentForPlatforms({
        text: aiResult.mainText,
        hashtags: aiResult.hashtags,
        targetLanguage: language as Language,
      });
      aiResult.mainText = translated.text;
      aiResult.hashtags = translated.hashtags;
    }

    content.title = aiResult.title;
    content.generatedText = aiResult.mainText;
    content.hashtags = includeHashtags !== false ? aiResult.hashtags : [];

    if (contentType === 'image' || contentType === 'carousel' || contentType === 'story') {
      try {
        const image = await imageGenerationService.generateImage({
          prompt: `${topic} - ${aiResult.title}`,
          quality: 'hd',
        });

        let imagePath = image.localPath;

        if (includeBranding !== false && user.companyBranding.name) {
          imagePath = await imageGenerationService.addBrandingToImage({
            imagePath: image.localPath,
            companyName: user.companyBranding.name,
            website: user.companyBranding.website,
            email: user.companyBranding.email,
            phone: user.companyBranding.phone,
            primaryColor: user.companyBranding.primaryColor,
          });
        }

        content.mediaUrls = [imagePath];
        content.thumbnailUrl = await imageGenerationService.createThumbnail(imagePath);

        if (includeBranding !== false) {
          content.branding = {
            companyName: user.companyBranding.name,
            logoUrl: user.companyBranding.logoUrl,
            website: user.companyBranding.website,
            email: user.companyBranding.email,
            phone: user.companyBranding.phone,
            watermarked: true,
          };
        }
      } catch (imgError) {
        logger.warn('Image generation failed, continuing without media:', imgError);
      }
    }

    if (contentType === 'video' || contentType === 'reel') {
      try {
        const video = await videoGenerationService.generateVideoFromText({
          prompt: `${topic} - ${aiResult.title}`,
          aspectRatio: contentType === 'reel' ? '9:16' : '16:9',
        });

        let videoPath = video.localPath;

        if (includeBranding !== false && user.companyBranding.name) {
          try {
            videoPath = await videoGenerationService.addBrandingOverlayToVideo({
              videoPath: video.localPath,
              companyName: user.companyBranding.name,
              website: user.companyBranding.website,
            });
          } catch {
            logger.warn('Video branding failed, using unbranded video');
          }
        }

        content.mediaUrls = [videoPath];

        if (includeBranding !== false) {
          content.branding = {
            companyName: user.companyBranding.name,
            logoUrl: user.companyBranding.logoUrl,
            website: user.companyBranding.website,
            email: user.companyBranding.email,
            phone: user.companyBranding.phone,
            watermarked: true,
          };
        }
      } catch (vidError) {
        logger.warn('Video generation failed, continuing without media:', vidError);
      }
    }

    content.platformVariants = platforms.map((platform: string) => {
      const variant = aiResult.platformVariants[platform];
      return {
        platform,
        text: variant?.text || aiResult.mainText,
        hashtags: variant?.hashtags || aiResult.hashtags,
        mediaUrl: content.mediaUrls[0] || '',
        postId: '',
        postUrl: '',
        status: 'pending',
        error: '',
      };
    });

    content.metadata = {
      aiModel: 'gpt-4o',
      generationTime: Date.now() - startTime,
      prompt: topic,
      translatedFrom: language !== 'en' ? 'en' : '',
    };

    if (isAd && adSettings) {
      content.adSettings = {
        objective: adSettings.objective,
        budget: adSettings.budget,
        currency: adSettings.currency || 'INR',
        targetAudience: adSettings.targetAudience,
        duration: adSettings.duration || 7,
        startDate: adSettings.startDate ? new Date(adSettings.startDate) : new Date(),
        endDate: adSettings.endDate ? new Date(adSettings.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        adId: '',
        campaignId: '',
        status: 'draft',
      };
    }

    if (scheduleAt) {
      content.status = 'scheduled';
      content.scheduling = {
        scheduledAt: new Date(scheduleAt),
        timezone: req.body.timezone || 'Asia/Kolkata',
        recurring: req.body.recurring || false,
        cronExpression: req.body.cronExpression || '',
      };

      await Schedule.create({
        userId: user._id,
        contentId: content._id,
        platforms,
        scheduledAt: new Date(scheduleAt),
        timezone: req.body.timezone || 'Asia/Kolkata',
        recurring: req.body.recurring || false,
        cronExpression: req.body.cronExpression || '',
      });
    } else {
      content.status = 'ready';
    }

    await content.save();

    res.status(201).json({
      message: 'Content generated successfully',
      content: {
        id: content._id,
        title: content.title,
        status: content.status,
        generatedText: content.generatedText,
        hashtags: content.hashtags,
        mediaUrls: content.mediaUrls,
        thumbnailUrl: content.thumbnailUrl,
        platformVariants: content.platformVariants,
        branding: content.branding,
        isAd: content.isAd,
        adSettings: content.adSettings,
        metadata: content.metadata,
      },
    });
  } catch (error) {
    if (contentId) {
      await Content.findByIdAndUpdate(contentId, { status: 'failed' });
    }
    logger.error('Content generation failed:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
};

export const publishContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { contentId } = req.params;
    const { platforms } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: user._id });
    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    if (content.status !== 'ready' && content.status !== 'failed') {
      res.status(400).json({ error: `Cannot publish content with status: ${content.status}` });
      return;
    }

    content.status = 'publishing';
    await content.save();

    const targetPlatforms = platforms || content.platformVariants.map((v) => v.platform);
    const results = await publishingService.publishToAllPlatforms(content, user, targetPlatforms as Platform[]);

    for (const result of results) {
      const variant = content.platformVariants.find((v) => v.platform === result.platform);
      if (variant) {
        variant.status = result.success ? 'published' : 'failed';
        variant.postId = result.postId || '';
        variant.postUrl = result.postUrl || '';
        variant.publishedAt = new Date();
        variant.error = result.error || '';
      }
    }

    content.status = results.every((r) => r.success) ? 'published' : 'failed';
    await content.save();

    res.json({
      message: 'Publishing completed',
      results,
      content: {
        id: content._id,
        status: content.status,
        platformVariants: content.platformVariants,
      },
    });
  } catch (error) {
    logger.error('Content publishing failed:', error);
    res.status(500).json({ error: 'Failed to publish content' });
  }
};

export const getContents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, contentType, page = 1, limit = 20 } = req.query;

    const filter: Record<string, unknown> = { userId: user._id };
    if (status) filter.status = status;
    if (contentType) filter.contentType = contentType;

    const total = await Content.countDocuments(filter);
    const contents = await Content.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      contents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get contents failed:', error);
    res.status(500).json({ error: 'Failed to get contents' });
  }
};

export const getContentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const content = await Content.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }
    res.json({ content });
  } catch (error) {
    logger.error('Get content failed:', error);
    res.status(500).json({ error: 'Failed to get content' });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const content = await Content.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }
    await Schedule.deleteMany({ contentId: content._id });
    res.json({ message: 'Content deleted' });
  } catch (error) {
    logger.error('Delete content failed:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
};

export const getTrendingTopics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const topics = await aiContentService.generateTrendingTopics('technology');
    res.json({ topics });
  } catch (error) {
    logger.error('Get trending topics failed:', error);
    res.status(500).json({ error: 'Failed to get trending topics' });
  }
};

export const generateHashtags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topic, platform, count } = req.body;
    const hashtags = await aiContentService.generateHashtags(topic, platform || 'instagram', count || 15);
    res.json({ hashtags });
  } catch (error) {
    logger.error('Generate hashtags failed:', error);
    res.status(500).json({ error: 'Failed to generate hashtags' });
  }
};

export const getSupportedLanguages = async (_req: AuthRequest, res: Response): Promise<void> => {
  const languages = translationService.getSupportedLanguages();
  res.json({ languages });
};

export const translateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, hashtags, targetLanguage, sourceLanguage } = req.body;
    const result = await translationService.translateContentForPlatforms({
      text,
      hashtags: hashtags || [],
      targetLanguage,
      sourceLanguage,
    });
    res.json(result);
  } catch (error) {
    logger.error('Translate content failed:', error);
    res.status(500).json({ error: 'Failed to translate content' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const [totalContent, published, scheduled, failed, recentContent] = await Promise.all([
      Content.countDocuments({ userId }),
      Content.countDocuments({ userId, status: 'published' }),
      Content.countDocuments({ userId, status: 'scheduled' }),
      Content.countDocuments({ userId, status: 'failed' }),
      Content.find({ userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    const platformStats = await Content.aggregate([
      { $match: { userId } },
      { $unwind: '$platformVariants' },
      {
        $group: {
          _id: '$platformVariants.platform',
          total: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ['$platformVariants.status', 'published'] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      stats: { totalContent, published, scheduled, failed },
      platformStats,
      recentContent,
    });
  } catch (error) {
    logger.error('Dashboard stats failed:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};
