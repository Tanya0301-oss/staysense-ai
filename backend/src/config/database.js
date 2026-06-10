const mongoose = require("mongoose");
const config = require("./index");
const logger = require("../utils/logger");

/**
 * Connect to MongoDB Atlas.
 * Called once from server.js before the Express server starts listening.
 *
 * @returns {Promise<void>}
 */
async function connectDB() {
  if (!config.db.uri) {
    logger.warn(
      "MONGODB_URI is not set — database features will be unavailable"
    );
    return;
  }

  try {
    await mongoose.connect(config.db.uri);
    logger.info("MongoDB connected successfully", {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });
  } catch (err) {
    logger.error("MongoDB connection failed", { message: err.message });
    // Don't crash the server — the app can still serve AI analysis
    // but persistence will be unavailable
  }

  // ── Connection event handlers ──────────────────────────
  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error", { message: err.message });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });
}

/**
 * Gracefully disconnect from MongoDB.
 * Called from server.js during shutdown.
 *
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected gracefully");
  }
}

/**
 * Check if the database is currently connected.
 * @returns {boolean}
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, disconnectDB, isConnected };
