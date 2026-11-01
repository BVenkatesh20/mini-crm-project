import { Router } from 'express';
import { createTask, listTasks, updateTaskStatus } from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.js';
import { requireTaskAssignee } from '../middleware/taskAuth.js';
import { validate } from '../middleware/validate.js';
import { createTaskRules, listTasksRules, updateTaskStatusRules } from '../validators/index.js';

const router = Router();

router.use(protect);

router.route('/').get(listTasksRules, validate, listTasks).post(createTaskRules, validate, createTask);

// Order matters: validate input -> verify the caller is the assignee -> update.
router.patch('/:id/status', updateTaskStatusRules, validate, requireTaskAssignee, updateTaskStatus);

export default router;
