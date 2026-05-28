import cron from 'node-cron';
import { Schedule } from '../models/Schedule';
import { Content } from '../models/Content';
import { User } from '../models/User';
import { publishingService } from './PublishingService';
import { logger } from '../utils/logger';
import { Platform } from '../types';

export class SchedulerService {
  private cronJob: cron.ScheduledTask | null = null;

  start(): void {
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processScheduledContent();
    });
    logger.info('Scheduler started — checking every minute for scheduled content');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Scheduler stopped');
    }
  }

  private async processScheduledContent(): Promise<void> {
    try {
      const now = new Date();
      const pendingSchedules = await Schedule.find({
        status: 'pending',
        scheduledAt: { $lte: now },
      }).limit(10);

      for (const schedule of pendingSchedules) {
        try {
          schedule.status = 'processing';
          await schedule.save();

          const content = await Content.findById(schedule.contentId);
          const user = await User.findById(schedule.userId);

          if (!content || !user) {
            schedule.status = 'failed';
            schedule.results = [{ platform: 'all', success: false, postId: '', postUrl: '', error: 'Content or user not found', publishedAt: new Date() }];
            await schedule.save();
            continue;
          }

          const results = await publishingService.publishToAllPlatforms(
            content,
            user,
            schedule.platforms as Platform[]
          );

          schedule.status = results.every((r) => r.success) ? 'completed' : 'failed';
          schedule.lastRunAt = now;
          schedule.results = results.map((r) => ({
            platform: r.platform,
            success: r.success,
            postId: r.postId || '',
            postUrl: r.postUrl || '',
            error: r.error || '',
            publishedAt: new Date(),
          }));

          for (const result of results) {
            const variant = content.platformVariants.find((v) => v.platform === result.platform);
            if (variant) {
              variant.status = result.success ? 'published' : 'failed';
              variant.postId = result.postId || '';
              variant.postUrl = result.postUrl || '';
              variant.publishedAt = new Date();
              variant.error = result.error || '';
            }
          }

          content.status = results.every((r) => r.success) ? 'published' : 'failed';
          await content.save();

          if (schedule.recurring && schedule.cronExpression) {
            const nextRun = this.getNextCronRun(schedule.cronExpression);
            if (nextRun) {
              await Schedule.create({
                userId: schedule.userId,
                contentId: schedule.contentId,
                platforms: schedule.platforms,
                scheduledAt: nextRun,
                timezone: schedule.timezone,
                status: 'pending',
                recurring: true,
                cronExpression: schedule.cronExpression,
              });
            }
          }

          await schedule.save();
          logger.info(`Schedule ${schedule._id} processed: ${schedule.status}`);
        } catch (error) {
          logger.error(`Schedule ${schedule._id} processing failed:`, error);
          schedule.status = 'failed';
          await schedule.save();
        }
      }
    } catch (error) {
      logger.error('Scheduler processing error:', error);
    }
  }

  private getNextCronRun(cronExpression: string): Date | null {
    try {
      const interval = cron.validate(cronExpression);
      if (!interval) return null;
      const next = new Date();
      next.setMinutes(next.getMinutes() + 1);
      return next;
    } catch {
      return null;
    }
  }
}

export const schedulerService = new SchedulerService();
