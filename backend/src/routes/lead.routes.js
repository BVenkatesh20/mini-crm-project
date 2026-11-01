import { Router } from 'express';
import { createLead, listLeads, getLead, updateLead, deleteLead } from '../controllers/lead.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createLeadRules, updateLeadRules, listLeadsRules, idParam } from '../validators/index.js';

const router = Router();

router.use(protect); // every lead route is private

router.route('/').get(listLeadsRules, validate, listLeads).post(createLeadRules, validate, createLead);

router
  .route('/:id')
  .get(idParam, validate, getLead)
  .put(updateLeadRules, validate, updateLead)
  .delete(idParam, validate, deleteLead);

export default router;
