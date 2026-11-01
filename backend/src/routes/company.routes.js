import { Router } from 'express';
import { createCompany, listCompanies, getCompany } from '../controllers/company.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCompanyRules, idParam } from '../validators/index.js';

const router = Router();

router.use(protect);

router.route('/').get(listCompanies).post(createCompanyRules, validate, createCompany);
router.get('/:id', idParam, validate, getCompany);

export default router;
