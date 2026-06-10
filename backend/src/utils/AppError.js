/**
 * Application-level error that carries an HTTP status code.
 * Thrown anywhere in the stack and caught by the global error handler.
 */
class AppError extends Error {
  /**
   * @param {string}  message    — Human-readable error description
   * @param {number}  statusCode — HTTP status code (default 500)
   * @param {string}  [code]     — Machine-readable error code for clients
   */
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguishes expected errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
