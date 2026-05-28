import { Router } from 'express';
import { register, login, getProfile, updateProfile, connectSocialAccount, disconnectSocialAccount } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/social/connect', authenticate, connectSocialAccount);
router.delete('/social/:platform', authenticate, disconnectSocialAccount);

export default router;
