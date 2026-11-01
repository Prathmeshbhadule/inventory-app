/**
 * 404 Not Found handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Please verify endpoint URL in documentation.`,
  });
};

/**
 * Centralized error-handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid resource ID format: "${err.value}". Must be a valid 24-character hexadecimal ObjectId.`;
  }

  // 2. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    message = `Duplicate Entry Conflict: A product with ${duplicatedField} "${duplicatedValue}" already exists.`;
  }

  // 3. Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database Schema Validation Error';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Log error for debugging during development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] [${req.method} ${req.url}] ${err.stack || err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: err.name || 'ServerError',
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
