const logger = require("../utils/logger");

/**
 * Global error handler — must be registered LAST in the middleware stack.
 * Catches both AppError (operational) and unexpected errors.
 */
function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";

  // Log full stack for unexpected errors
  if (!err.isOperational) {
    logger.error("Unhandled error", { message: err.message, stack: err.stack });
  } else {
    logger.warn("Operational error", { code, message: err.message });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
    },
  });
}

module.exports = errorHandler;
