import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Runs after express-validator chains; turns failures into a 400 with field-level details.
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result
    .array({ onlyFirstError: true })
    .map((e) => ({ field: e.path, message: e.msg }));

  return next(new ApiError(400, 'Validation failed', errors));
};
