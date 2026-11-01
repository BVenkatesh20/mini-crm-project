import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/token.js';
import User from '../models/User.js';

/**
 * Protects private routes. Expects `Authorization: Bearer <token>`.
 * On success the authenticated user is available as `req.user`.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  const token = header.slice(7).trim();
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User no longer exists. Please log in again.');
  }

  req.user = user;
  next();
});
