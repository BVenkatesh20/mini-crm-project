import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Lead from '../models/Lead.js';
import Task from '../models/Task.js';

const resolveDayWindow = ({ dayStart, dayEnd }) => {
  if (dayStart || dayEnd) {
    if (!dayStart || !dayEnd) throw new ApiError(400, 'Provide both dayStart and dayEnd');
    const start = new Date(dayStart);
    const end = new Date(dayEnd);
    if (end <= start) throw new ApiError(400, 'dayEnd must be after dayStart');
    return { start, end };
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// GET /api/dashboard/stats  - every number comes from MongoDB aggregations.
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { start, end } = resolveDayWindow(req.query);

  const [leadStats, taskStats] = await Promise.all([
    // Leads: soft-deleted leads are excluded from both counts.
    Lead.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Qualified'] }, 1, 0] } },
        },
      },
    ]),

    // Tasks: only tasks whose lead still exists (not soft-deleted) are counted.
    Task.aggregate([
      {
        $lookup: {
          from: 'leads',
          let: { leadId: '$lead' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$leadId'] }, isDeleted: false } },
            { $project: { _id: 1 } },
          ],
          as: 'activeLead',
        },
      },
      { $match: { 'activeLead.0': { $exists: true } } },
      {
        $group: {
          _id: null,
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          tasksDueToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$dueDate', start] },
                    { $lt: ['$dueDate', end] },
                    { $ne: ['$status', 'Completed'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalLeads: leadStats[0]?.totalLeads ?? 0,
      qualifiedLeads: leadStats[0]?.qualifiedLeads ?? 0,
      tasksDueToday: taskStats[0]?.tasksDueToday ?? 0,
      completedTasks: taskStats[0]?.completedTasks ?? 0,
    },
  });
});
