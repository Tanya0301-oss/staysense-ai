const config = require("../config");

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LEVEL =
  config.server.env === "production" ? LOG_LEVELS.info : LOG_LEVELS.debug;

/**
 * Lightweight structured logger.
 * Outputs JSON in production, human-readable lines in development.
 */
const logger = {
  _write(level, message, meta = {}) {
    if (LOG_LEVELS[level] > CURRENT_LEVEL) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };

    if (config.server.env === "production") {
      const stream = level === "error" ? process.stderr : process.stdout;
      stream.write(JSON.stringify(entry) + "\n");
    } else {
      const prefix = `[${entry.timestamp}] ${level.toUpperCase().padEnd(5)}`;
      const suffix = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      const stream = level === "error" ? console.error : console.log;
      stream(`${prefix} ${message}${suffix}`);
    }
  },

  error(msg, meta) { this._write("error", msg, meta); },
  warn(msg, meta)  { this._write("warn", msg, meta); },
  info(msg, meta)  { this._write("info", msg, meta); },
  debug(msg, meta) { this._write("debug", msg, meta); },
};

module.exports = logger;
