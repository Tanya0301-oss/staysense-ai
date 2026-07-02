const app = require("./src/app");
const config = require("./src/config");
const logger = require("./src/utils/logger");
const { connectDB, disconnectDB } = require("./src/config/database");

// ── Validate critical env vars at startup ─────────────
if (!config.groq.apiKey) {
  logger.error("GROQ_API_KEY is not set. Server cannot start.");
  process.exit(1);
}

if (!config.jwt.secret) {
  logger.error("JWT_SECRET is not set. Server cannot start. Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
  process.exit(1);
}


// ── Bootstrap ─────────────────────────────────────────
// Connect to MongoDB first, then start the Express server.
async function start() {
  // Connect to MongoDB Atlas (non-fatal if it fails — see database.js)
  await connectDB();

  // Start Express server
  const server = app.listen(config.server.port, () => {
    logger.info(`Server running on port ${config.server.port}`, {
      env: config.server.env,
      llm: "Groq",
      model: config.groq.model,
      maxBatch: config.batch.maxReviews,
      concurrency: config.batch.concurrency,
      db: config.db.uri ? "MongoDB Atlas" : "none (no MONGODB_URI)",
    });
  });

  // ── Graceful Shutdown ─────────────────────────────────
  async function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      logger.info("Server closed");
      process.exit(0);
    });
    // Force exit after 10s if connections hang
    setTimeout(() => process.exit(1), 10_000);
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();

// ── Catch Unhandled Rejections ────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: reason?.message || reason });
});
