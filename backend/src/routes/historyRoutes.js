const { Router } = require("express");
const {
  getSessions,
  getSession,
  getStatsSummary,
  removeSession,
  getAlerts,
  markAlertsRead,
  getWeeklySummary,
  getTrends,
} = require("../controllers/historyController");
const { protect } = require("../middleware/authMiddleware");

const router = Router();

// ── All history routes require authentication ──────────────
router.use(protect);

// Aggregate stats — must be BEFORE /:requestId to avoid "stats" being parsed as a requestId
router.get("/stats/summary", getStatsSummary);

// Intelligence layer endpoints
router.get("/alerts", getAlerts);
router.post("/alerts/read", markAlertsRead);
router.get("/weekly-summary", getWeeklySummary);
router.get("/trends", getTrends);

// List all sessions (paginated)
router.get("/", getSessions);

// Get a single session with reviews
router.get("/:requestId", getSession);

// Delete a session and its reviews
router.delete("/:requestId", removeSession);

module.exports = router;
