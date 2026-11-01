import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { dashboardRules } from '../validators/index.js';

const router = Router();

router.get('/stats', protect, dashboardRules, validate, getDashboardStats);

export default router;
