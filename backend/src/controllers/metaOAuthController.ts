import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';
import { User } from '../models/User';
import { logger } from '../utils/logger';

function signState(payload: Record<string, string>): string {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', config.jwtSecret).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64');
}

function verifyState(state: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64').toString());
    const expectedSig = crypto.createHmac('sha256', config.jwtSecret).update(parsed.data).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(parsed.signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return null;
    }
    return JSON.parse(parsed.data);
  } catch {
    return null;
  }
}

const GRAPH_API_URL = 'https://graph.facebook.com/v19.0';

const META_PERMISSIONS = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_insights',
  'business_management',
  'ads_management',
  'ads_read',
  'read_insights',
].join(',');

export const getMetaLoginUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const state = signState({ userId });

    const params = new URLSearchParams({
      client_id: config.meta.appId,
      redirect_uri: config.meta.redirectUri,
      scope: META_PERMISSIONS,
      response_type: 'code',
      state,
    });

    const loginUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
    res.json({ loginUrl });
  } catch (error) {
    logger.error('Failed to generate Meta login URL:', error);
    res.status(500).json({ error: 'Failed to generate login URL' });
  }
};

export const metaOAuthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.error('Meta OAuth error:', oauthError);
      res.redirect(`${config.frontendUrl}/settings?meta_error=${encodeURIComponent(String(oauthError))}`);
      return;
    }

    if (!code || !state) {
      res.redirect(`${config.frontendUrl}/settings?meta_error=missing_params`);
      return;
    }

    const stateData = verifyState(state as string);
    if (!stateData || !stateData.userId) {
      logger.error('Meta OAuth: invalid or forged state parameter');
      res.redirect(`${config.frontendUrl}/settings?meta_error=invalid_state`);
      return;
    }
    const userId = stateData.userId;

    const tokenResponse = await axios.get(`${GRAPH_API_URL}/oauth/access_token`, {
      params: {
        client_id: config.meta.appId,
        client_secret: config.meta.appSecret,
        redirect_uri: config.meta.redirectUri,
        code,
      },
    });

    const shortLivedToken = tokenResponse.data.access_token;

    const longLivedResponse = await axios.get(`${GRAPH_API_URL}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: config.meta.appId,
        client_secret: config.meta.appSecret,
        fb_exchange_token: shortLivedToken,
      },
    });

    const longLivedToken = longLivedResponse.data.access_token;
    const expiresIn = longLivedResponse.data.expires_in || 5184000;

    const pagesResponse = await axios.get(`${GRAPH_API_URL}/me/accounts`, {
      params: {
        access_token: longLivedToken,
        fields: 'id,name,access_token,category,instagram_business_account{id,username,profile_picture_url}',
      },
    });

    const pages = pagesResponse.data.data || [];

    const user = await User.findById(userId);
    if (!user) {
      res.redirect(`${config.frontendUrl}/settings?meta_error=user_not_found`);
      return;
    }

    user.metaConnection = {
      userAccessToken: longLivedToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      pages: pages.map((page: Record<string, unknown>) => {
        const igAccount = page.instagram_business_account as Record<string, string> | undefined;
        return {
          pageId: page.id as string,
          pageName: page.name as string,
          pageAccessToken: page.access_token as string,
          category: page.category as string,
          instagramBusinessAccount: igAccount ? {
            id: igAccount.id,
            username: igAccount.username,
            profilePictureUrl: igAccount.profile_picture_url,
          } : undefined,
        };
      }),
      connectedAt: new Date(),
    };

    if (pages.length === 1) {
      const page = pages[0];
      user.socialAccounts.facebook = {
        accessToken: page.access_token,
        pageId: page.id,
        pageName: page.name,
      };

      const igAccount = page.instagram_business_account as Record<string, string> | undefined;
      if (igAccount) {
        user.socialAccounts.instagram = {
          accessToken: page.access_token,
          accountId: igAccount.id,
        };
      }
    }

    await user.save();

    if (pages.length === 1) {
      res.redirect(`${config.frontendUrl}/settings?meta_success=true`);
    } else {
      res.redirect(`${config.frontendUrl}/settings?meta_connected=true&pages=${pages.length}`);
    }
  } catch (error) {
    logger.error('Meta OAuth callback failed:', error);
    res.redirect(`${config.frontendUrl}/settings?meta_error=callback_failed`);
  }
};

export const getMetaPages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    if (!user.metaConnection?.pages?.length) {
      res.json({ pages: [], connected: false });
      return;
    }

    const pages = user.metaConnection.pages.map((page) => ({
      pageId: page.pageId,
      pageName: page.pageName,
      category: page.category,
      hasInstagram: !!page.instagramBusinessAccount,
      instagramUsername: page.instagramBusinessAccount?.username,
      instagramProfilePicture: page.instagramBusinessAccount?.profilePictureUrl,
      isSelected: user.socialAccounts.facebook?.pageId === page.pageId,
    }));

    res.json({
      pages,
      connected: true,
      tokenExpiresAt: user.metaConnection.tokenExpiresAt,
      connectedAt: user.metaConnection.connectedAt,
    });
  } catch (error) {
    logger.error('Get Meta pages failed:', error);
    res.status(500).json({ error: 'Failed to get pages' });
  }
};

export const selectMetaPage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { pageId } = req.body;

    if (!user.metaConnection?.pages?.length) {
      res.status(400).json({ error: 'No Meta Business connection found' });
      return;
    }

    const page = user.metaConnection.pages.find((p) => p.pageId === pageId);
    if (!page) {
      res.status(404).json({ error: 'Page not found in your connected pages' });
      return;
    }

    user.socialAccounts.facebook = {
      accessToken: page.pageAccessToken,
      pageId: page.pageId,
      pageName: page.pageName,
    };

    if (page.instagramBusinessAccount) {
      user.socialAccounts.instagram = {
        accessToken: page.pageAccessToken,
        accountId: page.instagramBusinessAccount.id,
      };
    }

    await user.save();

    res.json({
      message: 'Page selected successfully',
      facebook: {
        pageId: page.pageId,
        pageName: page.pageName,
        connected: true,
      },
      instagram: page.instagramBusinessAccount ? {
        accountId: page.instagramBusinessAccount.id,
        username: page.instagramBusinessAccount.username,
        connected: true,
      } : {
        connected: false,
      },
    });
  } catch (error) {
    logger.error('Select Meta page failed:', error);
    res.status(500).json({ error: 'Failed to select page' });
  }
};

export const refreshMetaToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    if (!user.metaConnection?.userAccessToken) {
      res.status(400).json({ error: 'No Meta connection found' });
      return;
    }

    const response = await axios.get(`${GRAPH_API_URL}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: config.meta.appId,
        client_secret: config.meta.appSecret,
        fb_exchange_token: user.metaConnection.userAccessToken,
      },
    });

    user.metaConnection.userAccessToken = response.data.access_token;
    user.metaConnection.tokenExpiresAt = new Date(
      Date.now() + (response.data.expires_in || 5184000) * 1000
    );

    const pagesResponse = await axios.get(`${GRAPH_API_URL}/me/accounts`, {
      params: {
        access_token: response.data.access_token,
        fields: 'id,name,access_token,category,instagram_business_account{id,username,profile_picture_url}',
      },
    });

    const pages = pagesResponse.data.data || [];
    user.metaConnection.pages = pages.map((page: Record<string, unknown>) => {
      const igAccount = page.instagram_business_account as Record<string, string> | undefined;
      return {
        pageId: page.id as string,
        pageName: page.name as string,
        pageAccessToken: page.access_token as string,
        category: page.category as string,
        instagramBusinessAccount: igAccount ? {
          id: igAccount.id,
          username: igAccount.username,
          profilePictureUrl: igAccount.profile_picture_url,
        } : undefined,
      };
    });

    const selectedPageId = user.socialAccounts.facebook?.pageId;
    if (selectedPageId) {
      const selectedPage = user.metaConnection.pages.find((p) => p.pageId === selectedPageId);
      if (selectedPage) {
        user.socialAccounts.facebook = {
          accessToken: selectedPage.pageAccessToken,
          pageId: selectedPage.pageId,
          pageName: selectedPage.pageName,
        };
        if (selectedPage.instagramBusinessAccount) {
          user.socialAccounts.instagram = {
            accessToken: selectedPage.pageAccessToken,
            accountId: selectedPage.instagramBusinessAccount.id,
          };
        }
      }
    }

    await user.save();
    res.json({ message: 'Token refreshed successfully', tokenExpiresAt: user.metaConnection.tokenExpiresAt });
  } catch (error) {
    logger.error('Meta token refresh failed:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

export const disconnectMeta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    user.metaConnection = undefined;
    user.socialAccounts.facebook = undefined;
    user.socialAccounts.instagram = undefined;

    await user.save();
    res.json({ message: 'Meta Business disconnected successfully' });
  } catch (error) {
    logger.error('Meta disconnect failed:', error);
    res.status(500).json({ error: 'Failed to disconnect Meta' });
  }
};
