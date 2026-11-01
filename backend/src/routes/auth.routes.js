import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginRules } from '../validators/index.js';

const router = Router();

router.post('/login', loginRules, validate, login);
router.get('/me', protect, me);

export default router;
