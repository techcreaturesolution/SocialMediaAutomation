import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media-automation',

  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  openaiApiKey: process.env.OPENAI_API_KEY || '',
  stabilityApiKey: process.env.STABILITY_API_KEY || '',
  replicateApiToken: process.env.REPLICATE_API_TOKEN || '',

  googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',

  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
  },

  meta: {
    appId: process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || '',
    redirectUri: process.env.META_REDIRECT_URI || 'http://localhost:5000/api/meta/callback',
  },

  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
  },

  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    youtubeRedirectUri: process.env.YOUTUBE_REDIRECT_URI || '',
  },

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'social-media-automation-media',
  },

  company: {
    name: process.env.COMPANY_NAME || 'Tech Creature Solution',
    website: process.env.COMPANY_WEBSITE || 'https://techcreaturesolution.com',
    email: process.env.COMPANY_EMAIL || 'techcreaturesolution@gmail.com',
    phone: process.env.COMPANY_PHONE || '+91-XXXXXXXXXX',
    logoUrl: process.env.COMPANY_LOGO_URL || '',
  },
};
