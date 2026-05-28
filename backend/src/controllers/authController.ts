import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, companyBranding } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const user = new User({
      email,
      password,
      name,
      companyBranding: companyBranding || {},
    });

    await user.save();
    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyBranding: user.companyBranding,
      },
    });
  } catch (error) {
    logger.error('Registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyBranding: user.companyBranding,
        socialAccounts: {
          facebook: !!user.socialAccounts.facebook?.accessToken,
          instagram: !!user.socialAccounts.instagram?.accessToken,
          twitter: !!user.socialAccounts.twitter?.accessToken,
          linkedin: !!user.socialAccounts.linkedin?.accessToken,
          youtube: !!user.socialAccounts.youtube?.accessToken,
        },
        preferences: user.preferences,
      },
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyBranding: user.companyBranding,
      socialAccounts: {
        facebook: !!user.socialAccounts.facebook?.accessToken,
        instagram: !!user.socialAccounts.instagram?.accessToken,
        twitter: !!user.socialAccounts.twitter?.accessToken,
        linkedin: !!user.socialAccounts.linkedin?.accessToken,
        youtube: !!user.socialAccounts.youtube?.accessToken,
      },
      preferences: user.preferences,
    });
  } catch (error) {
    logger.error('Get profile failed:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { name, companyBranding, preferences } = req.body;

    if (name) user.name = name;
    if (companyBranding) {
      user.companyBranding = { ...user.companyBranding, ...companyBranding };
    }
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();
    res.json({ message: 'Profile updated', user: { id: user._id, name: user.name, companyBranding: user.companyBranding, preferences: user.preferences } });
  } catch (error) {
    logger.error('Update profile failed:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const connectSocialAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { platform, credentials } = req.body;

    if (!['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].includes(platform)) {
      res.status(400).json({ error: 'Invalid platform' });
      return;
    }

    const socialAccounts = user.socialAccounts as Record<string, Record<string, string>>;
    socialAccounts[platform] = credentials;
    user.socialAccounts = socialAccounts as typeof user.socialAccounts;

    await user.save();
    res.json({ message: `${platform} connected successfully` });
  } catch (error) {
    logger.error('Connect social account failed:', error);
    res.status(500).json({ error: 'Failed to connect social account' });
  }
};

export const disconnectSocialAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { platform } = req.params;

    const socialAccounts = user.socialAccounts as Record<string, unknown>;
    socialAccounts[platform] = undefined;
    user.socialAccounts = socialAccounts as typeof user.socialAccounts;

    await user.save();
    res.json({ message: `${platform} disconnected successfully` });
  } catch (error) {
    logger.error('Disconnect social account failed:', error);
    res.status(500).json({ error: 'Failed to disconnect social account' });
  }
};
