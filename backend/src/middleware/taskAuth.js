import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Task from '../models/Task.js';
import Lead from '../models/Lead.js';

export const requireTaskAssignee = asyncHandler(async (req, _res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const leadIsActive = await Lead.exists({ _id: task.lead, isDeleted: false });
  if (!leadIsActive) {
    throw new ApiError(404, 'Task not found');
  }

  if (!task.assignedTo.equals(req.user._id)) {
    throw new ApiError(403, 'Only the user assigned to this task can update its status.');
  }

  req.task = task;
  next();
});
