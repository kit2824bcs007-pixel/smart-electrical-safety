import { Router } from 'express';
import { listAlerts, updateAlert } from '../controllers/alertController.js';
const router = Router();
router.get('/', listAlerts);
router.patch('/:id', updateAlert);
export default router;
