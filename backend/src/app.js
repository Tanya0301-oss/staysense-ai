const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const reviewRoutes = require("./routes/reviewRoutes");
const historyRoutes = require("./routes/historyRoutes");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

const app = express();

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors());

// ── Rate Limiting ─────────────────────────────────────
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

// ── Body Parsing ──────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging ───────────────────────────────────
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────
app.use("/api/reviews", reviewRoutes);
app.use("/api/history", historyRoutes);

// Root health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "Homestay Review Sentiment Classifier",
    version: "1.0.0",
    endpoints: {
      analyze: "POST   /api/reviews/analyze",
      health: "GET    /api/reviews/health",
      history: "GET    /api/history",
      session: "GET    /api/history/:requestId",
      stats: "GET    /api/history/stats/summary",
      deleteSession: "DELETE /api/history/:requestId",
    },
  });
});

// ── 404 Handler ───────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// ── Global Error Handler (must be last) ───────────────
app.use(errorHandler);

module.exports = app;
