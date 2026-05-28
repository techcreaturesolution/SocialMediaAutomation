import { Router } from 'express';
import {
  getMetaLoginUrl,
  metaOAuthCallback,
  getMetaPages,
  selectMetaPage,
  refreshMetaToken,
  disconnectMeta,
} from '../controllers/metaOAuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/login', authenticate, getMetaLoginUrl);
router.get('/callback', metaOAuthCallback);
router.get('/pages', authenticate, getMetaPages);
router.post('/select-page', authenticate, selectMetaPage);
router.post('/refresh-token', authenticate, refreshMetaToken);
router.delete('/disconnect', authenticate, disconnectMeta);

export default router;
