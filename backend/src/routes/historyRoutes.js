const { Router } = require("express");
const {
  getSessions,
  getSession,
  getStatsSummary,
  removeSession,
} = require("../controllers/historyController");

const router = Router();

// Aggregate stats — must be BEFORE /:requestId to avoid "stats" being parsed as a requestId
router.get("/stats/summary", getStatsSummary);

// List all sessions (paginated)
router.get("/", getSessions);

// Get a single session with reviews
router.get("/:requestId", getSession);

// Delete a session and its reviews
router.delete("/:requestId", removeSession);

module.exports = router;
