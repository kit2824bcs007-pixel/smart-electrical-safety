import { Router } from 'express';
import { reports } from '../controllers/reportController.js';
const router = Router();
router.get('/', reports);
export default router;
