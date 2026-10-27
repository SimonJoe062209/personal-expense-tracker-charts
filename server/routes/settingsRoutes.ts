import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  exportBackup,
  importBackup,
  resetDemoData,
} from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getSettings);
router.put('/', updateSettings);
router.get('/export', exportBackup);
router.post('/import', importBackup);
router.post('/reset-demo', resetDemoData);

export default router;
