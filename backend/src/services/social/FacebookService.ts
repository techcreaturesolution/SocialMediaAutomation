import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { logger } from '../../utils/logger';

const GRAPH_API_URL = 'https://graph.facebook.com/v19.0';

export class FacebookService {
  async publishPost(params: {
    pageId: string;
    accessToken: string;
    message: string;
    mediaPath?: string;
    mediaType?: 'image' | 'video';
    link?: string;
  }): Promise<{ postId: string; postUrl: string }> {
    try {
      const { pageId, accessToken, message, mediaPath, mediaType, link } = params;

      if (mediaPath && mediaType === 'video') {
        return this.publishVideo(pageId, accessToken, message, mediaPath);
      }

      if (mediaPath && mediaType === 'image') {
        return this.publishPhoto(pageId, accessToken, message, mediaPath);
      }

      const response = await axios.post(`${GRAPH_API_URL}/${pageId}/feed`, {
        message,
        link,
        access_token: accessToken,
      });

      return {
        postId: response.data.id,
        postUrl: `https://facebook.com/${response.data.id}`,
      };
    } catch (error) {
      logger.error('Facebook publish failed:', error);
      throw new Error('Failed to publish to Facebook');
    }
  }

  async publishPhoto(pageId: string, accessToken: string, caption: string, imagePath: string): Promise<{ postId: string; postUrl: string }> {
    const form = new FormData();
    form.append('source', fs.createReadStream(imagePath));
    form.append('caption', caption);
    form.append('access_token', accessToken);

    const response = await axios.post(`${GRAPH_API_URL}/${pageId}/photos`, form, {
      headers: form.getHeaders(),
    });

    return {
      postId: response.data.id,
      postUrl: `https://facebook.com/${response.data.id}`,
    };
  }

  async publishVideo(pageId: string, accessToken: string, description: string, videoPath: string): Promise<{ postId: string; postUrl: string }> {
    const form = new FormData();
    form.append('source', fs.createReadStream(videoPath));
    form.append('description', description);
    form.append('access_token', accessToken);

    const response = await axios.post(`${GRAPH_API_URL}/${pageId}/videos`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return {
      postId: response.data.id,
      postUrl: `https://facebook.com/${response.data.id}`,
    };
  }

  async createAdCampaign(params: {
    accessToken: string;
    adAccountId: string;
    name: string;
    objective: string;
    budget: number;
    startDate: string;
    endDate: string;
  }): Promise<{ campaignId: string }> {
    try {
      const response = await axios.post(
        `${GRAPH_API_URL}/act_${params.adAccountId}/campaigns`,
        {
          name: params.name,
          objective: params.objective.toUpperCase(),
          status: 'PAUSED',
          special_ad_categories: [],
          daily_budget: params.budget * 100,
          access_token: params.accessToken,
        }
      );

      return { campaignId: response.data.id };
    } catch (error) {
      logger.error('Facebook ad campaign creation failed:', error);
      throw new Error('Failed to create Facebook ad campaign');
    }
  }

  async getPageInsights(pageId: string, accessToken: string): Promise<Record<string, number>> {
    try {
      const response = await axios.get(
        `${GRAPH_API_URL}/${pageId}/insights`,
        {
          params: {
            metric: 'page_impressions,page_engaged_users,page_post_engagements',
            period: 'day',
            access_token: accessToken,
          },
        }
      );

      const insights: Record<string, number> = {};
      for (const metric of response.data.data) {
        insights[metric.name] = metric.values[0]?.value || 0;
      }
      return insights;
    } catch (error) {
      logger.error('Facebook insights fetch failed:', error);
      return {};
    }
  }
}

export const facebookService = new FacebookService();
