import { Response } from 'express';
import { Schedule } from '../models/Schedule';
import { Content } from '../models/Content';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const getSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (status) filter.status = status;

    const total = await Schedule.countDocuments(filter);
    const schedules = await Schedule.find(filter)
      .populate('contentId', 'title contentType status')
      .sort({ scheduledAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      schedules,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get schedules failed:', error);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
};

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contentId, platforms, scheduledAt, timezone, recurring, cronExpression } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.user!._id });
    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    const schedule = new Schedule({
      userId: req.user!._id,
      contentId,
      platforms,
      scheduledAt: new Date(scheduledAt),
      timezone: timezone || 'Asia/Kolkata',
      recurring: recurring || false,
      cronExpression: cronExpression || '',
    });

    await schedule.save();

    content.status = 'scheduled';
    content.scheduling = {
      scheduledAt: new Date(scheduledAt),
      timezone: timezone || 'Asia/Kolkata',
      recurring: recurring || false,
      cronExpression: cronExpression || '',
    };
    await content.save();

    res.status(201).json({ message: 'Schedule created', schedule });
  } catch (error) {
    logger.error('Create schedule failed:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

export const cancelSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    if (schedule.status !== 'pending') {
      res.status(400).json({ error: 'Only pending schedules can be cancelled' });
      return;
    }

    schedule.status = 'cancelled';
    await schedule.save();

    const content = await Content.findById(schedule.contentId);
    if (content) {
      content.status = 'ready';
      await content.save();
    }

    res.json({ message: 'Schedule cancelled' });
  } catch (error) {
    logger.error('Cancel schedule failed:', error);
    res.status(500).json({ error: 'Failed to cancel schedule' });
  }
};

export const updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    if (schedule.status !== 'pending') {
      res.status(400).json({ error: 'Only pending schedules can be updated' });
      return;
    }

    const { scheduledAt, platforms, timezone, recurring, cronExpression } = req.body;
    if (scheduledAt) schedule.scheduledAt = new Date(scheduledAt);
    if (platforms) schedule.platforms = platforms;
    if (timezone) schedule.timezone = timezone;
    if (recurring !== undefined) schedule.recurring = recurring;
    if (cronExpression) schedule.cronExpression = cronExpression;

    await schedule.save();
    res.json({ message: 'Schedule updated', schedule });
  } catch (error) {
    logger.error('Update schedule failed:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};
