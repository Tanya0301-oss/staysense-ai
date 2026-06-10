const logger = require("../utils/logger");

/**
 * Logs every incoming HTTP request with method, URL, status code,
 * and response time. Also sets the X-Response-Time header.
 */
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  // Capture response finish to calculate duration
  res.on("finish", () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = (durationNs / 1e6).toFixed(2);

    // Set response-time header (only if headers not already sent)
    if (!res.headersSent) {
      res.setHeader("X-Response-Time", `${durationMs}ms`);
    }

    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${durationMs}ms`,
      contentLength: res.get("Content-Length") || 0,
    };

    // Use appropriate log level based on status code
    if (res.statusCode >= 500) {
      logger.error("Request completed", meta);
    } else if (res.statusCode >= 400) {
      logger.warn("Request completed", meta);
    } else {
      logger.info("Request completed", meta);
    }
  });

  next();
}

module.exports = requestLogger;
