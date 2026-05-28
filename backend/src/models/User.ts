import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  companyBranding: {
    name: string;
    logoUrl: string;
    website: string;
    email: string;
    phone: string;
    primaryColor: string;
    secondaryColor: string;
    tagline: string;
  };
  socialAccounts: {
    facebook?: { accessToken: string; pageId: string; pageName: string };
    instagram?: { accessToken: string; accountId: string };
    twitter?: { accessToken: string; accessSecret: string };
    linkedin?: { accessToken: string; organizationId: string };
    youtube?: { accessToken: string; refreshToken: string; channelId: string };
  };
  preferences: {
    defaultLanguage: string;
    defaultTone: string;
    autoPublish: boolean;
    defaultPlatforms: string[];
  };
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    companyBranding: {
      name: { type: String, default: '' },
      logoUrl: { type: String, default: '' },
      website: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      primaryColor: { type: String, default: '#2563eb' },
      secondaryColor: { type: String, default: '#1e40af' },
      tagline: { type: String, default: '' },
    },
    socialAccounts: {
      facebook: {
        accessToken: String,
        pageId: String,
        pageName: String,
      },
      instagram: {
        accessToken: String,
        accountId: String,
      },
      twitter: {
        accessToken: String,
        accessSecret: String,
      },
      linkedin: {
        accessToken: String,
        organizationId: String,
      },
      youtube: {
        accessToken: String,
        refreshToken: String,
        channelId: String,
      },
    },
    preferences: {
      defaultLanguage: { type: String, default: 'en' },
      defaultTone: { type: String, default: 'professional' },
      autoPublish: { type: Boolean, default: false },
      defaultPlatforms: [{ type: String }],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
