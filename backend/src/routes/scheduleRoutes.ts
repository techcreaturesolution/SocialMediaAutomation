import { Router } from 'express';
import { getSchedules, createSchedule, cancelSchedule, updateSchedule } from '../controllers/scheduleController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSchedules);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.post('/:id/cancel', cancelSchedule);

export default router;
