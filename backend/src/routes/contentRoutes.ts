import { Router } from 'express';
import {
  generateContent,
  publishContent,
  getContents,
  getContentById,
  deleteContent,
  getTrendingTopics,
  generateHashtags,
  getSupportedLanguages,
  translateContent,
  getDashboardStats,
} from '../controllers/contentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/generate', generateContent);
router.post('/:contentId/publish', publishContent);
router.get('/', getContents);
router.get('/dashboard', getDashboardStats);
router.get('/trending', getTrendingTopics);
router.get('/languages', getSupportedLanguages);
router.post('/hashtags', generateHashtags);
router.post('/translate', translateContent);
router.get('/:id', getContentById);
router.delete('/:id', deleteContent);

export default router;
