const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const config = require("./config");
const reviewRoutes = require("./routes/reviewRoutes");
const historyRoutes = require("./routes/historyRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

const app = express();

// ── Security Headers ──────────────────────────────────────
app.use(helmet());

// ── Secure CORS ───────────────────────────────────────────
// credentials: true is required for HTTP-only cookies to be sent cross-origin
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,          // Allow cookies in cross-origin requests
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Global Rate Limiting ──────────────────────────────────
app.use(
  "/api/",
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "Too many requests. Please slow down.",
      },
    },
  })
);

// ── Stricter rate limit for auth endpoints ────────────────
// Prevents brute-force attacks on the login endpoint
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 attempts per window
    standardHeaders: false,    // Don't expose rate limit headers on auth routes
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
    message: {
      success: false,
      error: {
        code: "TOO_MANY_LOGIN_ATTEMPTS",
        message: "Too many login attempts. Please try again in 15 minutes.",
      },
    },
  })
);

// ── Body Parsing ──────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Cookie Parser ─────────────────────────────────────────
// Required to read JWT from HTTP-only cookies
app.use(cookieParser());

// ── MongoDB Query Sanitization ────────────────────────────
// Strips keys starting with $ or containing . to prevent NoSQL injection
app.use(mongoSanitize());

// ── Request Logging ───────────────────────────────────────
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/history", historyRoutes);

// Root health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "StaySense AI",
    version: "2.0.0",
    endpoints: {
      login: "POST   /api/auth/login",
      logout: "POST   /api/auth/logout",
      me: "GET    /api/auth/me",
      analyze: "POST   /api/reviews/analyze",
      health: "GET    /api/reviews/health",
      history: "GET    /api/history",
      session: "GET    /api/history/:requestId",
      stats: "GET    /api/history/stats/summary",
      deleteSession: "DELETE /api/history/:requestId",
    },
  });
});

// ── 404 Handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// ── Global Error Handler (must be last) ───────────────────
app.use(errorHandler);

module.exports = app;
