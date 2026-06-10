const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Central configuration — every module reads from here, never from process.env directly.
 */
const config = {
  // ── Groq ─────────────────────────────────────────────
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  },

  // ── Server ───────────────────────────────────────────
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || "development",
  },

  // ── Rate Limiting ────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 30,
  },

  // ── Batch Processing ────────────────────────────────
  batch: {
    maxReviews: parseInt(process.env.MAX_REVIEWS_PER_REQUEST, 10) || 50,
    concurrency: parseInt(process.env.LLM_CONCURRENCY, 10) || 5,
  },

  // ── MongoDB ──────────────────────────────────────────
  db: {
    uri: process.env.MONGODB_URI || "",
  },

  // ── Domain Constants ────────────────────────────────
  allowedSentiments: ["Positive", "Neutral", "Negative"],
  allowedThemes: ["Food", "Host", "Location", "Cleanliness", "Value", "Experience"],
};

module.exports = config;
