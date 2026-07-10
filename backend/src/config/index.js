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

  // ── Google OAuth ───────────────────────────────────────
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
  },

  // ── GitHub OAuth ───────────────────────────────────────
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback",
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

  // ── JWT ──────────────────────────────────────────────
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // ── Cookie ───────────────────────────────────────────
  cookie: {
    // In production cookies must only travel over HTTPS
    secure: process.env.NODE_ENV === "production",
    // strict in production prevents CSRF; lax allows dev HTTP redirects
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  },

  // ── CORS ─────────────────────────────────────────────
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },

  // ── Domain Constants ────────────────────────────────
  allowedSentiments: ["Positive", "Neutral", "Negative"],
  allowedThemes: ["Food", "Host", "Location", "Cleanliness", "Value", "Experience"],
};

module.exports = config;
