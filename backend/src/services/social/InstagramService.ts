import axios from 'axios';
import { logger } from '../../utils/logger';

const GRAPH_API_URL = 'https://graph.facebook.com/v19.0';

export class InstagramService {
  async publishPost(params: {
    accountId: string;
    accessToken: string;
    caption: string;
    mediaUrl: string;
    mediaType: 'image' | 'video' | 'carousel' | 'reel';
  }): Promise<{ postId: string; postUrl: string }> {
    try {
      const { accountId, accessToken, caption, mediaUrl, mediaType } = params;

      if (mediaType === 'carousel') {
        return this.publishCarousel(accountId, accessToken, caption, [mediaUrl]);
      }

      if (mediaType === 'reel') {
        return this.publishReel(accountId, accessToken, caption, mediaUrl);
      }

      const containerResponse = await axios.post(
        `${GRAPH_API_URL}/${accountId}/media`,
        {
          image_url: mediaType === 'image' ? mediaUrl : undefined,
          video_url: mediaType === 'video' ? mediaUrl : undefined,
          caption,
          media_type: mediaType === 'video' ? 'VIDEO' : undefined,
          access_token: accessToken,
        }
      );

      const containerId = containerResponse.data.id;
      await this.waitForMediaProcessing(containerId, accessToken);

      const publishResponse = await axios.post(
        `${GRAPH_API_URL}/${accountId}/media_publish`,
        { creation_id: containerId, access_token: accessToken }
      );

      return {
        postId: publishResponse.data.id,
        postUrl: `https://instagram.com/p/${publishResponse.data.id}`,
      };
    } catch (error) {
      logger.error('Instagram publish failed:', error);
      throw new Error('Failed to publish to Instagram');
    }
  }

  async publishCarousel(
    accountId: string,
    accessToken: string,
    caption: string,
    mediaUrls: string[]
  ): Promise<{ postId: string; postUrl: string }> {
    const childIds: string[] = [];

    for (const url of mediaUrls) {
      const response = await axios.post(`${GRAPH_API_URL}/${accountId}/media`, {
        image_url: url,
        is_carousel_item: true,
        access_token: accessToken,
      });
      childIds.push(response.data.id);
    }

    const containerResponse = await axios.post(`${GRAPH_API_URL}/${accountId}/media`, {
      media_type: 'CAROUSEL',
      children: childIds,
      caption,
      access_token: accessToken,
    });

    const publishResponse = await axios.post(`${GRAPH_API_URL}/${accountId}/media_publish`, {
      creation_id: containerResponse.data.id,
      access_token: accessToken,
    });

    return {
      postId: publishResponse.data.id,
      postUrl: `https://instagram.com/p/${publishResponse.data.id}`,
    };
  }

  async publishReel(
    accountId: string,
    accessToken: string,
    caption: string,
    videoUrl: string
  ): Promise<{ postId: string; postUrl: string }> {
    const containerResponse = await axios.post(`${GRAPH_API_URL}/${accountId}/media`, {
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: accessToken,
    });

    const containerId = containerResponse.data.id;
    await this.waitForMediaProcessing(containerId, accessToken);

    const publishResponse = await axios.post(`${GRAPH_API_URL}/${accountId}/media_publish`, {
      creation_id: containerId,
      access_token: accessToken,
    });

    return {
      postId: publishResponse.data.id,
      postUrl: `https://instagram.com/reel/${publishResponse.data.id}`,
    };
  }

  async publishStory(params: {
    accountId: string;
    accessToken: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
  }): Promise<{ postId: string }> {
    const containerResponse = await axios.post(
      `${GRAPH_API_URL}/${params.accountId}/media`,
      {
        image_url: params.mediaType === 'image' ? params.mediaUrl : undefined,
        video_url: params.mediaType === 'video' ? params.mediaUrl : undefined,
        media_type: 'STORIES',
        access_token: params.accessToken,
      }
    );

    await this.waitForMediaProcessing(containerResponse.data.id, params.accessToken);

    const publishResponse = await axios.post(
      `${GRAPH_API_URL}/${params.accountId}/media_publish`,
      { creation_id: containerResponse.data.id, access_token: params.accessToken }
    );

    return { postId: publishResponse.data.id };
  }

  private async waitForMediaProcessing(containerId: string, accessToken: string, maxRetries: number = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const response = await axios.get(`${GRAPH_API_URL}/${containerId}`, {
        params: { fields: 'status_code', access_token: accessToken },
      });

      if (response.data.status_code === 'FINISHED') return;
      if (response.data.status_code === 'ERROR') throw new Error('Media processing failed');

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error('Media processing timed out');
  }
}

export const instagramService = new InstagramService();
