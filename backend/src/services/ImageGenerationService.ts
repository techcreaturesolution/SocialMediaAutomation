import OpenAI from 'openai';
import axios from 'axios';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export class ImageGenerationService {
  constructor() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async generateImage(params: {
    prompt: string;
    style?: 'vivid' | 'natural';
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
  }): Promise<{ url: string; localPath: string }> {
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `Technology themed: ${params.prompt}. Modern, professional, high-quality digital art.`,
        n: 1,
        size: params.size || '1024x1024',
        quality: params.quality || 'hd',
        style: params.style || 'vivid',
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) throw new Error('No image URL returned');

      const localPath = await this.downloadImage(imageUrl);
      return { url: imageUrl, localPath };
    } catch (error) {
      logger.error('DALL-E image generation failed:', error);
      throw new Error('Failed to generate image');
    }
  }

  async generateWithStabilityAI(params: {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    steps?: number;
  }): Promise<{ localPath: string }> {
    try {
      const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          text_prompts: [
            { text: `Technology themed: ${params.prompt}`, weight: 1 },
            ...(params.negativePrompt ? [{ text: params.negativePrompt, weight: -1 }] : []),
          ],
          cfg_scale: 7,
          width: params.width || 1024,
          height: params.height || 1024,
          steps: params.steps || 30,
          samples: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.stabilityApiKey}`,
            Accept: 'application/json',
          },
        }
      );

      const imageData = response.data.artifacts[0];
      const filename = `${uuidv4()}.png`;
      const localPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(localPath, Buffer.from(imageData.base64, 'base64'));

      return { localPath };
    } catch (error) {
      logger.error('Stability AI image generation failed:', error);
      throw new Error('Failed to generate image with Stability AI');
    }
  }

  async addBrandingToImage(params: {
    imagePath: string;
    companyName: string;
    logoPath?: string;
    website: string;
    email: string;
    phone: string;
    primaryColor?: string;
  }): Promise<string> {
    try {
      const image = sharp(params.imagePath);
      const metadata = await image.metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      const brandingHeight = Math.floor(height * 0.12);
      const fontSize = Math.floor(brandingHeight * 0.35);
      const smallFontSize = Math.floor(fontSize * 0.6);
      const color = params.primaryColor || '#2563eb';

      const svgOverlay = `
        <svg width="${width}" height="${height}">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:${color};stop-opacity:0.9" />
              <stop offset="100%" style="stop-color:#1e293b;stop-opacity:0.9" />
            </linearGradient>
          </defs>
          <rect x="0" y="${height - brandingHeight}" width="${width}" height="${brandingHeight}" fill="url(#grad)" />
          <text x="${width * 0.03}" y="${height - brandingHeight * 0.55}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">${this.escapeXml(params.companyName)}</text>
          <text x="${width * 0.03}" y="${height - brandingHeight * 0.15}" font-family="Arial, sans-serif" font-size="${smallFontSize}" fill="#e2e8f0">${this.escapeXml(params.website)} | ${this.escapeXml(params.email)} | ${this.escapeXml(params.phone)}</text>
        </svg>`;

      const outputFilename = `branded_${uuidv4()}.png`;
      const outputPath = path.join(UPLOADS_DIR, outputFilename);

      await image
        .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      logger.error('Branding overlay failed:', error);
      throw new Error('Failed to add branding to image');
    }
  }

  async createThumbnail(imagePath: string, width: number = 400, height: number = 400): Promise<string> {
    const filename = `thumb_${uuidv4()}.png`;
    const outputPath = path.join(UPLOADS_DIR, filename);
    await sharp(imagePath).resize(width, height, { fit: 'cover' }).toFile(outputPath);
    return outputPath;
  }

  private async downloadImage(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const filename = `${uuidv4()}.png`;
    const localPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(localPath, response.data);
    return localPath;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const imageGenerationService = new ImageGenerationService();
