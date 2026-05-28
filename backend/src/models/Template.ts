import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  contentType: string;
  platforms: string[];
  language: string;
  tone: string;
  promptTemplate: string;
  hashtagTemplate: string[];
  brandingIncluded: boolean;
  isDefault: boolean;
}

const templateSchema = new Schema<ITemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    contentType: { type: String, required: true },
    platforms: [{ type: String }],
    language: { type: String, default: 'en' },
    tone: { type: String, default: 'professional' },
    promptTemplate: { type: String, required: true },
    hashtagTemplate: [{ type: String }],
    brandingIncluded: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
