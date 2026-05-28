import axios from 'axios';
import fs from 'fs';
import { logger } from '../../utils/logger';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

export class LinkedInService {
  async publishPost(params: {
    accessToken: string;
    organizationId?: string;
    authorUrn: string;
    text: string;
    mediaPath?: string;
    mediaType?: 'image' | 'video';
    link?: string;
  }): Promise<{ postId: string; postUrl: string }> {
    try {
      const { accessToken, authorUrn, text, mediaPath, mediaType, link } = params;

      let mediaAsset: string | undefined;
      if (mediaPath && mediaType) {
        mediaAsset = await this.uploadMedia(accessToken, authorUrn, mediaPath, mediaType);
      }

      const postBody: Record<string, unknown> = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: mediaAsset ? (mediaType === 'video' ? 'VIDEO' : 'IMAGE') : (link ? 'ARTICLE' : 'NONE'),
            ...(mediaAsset ? {
              media: [{
                status: 'READY',
                media: mediaAsset,
              }],
            } : {}),
            ...(link && !mediaAsset ? {
              media: [{
                status: 'READY',
                originalUrl: link,
              }],
            } : {}),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await axios.post(`${LINKEDIN_API_URL}/ugcPosts`, postBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      const postId = response.headers['x-restli-id'] || response.data.id;

      return {
        postId,
        postUrl: `https://www.linkedin.com/feed/update/${postId}`,
      };
    } catch (error) {
      logger.error('LinkedIn publish failed:', error);
      throw new Error('Failed to publish to LinkedIn');
    }
  }

  private async uploadMedia(
    accessToken: string,
    authorUrn: string,
    filePath: string,
    mediaType: 'image' | 'video'
  ): Promise<string> {
    const registerResponse = await axios.post(
      `${LINKEDIN_API_URL}/assets?action=registerUpload`,
      {
        registerUploadRequest: {
          recipes: [mediaType === 'video'
            ? 'urn:li:digitalmediaRecipe:feedshare-video'
            : 'urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const uploadUrl = registerResponse.data.value.uploadMechanism[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ].uploadUrl;
    const asset = registerResponse.data.value.asset;

    const fileBuffer = fs.readFileSync(filePath);
    await axios.put(uploadUrl, fileBuffer, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return asset;
  }
}

export const linkedInService = new LinkedInService();
