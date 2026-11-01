import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../utils/helpers.js';
import Task from '../models/Task.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// POST /api/tasks
export const createTask = asyncHandler(async (req, res) => {
  const { title, lead, assignedTo, dueDate } = req.body;

  if (!(await Lead.exists({ _id: lead, isDeleted: false }))) {
    throw new ApiError(400, 'Lead does not exist');
  }
  if (!(await User.exists({ _id: assignedTo }))) {
    throw new ApiError(400, 'Assigned user does not exist');
  }

  // Status always starts as Pending; clients cannot set it at creation.
  const task = await Task.create({
    title,
    lead,
    assignedTo,
    dueDate,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: task });
});

// GET /api/tasks?page=&limit=&status=&assignedTo=&lead=
// Aggregation so tasks belonging to soft-deleted leads are excluded.
export const listTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, assignedTo, lead } = req.query;

  const match = {};
  if (status) match.status = status;
  if (assignedTo) match.assignedTo = toObjectId(assignedTo);
  if (lead) match.lead = toObjectId(lead);

  const [result] = await Task.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'leads',
        let: { leadId: '$lead' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$leadId'] }, isDeleted: false } },
          { $project: { name: 1 } },
        ],
        as: 'lead',
      },
    },
    { $unwind: '$lead' }, // drops tasks whose lead is deleted
    {
      $lookup: {
        from: 'users',
        let: { userId: '$assignedTo' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          { $project: { name: 1, email: 1 } },
        ],
        as: 'assignedTo',
      },
    },
    { $unwind: { path: '$assignedTo', preserveNullAndEmptyArrays: true } },
    { $project: { __v: 0 } },
    { $sort: { dueDate: 1, _id: 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result.total[0]?.count || 0;

  res.json({ success: true, data: result.data, pagination: buildPaginationMeta({ page, limit, total }) });
});

// PATCH /api/tasks/:id/status
// `requireTaskAssignee` middleware has already verified req.user is the assignee.
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = req.task;
  task.status = req.body.status;
  await task.save();

  res.json({ success: true, data: task });
});
