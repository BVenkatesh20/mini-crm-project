import bcrypt from 'bcrypt';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { signAccessToken } from '../utils/token.js';
import User from '../models/User.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  let valid = false;
  if (user) {
    valid = await user.comparePassword(password);
  } else {
    await bcrypt.compare(password, DUMMY_HASH);
  }

  if (!valid) {
    // Same message for unknown email and wrong password.
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({
    success: true,
    token: signAccessToken(user._id),
    user: user.toJSON(),
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});
