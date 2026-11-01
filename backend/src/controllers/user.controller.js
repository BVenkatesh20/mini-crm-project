import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

// GET /api/users - id, name and email only (used for "assigned user" dropdowns).
export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('name email').sort('name').lean();
  res.json({ success: true, data: users });
});
