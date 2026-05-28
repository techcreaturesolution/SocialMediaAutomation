import Replicate from 'replicate';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export class VideoGenerationService {
  private replicate: Replicate;

  constructor() {
    this.replicate = new Replicate({ auth: config.replicateApiToken });
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async generateVideoFromText(params: {
    prompt: string;
    duration?: number;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    style?: string;
  }): Promise<{ videoUrl: string; localPath: string }> {
    try {
      logger.info(`Generating video for prompt: ${params.prompt}`);

      const output = await this.replicate.run(
        'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
        {
          input: {
            prompt: `Technology themed, professional: ${params.prompt}`,
            num_frames: Math.min((params.duration || 4) * 24, 96),
            width: params.aspectRatio === '9:16' ? 576 : 1024,
            height: params.aspectRatio === '9:16' ? 1024 : 576,
            guidance_scale: 17.5,
            num_inference_steps: 50,
          },
        }
      );

      const videoUrl = Array.isArray(output) ? output[0] : String(output);
      const localPath = await this.downloadVideo(videoUrl);

      return { videoUrl, localPath };
    } catch (error) {
      logger.error('Video generation failed:', error);
      throw new Error('Failed to generate video');
    }
  }

  async generateImageToVideo(params: {
    imageUrl: string;
    motionPrompt?: string;
    duration?: number;
  }): Promise<{ videoUrl: string; localPath: string }> {
    try {
      logger.info('Generating video from image');

      const output = await this.replicate.run(
        'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
        {
          input: {
            input_image: params.imageUrl,
            motion_bucket_id: 127,
            fps: 24,
            cond_aug: 0.02,
            num_frames: Math.min((params.duration || 4) * 24, 25),
          },
        }
      );

      const videoUrl = Array.isArray(output) ? output[0] : String(output);
      const localPath = await this.downloadVideo(videoUrl);

      return { videoUrl, localPath };
    } catch (error) {
      logger.error('Image-to-video generation failed:', error);
      throw new Error('Failed to generate video from image');
    }
  }

  async addBrandingOverlayToVideo(params: {
    videoPath: string;
    companyName: string;
    website: string;
    logoPath?: string;
  }): Promise<string> {
    const ffmpeg = await this.getFfmpeg();
    const outputFilename = `branded_${uuidv4()}.mp4`;
    const outputPath = path.join(UPLOADS_DIR, outputFilename);

    return new Promise((resolve, reject) => {
      const command = ffmpeg(params.videoPath);

      const filterText = `drawtext=text='${params.companyName.replace(/'/g, "\\'")}':fontsize=28:fontcolor=white:x=20:y=h-60:box=1:boxcolor=black@0.6:boxborderw=5,drawtext=text='${params.website.replace(/'/g, "\\'")}':fontsize=18:fontcolor=white:x=20:y=h-30:box=1:boxcolor=black@0.6:boxborderw=3`;

      command
        .videoFilters(filterText)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err: Error) => {
          logger.error('FFmpeg branding failed:', err);
          reject(new Error('Failed to add branding to video'));
        })
        .run();
    });
  }

  async getGenerationStatus(predictionId: string): Promise<{
    status: string;
    output?: string;
    error?: string;
  }> {
    try {
      const prediction = await this.replicate.predictions.get(predictionId);
      return {
        status: prediction.status,
        output: Array.isArray(prediction.output) ? prediction.output[0] : undefined,
        error: prediction.error ? String(prediction.error) : undefined,
      };
    } catch (error) {
      logger.error('Failed to get prediction status:', error);
      throw new Error('Failed to get video generation status');
    }
  }

  private async downloadVideo(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const filename = `${uuidv4()}.mp4`;
    const localPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(localPath, response.data);
    return localPath;
  }

  private async getFfmpeg(): Promise<typeof import('fluent-ffmpeg')> {
    const ffmpeg = (await import('fluent-ffmpeg')).default;
    return ffmpeg;
  }
}

export const videoGenerationService = new VideoGenerationService();
