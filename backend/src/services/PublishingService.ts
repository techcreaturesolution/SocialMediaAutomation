import { IUser } from '../models/User';
import { IContent } from '../models/Content';
import { logger } from '../utils/logger';
import { facebookService } from './social/FacebookService';
import { instagramService } from './social/InstagramService';
import { twitterService } from './social/TwitterService';
import { linkedInService } from './social/LinkedInService';
import { youtubeService } from './social/YouTubeService';
import { Platform, PublishResult } from '../types';

export class PublishingService {
  async publishToAllPlatforms(
    content: IContent,
    user: IUser,
    platforms: Platform[]
  ): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    const publishPromises = platforms.map(async (platform) => {
      try {
        const variant = content.platformVariants.find((v) => v.platform === platform);
        const text = variant?.text || content.generatedText;
        const hashtags = variant?.hashtags || content.hashtags;
        const fullText = `${text}\n\n${hashtags.join(' ')}`;
        const mediaUrl = variant?.mediaUrl || content.mediaUrls[0];

        const result = await this.publishToPlatform(platform, {
          user,
          text: fullText,
          mediaPath: mediaUrl,
          mediaType: (['video', 'reel'].includes(content.contentType) ? 'video' : 'image') as 'image' | 'video',
          title: content.title,
          hashtags,
        });

        results.push(result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to publish to ${platform}:`, error);
        results.push({
          platform,
          success: false,
          error: errorMsg,
        });
      }
    });

    await Promise.allSettled(publishPromises);
    return results;
  }

  private async publishToPlatform(
    platform: Platform,
    params: {
      user: IUser;
      text: string;
      mediaPath?: string;
      mediaType?: 'image' | 'video';
      title: string;
      hashtags: string[];
    }
  ): Promise<PublishResult> {
    const { user, text, mediaPath, mediaType, title, hashtags } = params;

    switch (platform) {
      case 'facebook': {
        const fb = user.socialAccounts.facebook;
        if (!fb?.accessToken || !fb?.pageId) {
          return { platform, success: false, error: 'Facebook not connected' };
        }
        const result = await facebookService.publishPost({
          pageId: fb.pageId,
          accessToken: fb.accessToken,
          message: text,
          mediaPath,
          mediaType,
        });
        return { platform, success: true, postId: result.postId, postUrl: result.postUrl };
      }

      case 'instagram': {
        const ig = user.socialAccounts.instagram;
        if (!ig?.accessToken || !ig?.accountId) {
          return { platform, success: false, error: 'Instagram not connected' };
        }
        if (!mediaPath) {
          return { platform, success: false, error: 'Instagram requires media' };
        }
        const result = await instagramService.publishPost({
          accountId: ig.accountId,
          accessToken: ig.accessToken,
          caption: text,
          mediaUrl: mediaPath,
          mediaType: mediaType || 'image',
        });
        return { platform, success: true, postId: result.postId, postUrl: result.postUrl };
      }

      case 'twitter': {
        const tw = user.socialAccounts.twitter;
        const result = await twitterService.publishTweet({
          text: text.substring(0, 280),
          mediaPath,
          mediaType,
          accessToken: tw?.accessToken,
          accessSecret: tw?.accessSecret,
        });
        return { platform, success: true, postId: result.postId, postUrl: result.postUrl };
      }

      case 'linkedin': {
        const li = user.socialAccounts.linkedin;
        if (!li?.accessToken) {
          return { platform, success: false, error: 'LinkedIn not connected' };
        }
        const authorUrn = li.organizationId
          ? `urn:li:organization:${li.organizationId}`
          : `urn:li:person:${user._id}`;
        const result = await linkedInService.publishPost({
          accessToken: li.accessToken,
          authorUrn,
          text,
          mediaPath,
          mediaType,
        });
        return { platform, success: true, postId: result.postId, postUrl: result.postUrl };
      }

      case 'youtube': {
        const yt = user.socialAccounts.youtube;
        if (!yt?.accessToken || !mediaPath || mediaType !== 'video') {
          return { platform, success: false, error: 'YouTube requires video and auth' };
        }
        let accessToken = yt.accessToken;
        if (yt.refreshToken) {
          accessToken = await youtubeService.refreshAccessToken(yt.refreshToken);
        }
        const result = await youtubeService.uploadVideo({
          accessToken,
          videoPath: mediaPath,
          title,
          description: text,
          tags: hashtags.map((h) => h.replace('#', '')),
        });
        return { platform, success: true, postId: result.videoId, postUrl: result.videoUrl };
      }

      default:
        return { platform, success: false, error: `Unsupported platform: ${platform}` };
    }
  }
}

export const publishingService = new PublishingService();
