import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  userId: mongoose.Types.ObjectId;
  contentId: mongoose.Types.ObjectId;
  platforms: string[];
  scheduledAt: Date;
  timezone: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  recurring: boolean;
  cronExpression: string;
  lastRunAt: Date;
  nextRunAt: Date;
  results: Array<{
    platform: string;
    success: boolean;
    postId: string;
    postUrl: string;
    error: string;
    publishedAt: Date;
  }>;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contentId: { type: Schema.Types.ObjectId, ref: 'Content', required: true },
    platforms: [{ type: String, required: true }],
    scheduledAt: { type: Date, required: true, index: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    recurring: { type: Boolean, default: false },
    cronExpression: { type: String, default: '' },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date },
    results: [
      {
        platform: String,
        success: Boolean,
        postId: String,
        postUrl: String,
        error: String,
        publishedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

scheduleSchema.index({ status: 1, scheduledAt: 1 });

export const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);
