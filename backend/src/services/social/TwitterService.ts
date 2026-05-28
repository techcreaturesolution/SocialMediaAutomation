import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

export class TwitterService {
  private getClient(accessToken?: string, accessSecret?: string): TwitterApi {
    return new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: accessToken || config.twitter.accessToken,
      accessSecret: accessSecret || config.twitter.accessSecret,
    });
  }

  async publishTweet(params: {
    text: string;
    mediaPath?: string;
    mediaType?: 'image' | 'video';
    accessToken?: string;
    accessSecret?: string;
  }): Promise<{ postId: string; postUrl: string }> {
    try {
      const client = this.getClient(params.accessToken, params.accessSecret);

      let mediaId: string | undefined;

      if (params.mediaPath) {
        mediaId = await this.uploadMedia(client, params.mediaPath, params.mediaType || 'image');
      }

      const tweet = await client.v2.tweet({
        text: params.text,
        ...(mediaId ? { media: { media_ids: [mediaId] } } : {}),
      });

      return {
        postId: tweet.data.id,
        postUrl: `https://twitter.com/i/status/${tweet.data.id}`,
      };
    } catch (error) {
      logger.error('Twitter publish failed:', error);
      throw new Error('Failed to publish to Twitter/X');
    }
  }

  async publishThread(params: {
    tweets: string[];
    accessToken?: string;
    accessSecret?: string;
  }): Promise<Array<{ postId: string; postUrl: string }>> {
    const client = this.getClient(params.accessToken, params.accessSecret);
    const results: Array<{ postId: string; postUrl: string }> = [];
    let replyToId: string | undefined;

    for (const text of params.tweets) {
      const tweet = await client.v2.tweet({
        text,
        ...(replyToId ? { reply: { in_reply_to_tweet_id: replyToId } } : {}),
      });

      replyToId = tweet.data.id;
      results.push({
        postId: tweet.data.id,
        postUrl: `https://twitter.com/i/status/${tweet.data.id}`,
      });
    }

    return results;
  }

  async getTrendingTopics(woeid: number = 1): Promise<Array<{ name: string; tweetVolume: number | null }>> {
    try {
      const client = this.getClient();
      const trends = await client.v1.trendsByPlace(woeid);

      return trends[0].trends.map((trend) => ({
        name: trend.name,
        tweetVolume: trend.tweet_volume,
      }));
    } catch (error) {
      logger.error('Twitter trends fetch failed:', error);
      return [];
    }
  }

  private async uploadMedia(client: TwitterApi, filePath: string, mediaType: 'image' | 'video'): Promise<string> {
    const fileBuffer = fs.readFileSync(filePath);

    if (mediaType === 'video') {
      const mediaId = await client.v1.uploadMedia(fileBuffer, {
        mimeType: 'video/mp4',
        type: 'longVideo',
      });
      return mediaId;
    }

    const mediaId = await client.v1.uploadMedia(fileBuffer, {
      mimeType: 'image/png',
    });
    return mediaId;
  }
}

export const twitterService = new TwitterService();
