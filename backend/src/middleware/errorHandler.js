export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message;
  let errors = err.errors;

  if (err.name === 'ValidationError' && !err.statusCode) {
    // Mongoose schema validation
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `A record with this ${field} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  }

  if (status >= 500) {
    console.error(err);
    message = 'Internal server error';
    errors = undefined;
  }

  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};
