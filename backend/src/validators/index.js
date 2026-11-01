import { body, param, query } from 'express-validator';
import { LEAD_STATUSES, TASK_STATUSES, PHONE_REGEX } from '../constants.js';

export const idParam = [param('id').isMongoId().withMessage('Invalid id')];

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

// ---------- Auth ----------
export const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').bail().isEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required').bail().isString().withMessage('Password must be a string'),
];

// ---------- Leads ----------
const leadBody = [
  body('name').trim().notEmpty().withMessage('Name is required').bail().isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required').bail().isEmail().withMessage('Enter a valid email address'),
  body('phone').trim().notEmpty().withMessage('Phone is required').bail().matches(PHONE_REGEX).withMessage('Enter a valid phone number (7-20 digits, may include + - ( ) spaces)'),
  body('status').optional().isIn(LEAD_STATUSES).withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),
  body('assignedTo').optional({ values: 'falsy' }).isMongoId().withMessage('assignedTo must be a valid user id'),
  body('company').optional({ values: 'falsy' }).isMongoId().withMessage('company must be a valid company id'),
];

export const createLeadRules = leadBody;
export const updateLeadRules = [...idParam, ...leadBody];

export const listLeadsRules = [
  ...paginationQuery,
  query('status').optional({ values: 'falsy' }).isIn(LEAD_STATUSES).withMessage(`status must be one of: ${LEAD_STATUSES.join(', ')}`),
  query('assignedTo').optional({ values: 'falsy' }).isMongoId().withMessage('assignedTo must be a valid user id'),
  query('company').optional({ values: 'falsy' }).isMongoId().withMessage('company must be a valid company id'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('search must be at most 100 characters'),
];

// ---------- Companies ----------
export const createCompanyRules = [
  body('name').trim().notEmpty().withMessage('Company name is required').bail().isLength({ max: 120 }).withMessage('Company name must be at most 120 characters'),
  body('industry').optional().trim().isLength({ max: 80 }).withMessage('Industry must be at most 80 characters'),
  body('website').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Website must be at most 200 characters').bail().isURL({ require_protocol: false }).withMessage('Enter a valid website URL'),
  body('location').optional().trim().isLength({ max: 120 }).withMessage('Location must be at most 120 characters'),
];

// ---------- Tasks ----------
export const createTaskRules = [
  body('title').trim().notEmpty().withMessage('Title is required').bail().isLength({ max: 150 }).withMessage('Title must be at most 150 characters'),
  body('lead').notEmpty().withMessage('Lead is required').bail().isMongoId().withMessage('lead must be a valid lead id'),
  body('assignedTo').notEmpty().withMessage('Assignee is required').bail().isMongoId().withMessage('assignedTo must be a valid user id'),
  body('dueDate').notEmpty().withMessage('Due date is required').bail().isISO8601().withMessage('Due date must be a valid date'),
];

export const updateTaskStatusRules = [
  ...idParam,
  body('status').notEmpty().withMessage('Status is required').bail().isIn(TASK_STATUSES).withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
];

export const listTasksRules = [
  ...paginationQuery,
  query('status').optional({ values: 'falsy' }).isIn(TASK_STATUSES).withMessage(`status must be one of: ${TASK_STATUSES.join(', ')}`),
  query('assignedTo').optional({ values: 'falsy' }).isMongoId().withMessage('assignedTo must be a valid user id'),
  query('lead').optional({ values: 'falsy' }).isMongoId().withMessage('lead must be a valid lead id'),
];

// ---------- Dashboard ----------
// Optional day window (the browser sends its own local "today" boundaries).
export const dashboardRules = [
  query('dayStart').optional().isISO8601().withMessage('dayStart must be an ISO date'),
  query('dayEnd').optional().isISO8601().withMessage('dayEnd must be an ISO date'),
];
