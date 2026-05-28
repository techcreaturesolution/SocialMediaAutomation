import axios from 'axios';
import fs from 'fs';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';

export class YouTubeService {
  async uploadVideo(params: {
    accessToken: string;
    videoPath: string;
    title: string;
    description: string;
    tags: string[];
    categoryId?: string;
    privacyStatus?: 'public' | 'private' | 'unlisted';
    thumbnailPath?: string;
  }): Promise<{ videoId: string; videoUrl: string }> {
    try {
      const metadata = {
        snippet: {
          title: params.title,
          description: params.description,
          tags: params.tags,
          categoryId: params.categoryId || '28',
        },
        status: {
          privacyStatus: params.privacyStatus || 'public',
          embeddable: true,
          publicStatsViewable: true,
        },
      };

      const videoFile = fs.readFileSync(params.videoPath);

      const response = await axios.post(
        `${YOUTUBE_UPLOAD_URL}?uploadType=multipart&part=snippet,status`,
        this.createMultipartBody(metadata, videoFile),
        {
          headers: {
            Authorization: `Bearer ${params.accessToken}`,
            'Content-Type': 'multipart/related; boundary=boundary_string',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const videoId = response.data.id;

      if (params.thumbnailPath) {
        await this.setThumbnail(params.accessToken, videoId, params.thumbnailPath);
      }

      return {
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (error) {
      logger.error('YouTube upload failed:', error);
      throw new Error('Failed to upload to YouTube');
    }
  }

  async setThumbnail(accessToken: string, videoId: string, thumbnailPath: string): Promise<void> {
    const thumbnailFile = fs.readFileSync(thumbnailPath);
    await axios.post(
      `${YOUTUBE_UPLOAD_URL.replace('/videos', '/thumbnails/set')}?videoId=${videoId}`,
      thumbnailFile,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'image/png',
        },
      }
    );
  }

  async getChannelStats(accessToken: string, channelId: string): Promise<Record<string, string>> {
    try {
      const response = await axios.get(`${YOUTUBE_API_URL}/channels`, {
        params: {
          part: 'statistics',
          id: channelId,
          key: config.google.clientId,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data.items[0]?.statistics || {};
    } catch (error) {
      logger.error('YouTube stats fetch failed:', error);
      return {};
    }
  }

  async getAuthUrl(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.readonly',
    ];

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.clientId}&redirect_uri=${config.google.youtubeRedirectUri}&response_type=code&scope=${scopes.join(' ')}&access_type=offline&prompt=consent`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.youtubeRedirectUri,
      grant_type: 'authorization_code',
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      refresh_token: refreshToken,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      grant_type: 'refresh_token',
    });

    return response.data.access_token;
  }

  private createMultipartBody(metadata: Record<string, unknown>, videoFile: Buffer): Buffer {
    const boundary = 'boundary_string';
    const metadataStr = JSON.stringify(metadata);

    const parts = [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      metadataStr,
      `\r\n--${boundary}\r\n`,
      'Content-Type: video/mp4\r\n\r\n',
    ];

    const header = Buffer.from(parts.join(''));
    const footer = Buffer.from(`\r\n--${boundary}--`);

    return Buffer.concat([header, videoFile, footer]);
  }
}

export const youtubeService = new YouTubeService();
