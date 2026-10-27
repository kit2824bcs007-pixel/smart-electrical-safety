import { Router } from 'express';
import { dashboard } from '../controllers/dashboardController.js';
const router = Router();
router.get('/', dashboard);
export default router;
